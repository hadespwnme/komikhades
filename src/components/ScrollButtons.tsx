"use client";

import { useEffect, useState, useCallback } from "react";

export default function ScrollButtons() {
  const [visible, setVisible] = useState(false);   // auto-show when scrolled
  const [pinned, setPinned] = useState(false);      // manually toggled visible
  const [show, setShow] = useState(false);          // final visibility

  // Show when scrolled away from top
  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    // Auto-visible when not at very top and not at very bottom edge
    setVisible(y > 200 && maxY > 200);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Final visibility: auto-visible OR pinned by user tap
  useEffect(() => {
    setShow(visible || pinned);
  }, [visible, pinned]);

  // When user taps: if currently showing → hide (pin off), if hidden → pin on
  const handleToggle = () => {
    if (show) {
      setPinned(false);
      setVisible(false); // force hide until next scroll threshold
    } else {
      setPinned(true);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });

  return (
    <>
      {/* Toggle trigger — always visible, bottom-right corner, tiny */}
      <button
        onClick={handleToggle}
        aria-label={show ? "Sembunyikan tombol scroll" : "Tampilkan tombol scroll"}
        className="fixed bottom-5 right-4 z-50 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center transition-all duration-200 hover:border-accent/50 hover:bg-surface3"
        style={{ cursor: "pointer" }}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-300 ${show ? "text-accent" : "text-muted"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      </button>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        className={`fixed bottom-16 right-4 z-50 w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center transition-all duration-200 hover:bg-accent hover:border-accent hover:text-white active:scale-95 ${
          show
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <svg className="w-4 h-4 text-muted group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Go to Bottom */}
      <button
        onClick={scrollToBottom}
        aria-label="Ke bawah halaman"
        className={`fixed bottom-28 right-4 z-50 w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center transition-all duration-200 hover:bg-accent hover:border-accent hover:text-white active:scale-95 ${
          show
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </>
  );
}
