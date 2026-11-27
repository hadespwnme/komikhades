"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const segments = pathname.split("/").filter(Boolean);
  const isReader = segments[0] === "comic" && segments.length === 3;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.refresh();
  };

  if (isReader) return null;

  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name ?? user?.email ?? "") as string;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-4 h-14 flex items-center justify-between gap-3 md:gap-5">
        {/* Logo + Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href="/" className="flex-shrink-0">
            <span
              className="text-accent hover:text-accent2 transition-colors duration-200"
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "13px", letterSpacing: "0.05em" }}
            >
              KOMIKHADES
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-md md:max-w-lg relative">
            <input
              type="text"
              placeholder="Cari komik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface2 border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {user && (
            <Link
              href="/library"
              className={`min-h-11 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                pathname === "/library"
                  ? "text-accent bg-accent/10"
                  : "text-muted hover:text-text hover:bg-surface2"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Library
            </Link>
          )}

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-surface2 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-11 h-11 p-1 rounded-full overflow-hidden border-2 border-border hover:border-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Akun"
              >
                {avatar ? (
                  <Image src={avatar} alt={name} width={32} height={32} className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-48 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-text font-medium truncate">{name}</p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                    </div>
                    <Link href="/library" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Library
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-surface2 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="min-h-11 flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-gold text-sm"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
              </svg>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
