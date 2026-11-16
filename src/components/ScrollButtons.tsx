"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollButtons() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on reader pages — reader has its own floating dock
  const segments = pathname.split("/").filter(Boolean);
  const isReader = segments[0] === "comic" && segments.length === 3;

  useEffect(() => {
    if (isReader) return;
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-scroll-btn]")) return;
      setVisible((v) => !v);
    };
    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, [isReader]);

  if (isReader) return null;

  return (
    <div
      data-scroll-btn
      className={`fixed bottom-6 right-4 z-50 flex flex-col gap-2 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <button
        data-scroll-btn
        onClick={(e) => { e.stopPropagation(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        aria-label="Ke atas"
        className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center hover:bg-accent hover:border-accent transition-colors active:scale-95"
      >
        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        data-scroll-btn
        onClick={(e) => { e.stopPropagation(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); }}
        aria-label="Ke bawah"
        className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center hover:bg-accent hover:border-accent transition-colors active:scale-95"
      >
        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
