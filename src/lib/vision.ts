import { z } from "zod";
import type { CardCondition, DetectedCard } from "./types";

const detectedCardSchema = z.object({
  name: z.string().min(1),
  setName: z.string().optional(),
  cardNumber: z.string().optional(),
  rarity: z.string().optional(),
  condition: z
    .enum([
      "mint",
      "near_mint",
      "lightly_played",
      "moderately_played",
      "heavily_played",
      "damaged",
      "unknown",
    ])
    .default("unknown"),
  confidence: z.number().min(0).max(1).default(0.5),
  notes: z.string().optional(),
});

const visionResponseSchema = z.object({
  cards: z.array(detectedCardSchema),
});

const VISION_PROMPT = `Je bent een expert in Pokémon TCG kaarten. Analyseer de foto en identificeer ELKE zichtbare Pokémon kaart.

Regels:
- Geef alle kaarten terug die je ziet, ook als ze deels overlappen.
- Lees EERST het kaartnummer rechtsonder (bijv. 025/165) — dit is het belangrijkste veld.
- Lees daarna de setnaam zoals op de kaart gedrukt (set logo, copyright regel of set code). Raad de set NIET alleen op artwork.
- Lees de Pokémon-naam bovenaan de kaart.
- Lees rarity indien zichtbaar (Common, Uncommon, Rare, Ultra Rare, etc.).
- cardNumber: exact formaat zoals op kaart (bijv. "025/165", "TG12", "SV001").
- setName: korte officiële setnaam zoals op kaart (bijv. "151", "Paradox Rift", "Paldea Evolved", "Base Set").
- Schat conditie in op basis van zichtbare slijtage.
- confidence is 0-1 (hoe zeker je bent, vooral over nummer + set).
- Als nummer of set onleesbaar is: lage confidence, laat veld leeg i.p.v. raden.
- Antwoord ALLEEN met geldig JSON in dit formaat:
{
  "cards": [
    {
      "name": "Pikachu",
      "setName": "151",
      "cardNumber": "025/165",
      "rarity": "Common",
      "condition": "near_mint",
      "confidence": 0.92,
      "notes": "optioneel"
    }
  ]
}`;

function parseVisionJson(raw: string): DetectedCard[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = visionResponseSchema.parse(JSON.parse(cleaned));

  return parsed.cards.map((card, index) => ({
    index: index + 1,
    name: card.name.trim(),
    setName: card.setName?.trim(),
    cardNumber: card.cardNumber?.trim(),
    rarity: card.rarity?.trim(),
    condition: card.condition as CardCondition,
    confidence: card.confidence,
    notes: card.notes?.trim(),
  }));
}

function visionMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(normalized)) {
    return normalized;
  }
  return "image/jpeg";
}

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  maxCards: number,
): Promise<DetectedCard[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${VISION_PROMPT}\n\nMaximaal ${maxCards} kaarten.` },
              { inline_data: { mime_type: visionMimeType(mimeType), data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API fout (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini gaf geen resultaat terug");

  return parseVisionJson(text).slice(0, maxCards);
}

async function analyzeWithAnthropic(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  maxCards: number,
): Promise<DetectedCard[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: visionMimeType(mimeType),
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `${VISION_PROMPT}\n\nMaximaal ${maxCards} kaarten.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API fout (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Anthropic gaf geen resultaat terug");

  return parseVisionJson(text).slice(0, maxCards);
}

export async function analyzeBulkPhoto(options: {
  imageBase64: string;
  mimeType: string;
  geminiKey?: string;
  anthropicKey?: string;
  geminiModel?: string;
  anthropicModel?: string;
  maxCards: number;
}): Promise<{ cards: DetectedCard[]; provider: "gemini" | "anthropic" }> {
  const {
    imageBase64,
    mimeType,
    geminiKey,
    anthropicKey,
    geminiModel = "gemini-2.5-flash",
    anthropicModel = "claude-sonnet-4-6",
    maxCards,
  } = options;

  if (geminiKey) {
    try {
      const cards = await analyzeWithGemini(
        imageBase64,
        mimeType,
        geminiKey,
        geminiModel,
        maxCards,
      );
      return { cards, provider: "gemini" };
    } catch (geminiError) {
      if (!anthropicKey) throw geminiError;
      const geminiMessage =
        geminiError instanceof Error ? geminiError.message : "Onbekende Gemini-fout";
      console.warn("Gemini mislukt, fallback naar Anthropic:", geminiMessage);
      try {
        const cards = await analyzeWithAnthropic(
          imageBase64,
          mimeType,
          anthropicKey,
          anthropicModel,
          maxCards,
        );
        return { cards, provider: "anthropic" };
      } catch (anthropicError) {
        const anthropicMessage =
          anthropicError instanceof Error ? anthropicError.message : "Onbekende Anthropic-fout";
        throw new Error(
          `Vision AI mislukt. Gemini: ${geminiMessage}. Anthropic (fallback): ${anthropicMessage}`,
        );
      }
    }
  }

  if (anthropicKey) {
    const cards = await analyzeWithAnthropic(
      imageBase64,
      mimeType,
      anthropicKey,
      anthropicModel,
      maxCards,
    );
    return { cards, provider: "anthropic" };
  }

  throw new Error("Geen vision provider geconfigureerd (GEMINI_API_KEY of ANTHROPIC_API_KEY)");
}
