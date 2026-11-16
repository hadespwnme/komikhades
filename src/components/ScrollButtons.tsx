"use client";

import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleTap = (e: MouseEvent | TouchEvent) => {
      // Jangan toggle kalau yang di-tap adalah tombol scroll itu sendiri
      const target = e.target as HTMLElement;
      if (target.closest("[data-scroll-btn]")) return;
      setVisible((v) => !v);
    };

    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.stopPropagation(); // jangan trigger toggle
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  return (
    <div
      data-scroll-btn
      className={`fixed bottom-6 right-4 z-50 flex flex-col gap-2 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* Ke atas */}
      <button
        data-scroll-btn
        onClick={scrollToTop}
        aria-label="Ke atas"
        className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center hover:bg-accent hover:border-accent transition-colors active:scale-95"
      >
        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Ke bawah */}
      <button
        data-scroll-btn
        onClick={scrollToBottom}
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
