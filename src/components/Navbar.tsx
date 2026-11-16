import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-xl font-display font-normal text-accent group-hover:text-accent2 transition-colors duration-200"
            style={{ fontFamily: "'Righteous', sans-serif", letterSpacing: "0.03em" }}
          >
            KOMIKHADES
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface2 transition-all duration-150 font-body"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Beranda
          </Link>
        </nav>
      </div>
    </header>
  );
}
