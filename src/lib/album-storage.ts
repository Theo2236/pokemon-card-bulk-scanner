import type { Album } from "@/lib/album-types";

const DB_NAME = "pokemon-scanner";
const DB_VERSION = 1;
const STORE_NAME = "albums";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function loadAllAlbums(): Promise<Album[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error ?? new Error("Load albums failed"));
    request.onsuccess = () => {
      const albums = (request.result as Album[]).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      resolve(albums);
    };

    tx.oncomplete = () => db.close();
  });
}

export async function saveAlbum(album: Album): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(album);

    request.onerror = () => reject(request.error ?? new Error("Save album failed"));
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}

export async function deleteAlbumFromStorage(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error ?? new Error("Delete album failed"));
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}
