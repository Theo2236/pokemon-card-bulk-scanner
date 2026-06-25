---
name: pokemon-card-scanner
description: >-
  AI Pokémon TCG bulk scanner op Vercel. Gebruik bij wijzigingen aan vision
  detectie, Pokémon TCG API lookup, scan UI of deploy/env-configuratie.
---

# Pokémon Kaart Bulk Scanner

## Architectuur

```
Upload foto → POST /api/scan → vision.ts (Gemini/Anthropic)
  → pokemon-tcg.ts (Pokémon TCG API) → prijzen + totaal
```

Kernbestanden:
- `src/lib/vision.ts` — bulk kaartherkenning via Vision AI
- `src/lib/pokemon-tcg.ts` — Pokémon TCG API client + prijslookup
- `src/app/api/scan/route.ts` — scan endpoint
- `src/components/BulkScanner.tsx` — upload UI

## Env vars

- `GEMINI_API_KEY` primair, `ANTHROPIC_API_KEY` fallback (minstens één)
- `POKEMON_TCG_API_KEY` (aanbevolen)
- `MAX_CARDS_PER_SCAN` (optioneel, default 12)

## Scripts

- `npm run dev` — lokaal
- `npm run build` — productie build
- `npm test` — vitest
