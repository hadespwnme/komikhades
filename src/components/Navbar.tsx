"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hide navbar entirely inside reader: /comic/[slug]/[chapter]
  // Reader route has 4 segments: "", "comic", slug, chapter
  const segments = pathname.split("/").filter(Boolean);
  const isReader = segments[0] === "comic" && segments.length === 3;

  if (isReader) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-accent group-hover:text-accent2 transition-colors duration-200"
            style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "13px", letterSpacing: "0.05em" }}
          >
            KOMIKHADES
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2 transition-all duration-150"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Beranda
          </Link>
        </nav>
      </div>
    </header>
  );
}
