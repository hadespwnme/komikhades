import { getComicList } from "@/lib/data";
import ComicGrid from "@/components/ComicGrid";

export const revalidate = 3600; // ISR: re-generate every hour

export default async function HomePage() {
  const comics = await getComicList();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Koleksi Komik</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          {comics.length} komik tersedia
        </p>
      </div>
      <ComicGrid comics={comics} />
    </div>
  );
}
