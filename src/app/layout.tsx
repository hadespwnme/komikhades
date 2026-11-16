import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Komikhades",
    template: "%s | Komikhades",
  },
  description: "Baca komik manhwa online gratis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-muted py-6 border-t border-border">
          © {new Date().getFullYear()} Komikhades · Data from komiku.org
        </footer>
      </body>
    </html>
  );
}
