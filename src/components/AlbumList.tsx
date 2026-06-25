"use client";

import { useState } from "react";
import type { Album } from "@/lib/album-types";

type AlbumListProps = {
  albums: Album[];
  activeAlbumId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
};

export function AlbumList({
  albums,
  activeAlbumId,
  onSelect,
  onCreate,
  onDelete,
}: AlbumListProps) {
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName("");
    setShowForm(false);
  }

  return (
    <aside className="flex w-full flex-col gap-3 lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">
          Albums
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-yellow-400/20 px-2.5 py-1 text-xs font-medium text-yellow-300 hover:bg-yellow-400/30"
        >
          + Nieuw
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Albumnaam…"
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-yellow-300/50 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-yellow-300"
          >
            OK
          </button>
        </form>
      )}

      <div className="flex flex-col gap-1.5">
        {albums.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-sm text-white/50">
            Maak je eerste album aan om kaarten te verzamelen.
          </p>
        )}

        {albums.map((album) => {
          const isActive = album.id === activeAlbumId;
          return (
            <div
              key={album.id}
              className={`group flex items-center gap-1 rounded-xl border transition ${
                isActive
                  ? "border-yellow-400/40 bg-yellow-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(album.id)}
                className="min-w-0 flex-1 px-3 py-2.5 text-left"
              >
                <p className="truncate text-sm font-medium text-white">{album.name}</p>
                <p className="text-xs text-white/50">
                  {album.cards.length} kaart{album.cards.length !== 1 ? "en" : ""} ·{" "}
                  {album.photos.length} foto{album.photos.length !== 1 ? "’s" : ""}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Album "${album.name}" verwijderen?`)) onDelete(album.id);
                }}
                className="mr-2 rounded p-1.5 text-white/30 opacity-0 transition hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100"
                title="Album verwijderen"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
