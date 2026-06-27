"use client";

import { useCallback, useEffect, useState } from "react";
import type { Album, AlbumCardEntry, AlbumPhoto } from "@/lib/album-types";
import { deleteAlbumFromStorage, loadAllAlbums, saveAlbum } from "@/lib/album-storage";
import { isSuspiciousMatch } from "@/lib/match-utils";
import type { ScanResponse } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID();
}

function createEmptyAlbum(name: string): Album {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    photos: [],
    cards: [],
  };
}

function sortAlbums(albums: Album[]): Album[] {
  return [...albums].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadAllAlbums().then((loaded) => {
      setAlbums(loaded);
      if (loaded.length > 0 && !activeAlbumId) {
        setActiveAlbumId(loaded[0].id);
      }
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAlbum = useCallback(
    async (albumId: string, updater: (album: Album) => Album) => {
      let updated: Album | null = null;

      setAlbums((prev) => {
        const album = prev.find((item) => item.id === albumId);
        if (!album) return prev;

        updated = {
          ...updater(album),
          updatedAt: new Date().toISOString(),
        };

        return sortAlbums(prev.map((item) => (item.id === albumId ? updated! : item)));
      });

      if (updated) {
        await saveAlbum(updated);
      }

      return updated;
    },
    [],
  );

  const createAlbum = useCallback(async (name: string) => {
    const album = createEmptyAlbum(name);
    await saveAlbum(album);
    setAlbums((prev) => sortAlbums([album, ...prev]));
    setActiveAlbumId(album.id);
    return album;
  }, []);

  const deleteAlbum = useCallback(
    async (id: string) => {
      await deleteAlbumFromStorage(id);
      setAlbums((prev) => {
        const next = prev.filter((album) => album.id !== id);
        if (activeAlbumId === id) {
          setActiveAlbumId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeAlbumId],
  );

  const renameAlbum = useCallback(
    async (id: string, name: string) => {
      await updateAlbum(id, (album) => ({ ...album, name }));
    },
    [updateAlbum],
  );

  const addScanToAlbum = useCallback(
    async (
      albumId: string,
      scan: ScanResponse,
      imageDataUrl: string,
      mimeType: string,
    ) => {
      const photoId = generateId();
      const photo: AlbumPhoto = {
        id: photoId,
        imageDataUrl,
        mimeType,
        scannedAt: scan.scannedAt,
      };

      const newCards: AlbumCardEntry[] = scan.cards.map((matched) => ({
        id: generateId(),
        photoId,
        scannedAt: scan.scannedAt,
        detected: matched.detected,
        matchStatus: matched.matchStatus,
        card: matched.card,
        searchQuery: matched.searchQuery,
        error: matched.error,
      }));

      await updateAlbum(albumId, (album) => ({
        ...album,
        photos: [...album.photos, photo],
        cards: [...album.cards, ...newCards],
      }));
    },
    [updateAlbum],
  );

  const updateCardPurchasePrice = useCallback(
    async (albumId: string, cardId: string, purchasePrice: number | undefined) => {
      await updateAlbum(albumId, (album) => ({
        ...album,
        cards: album.cards.map((card) =>
          card.id === cardId ? { ...card, purchasePrice } : card,
        ),
      }));
    },
    [updateAlbum],
  );

  const removeCard = useCallback(
    async (albumId: string, cardId: string) => {
      await updateAlbum(albumId, (album) => ({
        ...album,
        cards: album.cards.filter((card) => card.id !== cardId),
      }));
    },
    [updateAlbum],
  );

  const removeCards = useCallback(
    async (albumId: string, cardIds: string[]) => {
      const ids = new Set(cardIds);
      await updateAlbum(albumId, (album) => ({
        ...album,
        cards: album.cards.filter((card) => !ids.has(card.id)),
      }));
    },
    [updateAlbum],
  );

  const removeSuspiciousCards = useCallback(
    async (albumId: string) => {
      await updateAlbum(albumId, (album) => ({
        ...album,
        cards: album.cards.filter((card) => !isSuspiciousMatch(card)),
      }));
    },
    [updateAlbum],
  );

  const removePhoto = useCallback(
    async (albumId: string, photoId: string) => {
      await updateAlbum(albumId, (album) => ({
        ...album,
        photos: album.photos.filter((photo) => photo.id !== photoId),
        cards: album.cards.filter((card) => card.photoId !== photoId),
      }));
    },
    [updateAlbum],
  );

  const activeAlbum = albums.find((album) => album.id === activeAlbumId) ?? null;

  return {
    albums,
    activeAlbum,
    activeAlbumId,
    setActiveAlbumId,
    isLoading,
    createAlbum,
    deleteAlbum,
    renameAlbum,
    addScanToAlbum,
    updateCardPurchasePrice,
    removeCard,
    removeCards,
    removeSuspiciousCards,
    removePhoto,
  };
}
