"use client";

import { useCallback, useEffect, useState } from "react";
import type { Album, AlbumCardEntry, AlbumPhoto } from "@/lib/album-types";
import { deleteAlbumFromStorage, loadAllAlbums, saveAlbum } from "@/lib/album-storage";
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

  const persist = useCallback(async (album: Album) => {
    const updated = { ...album, updatedAt: new Date().toISOString() };
    await saveAlbum(updated);
    setAlbums((prev) => {
      const idx = prev.findIndex((a) => a.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
    return updated;
  }, []);

  const createAlbum = useCallback(
    async (name: string) => {
      const album = createEmptyAlbum(name);
      await persist(album);
      setActiveAlbumId(album.id);
      return album;
    },
    [persist],
  );

  const deleteAlbum = useCallback(
    async (id: string) => {
      await deleteAlbumFromStorage(id);
      setAlbums((prev) => {
        const next = prev.filter((a) => a.id !== id);
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
      const album = albums.find((a) => a.id === id);
      if (!album) return;
      await persist({ ...album, name });
    },
    [albums, persist],
  );

  const addScanToAlbum = useCallback(
    async (
      albumId: string,
      scan: ScanResponse,
      imageDataUrl: string,
      mimeType: string,
    ) => {
      const album = albums.find((a) => a.id === albumId);
      if (!album) return;

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

      await persist({
        ...album,
        photos: [...album.photos, photo],
        cards: [...album.cards, ...newCards],
      });
    },
    [albums, persist],
  );

  const updateCardPurchasePrice = useCallback(
    async (albumId: string, cardId: string, purchasePrice: number | undefined) => {
      const album = albums.find((a) => a.id === albumId);
      if (!album) return;

      await persist({
        ...album,
        cards: album.cards.map((c) =>
          c.id === cardId ? { ...c, purchasePrice } : c,
        ),
      });
    },
    [albums, persist],
  );

  const removeCard = useCallback(
    async (albumId: string, cardId: string) => {
      const album = albums.find((a) => a.id === albumId);
      if (!album) return;

      await persist({
        ...album,
        cards: album.cards.filter((c) => c.id !== cardId),
      });
    },
    [albums, persist],
  );

  const removePhoto = useCallback(
    async (albumId: string, photoId: string) => {
      const album = albums.find((a) => a.id === albumId);
      if (!album) return;

      await persist({
        ...album,
        photos: album.photos.filter((p) => p.id !== photoId),
        cards: album.cards.filter((c) => c.photoId !== photoId),
      });
    },
    [albums, persist],
  );

  const activeAlbum = albums.find((a) => a.id === activeAlbumId) ?? null;

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
    removePhoto,
  };
}
