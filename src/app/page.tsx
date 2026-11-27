import { promises as fs } from "fs";
import path from "path";
import { getComicList } from "@/lib/data";
import ComicGrid from "@/components/ComicGrid";
import PopularToday from "@/components/PopularToday";

export const revalidate = 3600;

export default async function HomePage() {
  const comics = await getComicList();

  // Load rankings data
  let rankings = { recommendation: [], daily: [], weekly: [], all_time: [] };
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "public", "data", "rankings.json"),
      "utf-8"
    );
    rankings = JSON.parse(raw);
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero header */}
      <div className="relative border-b border-border overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-accent/3 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-2">
                Koleksi Komik
              </p>
              <h1
                className="text-3xl sm:text-4xl text-text"
                style={{ fontFamily: "'Righteous', sans-serif" }}
              >
                Baca Komik
                <span className="text-accent"> Favoritmu</span>
              </h1>
              <p className="text-muted text-sm mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Tanpa khawatir dengan ads.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Popular Today / Rankings */}
        <PopularToday rankings={rankings} />

        {/* All comics grid */}
        <ComicGrid comics={comics} />
      </div>
    </div>
  );
}
