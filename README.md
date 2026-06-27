# Pokémon Kaart Bulk Scanner

AI-powered bulk scanner voor Pokémon TCG kaarten. Upload één foto met meerdere kaarten (bijv. 10 stuks) en de app:

1. **Herken** elke kaart via Vision AI (Gemini, met Anthropic als fallback)
2. **Zoek** de kaart op in de [Pokémon TCG API](https://pokemontcg.io/)
3. **Toon** Cardmarket-prijzen in EUR via [TCGdex](https://tcgdex.dev/markets-prices) (geen Cardmarket API-key nodig)

## Demo flow

```
Foto (10 kaarten) → Vision AI → kaartnamen/set/nummers → Pokémon TCG API → TCGdex/Cardmarket EUR + totaal
```

## Snel starten

### 1. Installeren

```bash
npm install
cp .env.example .env.local
```

### 2. API keys instellen

| Variabele | Vereist | Beschrijving |
|-----------|---------|--------------|
| `GEMINI_API_KEY` | Eén van beide | [Google AI Studio](https://aistudio.google.com/apikey) — primair |
| `GEMINI_MODEL` | Optioneel | Standaard `gemini-2.5-flash` |
| `ANTHROPIC_API_KEY` | Eén van beide | [Anthropic Console](https://console.anthropic.com/) — fallback als Gemini faalt |
| `ANTHROPIC_MODEL` | Optioneel | Standaard `claude-sonnet-4-6` |
| `POKEMON_TCG_API_KEY` | Aanbevolen | Gratis op [dev.pokemontcg.io](https://dev.pokemontcg.io/) — kaartmatching |
| `TCGDEX_LANG` | Optioneel | Taal voor prijslookup, standaard `en` |

Prijzen komen van Cardmarket-data via TCGdex — **geen** Cardmarket OAuth-account nodig.

### 3. Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload een foto en wacht op de scan.

## Deploy op Vercel

1. Push naar GitHub
2. Importeer in Vercel
3. Voeg de environment variables toe
4. Deploy

## API

### `POST /api/scan`

```json
{
  "image": "<base64-encoded image>",
  "mimeType": "image/jpeg"
}
```

Response bevat gedetecteerde kaarten, matches, prijzen en `summary.totalMarketValue`.

### `GET /api/health`

Controleert of vision provider en Pokémon API geconfigureerd zijn.

## Architectuur

```
Next.js App Router
├── /                     → Upload UI + resultaten
├── /api/scan             → Vision AI + kaartlookup + TCGdex prijzen
└── /api/health           → Config check

src/lib/
├── vision.ts             → Gemini / Anthropic bulk detectie
├── pokemon-tcg.ts        → Pokémon TCG API client (matching)
├── tcgdex.ts             → TCGdex client (Cardmarket EUR prijzen)
└── types.ts              → Gedeelde types
```

## Tips voor betere scans

- Leg kaarten plat naast elkaar
- Goede belichting, geen reflecties
- Zorg dat kaartnaam en nummer leesbaar zijn
- Max ~12 kaarten per foto (instelbaar via `MAX_CARDS_PER_SCAN`)

## Disclaimer

Prijzen zijn indicatief op basis van Cardmarket trend via TCGdex (EUR, dagelijks bijgewerkt). Werkelijke verkoopwaarde hangt af van conditie, grading, taal/edition en marktomstandigheden.

## Licentie

MIT
