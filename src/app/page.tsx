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
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-4 py-8 md:py-10">
        {/* Popular Today / Rankings */}
        <PopularToday rankings={rankings} />

        {/* All comics grid */}
        <ComicGrid comics={comics} />
      </div>
    </div>
  );
}
