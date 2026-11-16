import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-tight text-accent hover:text-accent-hover transition-colors"
        >
          Komikhades
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link
            href="/"
            className="hover:text-text transition-colors"
          >
            Beranda
          </Link>
        </nav>
      </div>
    </header>
  );
}
