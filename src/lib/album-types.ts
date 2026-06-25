import type { DetectedCard, MatchedCard } from "@/lib/types";

export type AlbumCardEntry = {
  id: string;
  photoId: string;
  scannedAt: string;
  detected: DetectedCard;
  matchStatus: MatchedCard["matchStatus"];
  card?: MatchedCard["card"];
  searchQuery: string;
  error?: string;
  purchasePrice?: number;
};

export type AlbumPhoto = {
  id: string;
  imageDataUrl: string;
  mimeType: string;
  scannedAt: string;
};

export type Album = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  photos: AlbumPhoto[];
  cards: AlbumCardEntry[];
};

export type AlbumSummary = {
  totalCards: number;
  totalMarketValueUsd: number;
  totalPurchasePriceEur: number;
  totalPnlEur: number;
  matched: number;
  partial: number;
  notFound: number;
};
