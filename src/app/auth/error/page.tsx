import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      style={{ fontFamily: "'Poppins', sans-serif" }}>
      <p className="text-4xl">⚠️</p>
      <p className="text-text font-medium">Login gagal</p>
      <p className="text-muted text-sm">Terjadi kesalahan saat proses autentikasi.</p>
      <Link href="/" className="mt-2 px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent2 transition-colors">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
