# Komikhades

Website komik berbasis Next.js yang scrape data dari [komiku.org](https://komiku.org), siap deploy ke Vercel.

## Fitur

- 🃏 Halaman depan dengan kartu komik + cover
- 📖 Daftar chapter per komik dengan pencarian
- 🖼️ Reader gambar yang load langsung dari CDN komiku.org
- 💾 Progress baca tersimpan di localStorage (chapter + halaman terakhir)
- 🤖 GitHub Action scraping otomatis harian

## Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Scraper | Python 3.11 + requests + BeautifulSoup4 |
| Hosting | Vercel |
| Data storage | JSON di `public/data/` (di-commit ke repo) |

## Setup Lokal

```bash
# 1. Install Node dependencies
npm install

# 2. Buat virtual environment Python & install scraper dependencies
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r scraper/requirements.txt

# 3. Jalankan scraper (ambil metadata Gosu saja, cepat ~1 detik)
python scraper/scrape.py --no-pages

# 4. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Tambah komik lain

```bash
# Scrape beberapa komik sekaligus (pakai slug dari URL komiku.org/manga/{slug}/)
python scraper/scrape.py --no-pages --comics gosu,study-group,solo-leveling
```

### Scrape halaman chapter (opsional)

Chapter images dimuat secara on-demand dari CDN komiku.org saat reader dibuka.
Kalau mau pre-scrape supaya lebih cepat:

```bash
python scraper/scrape.py --comics gosu   # tanpa --no-pages
```

> ⚠️ Ini akan scrape semua 234+ chapter Gosu, butuh ~2-5 menit.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Buka [vercel.com/new](https://vercel.com/new), import repo ini.
3. Vercel akan auto-detect Next.js — klik **Deploy**.
4. Selesai. Setiap push ke `main` akan trigger deploy otomatis.

## GitHub Action — Scraping Otomatis

Action di `.github/workflows/scrape.yml` akan:

1. Jalan setiap hari jam 06:00 UTC (13:00 WIB).
2. Jalankan scraper untuk memperbarui metadata chapter.
3. Commit perubahan ke `public/data/` jika ada yang baru.
4. Vercel otomatis deploy ulang setelah ada commit baru.

**Trigger manual:**
1. Buka tab **Actions** di GitHub.
2. Pilih workflow **Scrape Comics**.
3. Klik **Run workflow**.

**Trigger Vercel deploy hook (opsional):**

Kalau ingin force-deploy tanpa push kode, tambahkan secret `VERCEL_DEPLOY_HOOK` ke repo GitHub dengan nilai deploy hook URL dari Vercel dashboard.

## Tambah Komik Baru

1. Tambahkan slug ke list di workflow (edit `workflow_dispatch.inputs.comics` default) **atau** jalankan manual dengan slug yang diinginkan.
2. Data JSON akan tersimpan di `public/data/{slug}.json` dan entri baru muncul di `public/data/comics.json`.
3. Halaman komik otomatis tersedia di `/comic/{slug}`.

## Struktur Proyek

```
komikhades/
├── public/data/           # Data komik (JSON, di-commit)
│   ├── comics.json        # Index semua komik
│   └── gosu.json          # Data + chapter list per komik
├── scraper/
│   ├── scrape.py          # Scraper utama
│   └── requirements.txt
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Homepage
│   │   └── comic/[slug]/
│   │       ├── page.tsx                    # Halaman komik
│   │       └── [chapter]/page.tsx          # Reader
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ComicCard.tsx
│   │   ├── ComicGrid.tsx
│   │   ├── ChapterList.tsx
│   │   └── ReaderClient.tsx
│   ├── hooks/useReadingProgress.ts
│   ├── lib/data.ts
│   └── types/comic.ts
└── .github/workflows/scrape.yml
```
