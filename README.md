# Sistem Absensi Pos Security — SPPG

Aplikasi absensi sederhana untuk dapur SPPG. Pegawai setor kehadiran ke **pos security**, security mencatat status + jam masuk & pulang secara manual. Divisi penanggung jawab (Korlap, Akuntan, Ka SPPG) memantau dan mengekspor rekapitulasi ke Excel.

Stack serba gratis: **Next.js + TypeScript + Prisma + PostgreSQL (Supabase)**, deploy di **Vercel**.

---

## 1. Ringkasan Fitur

| Modul | Deskripsi |
|---|---|
| **Setor & Catat** | Security pilih tanggal, set status (Hadir/Izin/Alpha), isi jam masuk & pulang manual (tombol "sekarang" atau ketik). |
| **Monitor Kehadiran** | Pantau per tanggal (navigasi tanggal), ringkasan jumlah status, tabel jam masuk/pulang per divisi pemantau. |
| **Export Excel** | Rekap per hari / minggu / 2 minggu / bulan. 2 sheet: Detail (per pegawai per hari) + Rekap (agregat). |
| **Data Pegawai** | CRUD pegawai, dropdown divisi dinamis, dikelompokkan per divisi. |
| **Kelola Divisi** | CRUD divisi dinamis + jam acuan masuk/pulang per divisi + flag `pantau` (diabsen ↔ pemantau). |

**Konsep kunci:**
- **Jam acuan** = patokan per divisi (mis. Juru Masak 03:00). **Jam aktual** = realita, diisi manual security. Dapur fleksibel, acuan tidak mengikat.
- **Divisi pemantau** (`isPantau = true`) muncul di tab Monitor. Sisanya diabsen biasa. Flag bisa diubah kapan saja.

---

## 2. Tech Stack & Alasan (semua gratis)

| Layer | Pilihan | Catatan free tier |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Gratis, native di Vercel |
| Bahasa | **TypeScript** | — |
| Database | **PostgreSQL via Supabase** | Free tier 500MB, cukup untuk ini |
| ORM | **Prisma** | Gratis, migration & type-safe |
| Hosting | **Vercel** | Hobby plan gratis |
| Excel | **SheetJS (xlsx)** sisi browser ATAU `exceljs` sisi server | Generate file langsung, tanpa biaya |
| Styling | **Tailwind CSS** | Brand: Gold `#F3C623`, Navy `#092F54`, font Plus Jakarta Sans |
| Auth (opsional) | **Supabase Auth** | Free, untuk login security |

> **Catatan koneksi Supabase + Prisma:** gunakan **dua** connection string — `DATABASE_URL` (pooled, port 6543, untuk runtime serverless Vercel) dan `DIRECT_URL` (direct, port 5432, untuk `prisma migrate`). Wajib agar tidak kehabisan koneksi di serverless.

---

## 3. Arsitektur

```
Browser (security / pemantau)
        │
        ▼
Next.js App Router (Vercel)
 ├─ /app           → halaman & UI (React Server + Client Components)
 ├─ /app/api/*     → Route Handlers (REST sederhana)
 │     └─ Prisma Client → Supabase Postgres (pooled)
 └─ Export Excel   → SheetJS di client, fetch data dari API
```

Pola data: **absensi disimpan per (pegawai, tanggal)**. Satu baris = kehadiran satu pegawai pada satu hari. Ini fondasi untuk monitor per-tanggal dan rekap multi-periode.

---

## 4. Skema Database (Prisma)

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pooled (pgbouncer, :6543)
  directUrl = env("DIRECT_URL")        // direct (:5432) untuk migrate
}

model Divisi {
  id        String    @id @default(cuid())
  nama      String
  isPantau  Boolean   @default(false)   // true = divisi pemantau (Korlap/Akuntan/Ka SPPG)
  jamMasuk  String                       // acuan, format "HH:MM"
  jamPulang String                       // acuan, format "HH:MM"
  pegawai   Pegawai[]
  createdAt DateTime  @default(now())
}

model Pegawai {
  id        String     @id @default(cuid())
  nik       String     @unique
  nama      String
  divisiId  String
  divisi    Divisi     @relation(fields: [divisiId], references: [id])
  absensi   Absensi[]
  createdAt DateTime   @default(now())
}

enum StatusKehadiran {
  HADIR
  IZIN
  ALPHA
}

model Absensi {
  id         String          @id @default(cuid())
  pegawaiId  String
  pegawai    Pegawai         @relation(fields: [pegawaiId], references: [id], onDelete: Cascade)
  tanggal    DateTime        @db.Date          // tanggal kehadiran (tanpa jam)
  status     StatusKehadiran
  jamMasuk   String?                            // aktual "HH:MM", null jika izin/alpha
  jamPulang  String?
  dicatatOleh String?                           // opsional: id/nama security
  updatedAt  DateTime        @updatedAt

  @@unique([pegawaiId, tanggal])               // 1 record per pegawai per hari
  @@index([tanggal])
}
```

> Status `BELUM` di UI = tidak ada baris `Absensi` untuk hari itu (jangan disimpan ke DB). Hitung sebagai "belum setor" saat agregasi.

---

## 5. Struktur Folder

```
absensi-sppg/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts                 # seed divisi + pegawai contoh
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             # redirect ke /absen
│  │  ├─ absen/page.tsx       # tab Setor & Catat
│  │  ├─ monitor/page.tsx     # tab Monitor + export
│  │  ├─ pegawai/page.tsx     # CRUD pegawai
│  │  ├─ divisi/page.tsx      # CRUD divisi
│  │  └─ api/
│  │     ├─ divisi/route.ts            # GET, POST
│  │     ├─ divisi/[id]/route.ts       # PATCH, DELETE
│  │     ├─ pegawai/route.ts           # GET, POST
│  │     ├─ pegawai/[id]/route.ts      # PATCH, DELETE
│  │     ├─ absensi/route.ts           # GET (?tanggal=), POST/PUT upsert
│  │     └─ rekap/route.ts             # GET (?mode=&anchor=) → data untuk Excel
│  ├─ components/             # Avatar, Badge, TimeField, dst (port dari mockup)
│  ├─ lib/
│  │  ├─ prisma.ts            # singleton Prisma Client
│  │  ├─ dates.ts             # toKey, addDays, periodeRange
│  │  └─ excel.ts             # buildWorkbook(detail, rekap)
│  └─ styles/globals.css
├─ .env                       # JANGAN commit
├─ .env.example
├─ package.json
└─ README.md
```

---

## 6. API Kontrak

| Method | Endpoint | Query/Body | Hasil |
|---|---|---|---|
| GET | `/api/divisi` | — | daftar divisi + jumlah pegawai |
| POST | `/api/divisi` | `{nama, isPantau, jamMasuk, jamPulang}` | divisi baru |
| PATCH | `/api/divisi/[id]` | partial | update (termasuk toggle `isPantau`) |
| DELETE | `/api/divisi/[id]` | — | hapus (tolak jika masih ada pegawai) |
| GET | `/api/pegawai` | — | daftar pegawai + divisi |
| POST | `/api/pegawai` | `{nik, nama, divisiId}` | pegawai baru |
| PATCH | `/api/pegawai/[id]` | partial | update |
| DELETE | `/api/pegawai/[id]` | — | hapus |
| GET | `/api/absensi` | `?tanggal=YYYY-MM-DD` | absensi semua pegawai pada tanggal itu |
| PUT | `/api/absensi` | `{pegawaiId, tanggal, status, jamMasuk?, jamPulang?}` | **upsert** by `(pegawaiId, tanggal)` |
| GET | `/api/rekap` | `?mode=hari\|minggu\|dua-minggu\|bulan&anchor=YYYY-MM-DD` | `{dates[], detail[], rekap[]}` |

**Logika periode** (`lib/dates.ts`, sama seperti mockup):
- `hari` → `[anchor]`
- `minggu` → 7 hari, `anchor-6 .. anchor`
- `dua-minggu` → 14 hari, `anchor-13 .. anchor`
- `bulan` → tanggal 1 s/d akhir bulan dari `anchor`

---

## 7. Export Excel

Dua opsi (pilih salah satu):

**A. Client-side (SheetJS)** — paling sederhana, gratis, tanpa beban server:
1. Halaman Monitor fetch `/api/rekap?mode=...&anchor=...`.
2. Bangun workbook dengan `xlsx`: sheet **Detail** (Tanggal, NIK, Nama, Divisi, Status, Jam Masuk, Jam Pulang) + sheet **Rekap** (NIK, Nama, Divisi, Hadir, Izin, Alpha, Belum Setor, Total Hari).
3. `XLSX.writeFile(wb, namaFile)`.
4. Nama file: `Rekap_Absensi_{Label}_{periode}.xlsx`.

**B. Server-side (exceljs di Route Handler)** — kalau mau styling lebih kaya / header berwarna brand. Return sebagai `Response` dengan header `Content-Disposition: attachment`.

Mulai dari opsi A. Kode generator-nya sudah ada di mockup (`exportExcel`) tinggal dipindah ke `lib/excel.ts`.

---

## 8. Environment Variables

`.env.example`:

```bash
# Supabase → Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-...pooler.supabase.com:5432/postgres"

# Opsional jika pakai Supabase Auth / client SDK
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

Di Vercel: tambahkan `DATABASE_URL` & `DIRECT_URL` di **Project Settings → Environment Variables** (Production + Preview).

---

## 9. Langkah Setup (lokal)

```bash
# 1. Inisialisasi
npx create-next-app@latest absensi-sppg --ts --tailwind --app --src-dir
cd absensi-sppg

# 2. Dependensi
npm install prisma @prisma/client xlsx lucide-react
npm install -D tsx

# 3. Prisma
npx prisma init
#   → isi schema.prisma (lihat bagian 4) & .env (lihat bagian 8)

# 4. Migrasi ke Supabase
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed data contoh
npx prisma db seed   # konfigurasi "prisma.seed": "tsx prisma/seed.ts" di package.json

# 6. Jalankan
npm run dev
```

`src/lib/prisma.ts` (singleton, wajib di serverless):

```typescript
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

---

## 10. Deploy ke Vercel

1. Push repo ke GitHub.
2. Import di Vercel → framework auto-detect Next.js.
3. Isi env `DATABASE_URL` & `DIRECT_URL`.
4. Tambah build command agar Prisma Client ter-generate:
   ```json
   // package.json
   "scripts": { "postinstall": "prisma generate", "build": "next build" }
   ```
5. Deploy. Migrasi dijalankan dari lokal (`prisma migrate deploy`) atau via CI.

---

## 11. Brand & UI

- Warna: Primary Gold `#F3C623`, Navy `#092F54`, Navy soft `#0E3D6B`.
- Font: **Plus Jakarta Sans** (OFL).
- Status: Hadir hijau, Izin kuning, Alpha merah, Belum setor abu.
- Komponen UI sudah ada di file mockup `absensi-scb.jsx` — port ke komponen Tailwind. Layout: header navy + tab nav, konten max-width ~1080px.

---

## 12. Urutan Implementasi yang Disarankan

1. Setup project + Prisma + koneksi Supabase (pastikan `migrate dev` sukses).
2. Seed divisi & pegawai.
3. CRUD Divisi (paling fundamental — jadi sumber dropdown).
4. CRUD Pegawai.
5. API + UI Absensi (upsert per tanggal).
6. Monitor + navigasi tanggal.
7. Endpoint Rekap + Export Excel.
8. (Opsional) Auth security via Supabase.
9. Deploy Vercel.

---

## 13. Catatan / Batasan

- Mockup saat ini data in-memory; README ini adalah blueprint versi produksi ber-database.
- `BELUM` bukan nilai DB — turunkan dari ketiadaan baris.
- Validasi: NIK unik, divisi tidak bisa dihapus jika masih ada pegawai, jam format `HH:MM`.
- Pertimbangkan timezone: simpan `tanggal` sebagai `@db.Date` (tanpa jam) agar tidak bergeser; jam disimpan sebagai string `"HH:MM"` lokal.
