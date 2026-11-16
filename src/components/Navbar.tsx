"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleLogin = () => {
    router.push("/login");
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
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-accent group-hover:text-accent2 transition-colors duration-200"
            style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "13px", letterSpacing: "0.05em" }}
          >
            KOMIKHADES
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Library link */}
          {user && (
            <Link
              href="/library"
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                pathname === "/library"
                  ? "text-accent bg-accent/10"
                  : "text-muted hover:text-text hover:bg-surface2"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Library
            </Link>
          )}

          {/* Auth button */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-surface2 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-border hover:border-accent transition-colors focus:outline-none"
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

              {/* Dropdown */}
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
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent2 transition-colors"
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
