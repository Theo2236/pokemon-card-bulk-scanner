<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pokémon Kaart Bulk Scanner

AI bulk scanner: upload een foto met meerdere Pokémon kaarten → Vision AI herkent ze → Pokémon TCG API matcht kaarten → TCGdex levert Cardmarket EUR-prijzen.

## Env vars

- `GEMINI_API_KEY` primair, `ANTHROPIC_API_KEY` fallback (vision)
- `POKEMON_TCG_API_KEY` (kaartidentificatie, afbeeldingen)
- `TCGDEX_LANG` optioneel (standaard `en`) — taal voor TCGdex prijslookup

## Learned User Preferences

- Antwoord in het Nederlands.
- Wil Cardmarket-prijzen in EUR, geen TCGPlayer USD (gebruiker woont in Europa).
- Wil foto's uit de iPhone-bibliotheek kunnen kiezen, niet alleen via de camera.
- Wil scanresultaten eerst controleren vóór toevoegen aan een album; foute of twijfelachtige kaarten moeten verwijderbaar zijn.

## Learned Workspace Facts

- Productie draait op Vercel: pokemon-card-bulk-scanner.vercel.app.
- Officiële Cardmarket API accepteert geen nieuwe aanvragen; gebruik TCGdex voor Cardmarket EUR-prijzen (geen OAuth-keys nodig).
- iPhone-bibliotheekfoto's zijn vaak HEIC; client-side normalisatie naar JPEG vóór Vision AI-upload.
- Kaartmatching via Pokémon TCG API; marktprijzen via TCGdex (Cardmarket trend/avg/low in EUR).
- Upload-UI heeft aparte knoppen Bibliotheek en Camera (`capture="environment"` opent op iPhone alleen de camera).
- Na elke scan: review-stap (`PendingScanReview`) vóór album-toevoeging; twijfelachtige matches via `isSuspiciousMatch`.
