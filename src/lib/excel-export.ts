import * as XLSX from "xlsx";
import type { Album, AlbumSummary } from "@/lib/album-types";
import { bestMarketPrice, conditionLabel, statusLabel } from "@/lib/format";

function cardMarketEur(card: Album["cards"][number]): number | undefined {
  return bestMarketPrice({
    detected: card.detected,
    matchStatus: card.matchStatus,
    card: card.card,
    searchQuery: card.searchQuery,
  });
}

export function computeAlbumSummary(album: Album): AlbumSummary {
  let totalMarketValueEur = 0;
  let totalPurchasePriceEur = 0;
  let matched = 0;
  let partial = 0;
  let notFound = 0;

  for (const card of album.cards) {
    const market = cardMarketEur(card);
    if (market !== undefined) totalMarketValueEur += market;
    if (card.purchasePrice !== undefined) totalPurchasePriceEur += card.purchasePrice;

    switch (card.matchStatus) {
      case "matched":
        matched += 1;
        break;
      case "partial":
        partial += 1;
        break;
      case "not_found":
        notFound += 1;
        break;
      default: {
        const _exhaustive: never = card.matchStatus;
        void _exhaustive;
      }
    }
  }

  const totalPnlEur = totalMarketValueEur - totalPurchasePriceEur;

  return {
    totalCards: album.cards.length,
    totalMarketValueEur,
    totalPurchasePriceEur,
    totalPnlEur,
    matched,
    partial,
    notFound,
  };
}

export function exportAlbumToExcel(album: Album): void {
  const summary = computeAlbumSummary(album);

  const rows = album.cards.map((card) => {
    const marketEur = cardMarketEur(card);
    const purchase = card.purchasePrice;
    const pnl =
      marketEur !== undefined && purchase !== undefined ? marketEur - purchase : undefined;

    return {
      Naam: card.card?.name ?? card.detected.name,
      Set: card.card?.set ?? card.detected.setName ?? "",
      Nummer: card.card?.number ?? card.detected.cardNumber ?? "",
      Zeldzaamheid: card.card?.rarity ?? card.detected.rarity ?? "",
      Conditie: conditionLabel(card.detected.condition),
      Status: statusLabel(card.matchStatus),
      "Marktprijs (EUR)": marketEur !== undefined ? Math.round(marketEur * 100) / 100 : "",
      "Betaald (EUR)": purchase ?? "",
      "PnL (EUR)": pnl !== undefined ? Math.round(pnl * 100) / 100 : "",
      "Gescand op": new Date(card.scannedAt).toLocaleString("nl-NL"),
      Cardmarket: card.card?.cardmarketUrl ?? "",
    };
  });

  const summaryRows = [
    {},
    { Naam: "SAMENVATTING" },
    { Naam: "Album", Set: album.name },
    { Naam: "Totaal kaarten", Set: summary.totalCards },
    { Naam: "Matches", Set: summary.matched },
    { Naam: "Gedeeltelijk", Set: summary.partial },
    { Naam: "Niet gevonden", Set: summary.notFound },
    {
      Naam: "Totale marktwaarde (EUR)",
      Set: Math.round(summary.totalMarketValueEur * 100) / 100,
    },
    { Naam: "Totaal betaald (EUR)", Set: Math.round(summary.totalPurchasePriceEur * 100) / 100 },
    { Naam: "Totale PnL (EUR)", Set: Math.round(summary.totalPnlEur * 100) / 100 },
    { Naam: "Foto's in album", Set: album.photos.length },
  ];

  const sheet = XLSX.utils.json_to_sheet([...rows, ...summaryRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Kaarten");

  const safeName = album.name.replace(/[^\w\s-]/g, "").trim() || "album";
  XLSX.writeFile(workbook, `${safeName}-kaarten.xlsx`);
}
