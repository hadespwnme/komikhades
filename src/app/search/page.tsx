import { getComicList } from "@/lib/data";
import SearchClient from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const comics = await getComicList();

  return <SearchClient comics={comics} initialQuery={q ?? ""} />;
}
