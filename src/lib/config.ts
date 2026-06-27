const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

export function getConfig() {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const pokemonKey = process.env.POKEMON_TCG_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const anthropicModel =
    process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  const tcgdexLang = process.env.TCGDEX_LANG?.trim() || "en";

  const maxCards = Number.parseInt(process.env.MAX_CARDS_PER_SCAN ?? "12", 10);

  return {
    geminiKey,
    anthropicKey,
    pokemonKey,
    geminiModel,
    anthropicModel,
    tcgdexLang,
    maxCards: Number.isFinite(maxCards) && maxCards > 0 ? maxCards : 12,
    hasVisionProvider: Boolean(geminiKey || anthropicKey),
    preferredVisionProvider: geminiKey
      ? ("gemini" as const)
      : anthropicKey
        ? ("anthropic" as const)
        : null,
  };
}
