import { AlbumManager } from "@/components/AlbumManager";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <AlbumManager />
    </main>
  );
}
