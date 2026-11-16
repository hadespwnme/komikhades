import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "Komikhades",
    template: "%s | Komikhades",
  },
  description: "Baca komik manhwa online gratis — Komikhades",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-bg text-text antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-muted py-6 border-t border-border">
          © {new Date().getFullYear()} Komikhades
        </footer>
      </body>
    </html>
  );
}
