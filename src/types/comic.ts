export interface Chapter {
  slug: string;
  number: string;
  date: string;
  chapter_id: number;
  page_count: number;
  pages: string[];
}

export interface Comic {
  slug: string;
  title: string;
  thumbnail: string;
  alt_title: string;
  type: string;
  genres: string[];
  author: string;
  status: string;
  synopsis: string;
  chapters: Chapter[];
}

export interface ComicSummary {
  slug: string;
  title: string;
  thumbnail: string;
  alt_title: string;
  type: string;
  genres: string[];
  author: string;
  status: string;
  synopsis: string;
  chapter_count: number;
  latest_chapter: string;
  latest_date: string;
}

/** Stored in localStorage */
export interface ReadingProgress {
  /** chapter slug, e.g. "gosu-chapter-5" */
  lastChapter: string;
  /** chapter number string, e.g. "5" */
  lastChapterNum: string;
  /** page index (0-based) */
  lastPage: number;
  updatedAt: number;
}

export type ProgressMap = Record<string, ReadingProgress>;
