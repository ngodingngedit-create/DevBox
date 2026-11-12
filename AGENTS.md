# DevBox — Privacy-First Developer Toolbox (MVP)

Dokumen ini adalah sumber kebenaran untuk AI agent. Kerjakan fase demi fase sesuai urutan. Jangan menambahkan fitur yang ada di bagian Non-Goals.

> **Revisi v1.1 (2026-11-11):** dukungan **gambar dua arah pada tool Base64** (input/output bisa gambar atau Base64), **file hashing** pada tool Hash, deteksi **Data URI & paste gambar** pada Smart Paste, serta penyesuaian UX dan Acceptance Criteria. Rincian di bagian 14 (Changelog).

## 1. Ringkasan Proyek

Satu halaman dengan kotak paste besar: pengguna menempel apa pun (JSON, JWT, Base64, cron, timestamp, gambar...), aplikasi mendeteksi otomatis dan menawarkan tool yang tepat — tanpa data pernah keluar dari browser.

- Jenis: SPA (Single Page Application), tanpa backend
- Posisi: privacy-first, 100% client-side
- Status: MVP — tanpa AI, tanpa akun

## 2. Peran Agent

Kamu adalah senior front-end engineer. Bangun MVP lengkap dengan kualitas production: kode bersih, ter-tipe ketat, dan teruji. Ikuti stack dan arsitektur di bawah secara ketat.

## 3. Tech Stack (ketat, jangan diganti)

| Kebutuhan | Pilihan |
| --- | --- |
| Framework | Vite + React + TypeScript (strict, tanpa any) |
| Styling | Tailwind CSS |
| Editor kode | Monaco Editor |
| Kompresi URL | lz-string |
| PWA / offline | vite-plugin-pwa |
| Hashing | Web Crypto API (MD5: lib pure-JS kecil, karena Web Crypto tak mendukung) |
| File & gambar | File API + Clipboard API + FileReader (native, tanpa library eksternal) |

## 4. Arsitektur (wajib)

Setiap tool adalah modul dengan kontrak seragam:

```ts
export interface Tool {
  id: string;                      // "jwt", "json", ...
  title: string;                   // "JWT Decoder"
  description: string;
  keywords: string[];              // untuk search & command palette
  detect?(input: string): number;  // skor keyakinan 0..1 (Smart Paste)
  component: React.FC;             // halaman UI tool
}
```

Aturan arsitektur:

- `tools/registry.ts` mengekspor semua tool; routing, pencarian, dan halaman utama dibangun dari registry ini.
- Semua logika transform — termasuk encode/decode gambar dan sniffing MIME — adalah pure function di `tools/<id>/logic.ts`, terpisah dari UI (mudah dites, dipakai ulang untuk pipeline di v2).
- Placeholder `lib/assistant.ts` berisi hook kosong `useAssistant()` — lapisan AI masa depan tersambung di sini. Jangan bangun AI sekarang.

## 5. Tools MVP (8, tepat ini)

| # | id | Fungsi | Catatan |
| --- | --- | --- | --- |
| 1 | json | Formatter/validator | Pretty (indent 2/4), minify, error position + pesan jelas, sort keys opsional |
| 2 | jwt | Decoder | Split `.`, decode base64url header/payload, tabel claims, status exp/iat vs waktu sekarang, signature ditampilkan mentah (tanpa verifikasi) |
| 3 | base64 | Encode/decode **teks & gambar** | **Teks:** UTF-8 penuh, mode dua arah (encode/decode + tombol swap). **Gambar (dua arah, input dan output sama-sama bisa gambar atau Base64):** (a) input gambar via file picker, drag-drop, atau Ctrl+V → output Data URI + Base64 mentah, lengkap dengan preview dan metadata (nama file, MIME, ukuran, dimensi piksel); (b) input Base64/Data URI → preview gambar, deteksi MIME dari magic bytes (PNG/JPEG/GIF/WebP/BMP/SVG/ICO/AVIF), ukuran byte, dan tombol Download (ekstensi sesuai MIME). Arah otomatis terdeteksi dari input; tab manual Teks/Gambar tetap tersedia. Base64 gambar TIDAK boleh diperlakukan sebagai teks biasa |
| 4 | url | Encode/decode | Toggle encodeURIComponent vs encodeURI |
| 5 | timestamp | Konverter | Auto-detect detik (10 digit) vs milidetik (13), output lokal + UTC + ISO 8601, arah terbalik, tombol "now" |
| 6 | uuid | Generator/validator | v4 via crypto.randomUUID, bulk N, upper/lower, copy semua |
| 7 | hash | MD5, SHA-1, SHA-256 | Input teks ATAU file (drag-drop/picker, dibaca sebagai byte), lower/upper, tombol copy per-hash dan copy semua |
| 8 | cron | Explainer | Parse 5–6 field, deskripsi bahasa Inggris, 5 jadwal berikutnya dihitung client-side (sebutkan asumsi timezone) |

Tool lain (json, jwt, url, timestamp, uuid, cron) tetap berbasis teks — jangan ditambah dukungan file/gambar.

## 6. Smart Paste (USP — kerjakan dengan hati-hati)

Halaman utama = hero di tengah + satu kotak paste besar, placeholder: "Paste anything — JSON, JWT, Base64, cron, timestamp…"

Kotak paste menerima dua jenis input:

1. **Teks** (paste keyboard biasa) → pipeline detektor di bawah.
2. **File gambar dari clipboard (Ctrl+V screenshot) atau drag-drop file gambar** ke kotak → langsung route ke `base64` mode gambar (arah encode), tanpa melewati pipeline teks; toast "Detected image — opened Base64 (Image mode)" + tombol Undo. File dibawa via state in-memory, bukan URL (lihat bagian 7).

Detektor dieksekusi dalam urutan ini (urutan mencegah salah-deteksi; jangan diubah):

1. JWT → `/^eyJ[\w-]+\.[\w-]+\.[\w-]*$/`
2. JSON → diawasi `{`/`[` dan JSON.parse sukses
3. UUID → regex kanonik UUID
4. Timestamp → integer 10 digit (detik) / 13 digit (ms) di rentang wajar
5. Hex color → `/^#([0-9a-f]{3}|[0-9a-f]{6})$/i`
6. Hash → 32 / 40 / 64 karakter hex
7. Cron → 5–6 field cron dipisah spasi
8. Data URI → `/^data:[\w.+-]+\/[\w.+-]+(;base64)?,/` → `image/*` route ke `base64` mode gambar (decode); MIME non-image tampilkan info + tetap buka `base64`
9. Base64 → charset valid, panjang %4 == 0, decode bytes: printable UTF-8 → mode teks; **magic bytes gambar dikenali → mode gambar (keyakinan tinggi, auto-route)**
10. URL-encoded → beberapa urutan `%XX`

Perilaku:

- Keyakinan tinggi & tidak ambigu → auto-route ke tool dengan input terisi; toast "Detected JWT — opened JWT Decoder" + tombol Undo.
- Ambigu (mis. Base64 vs URL-encoded) → tampilkan chip kandidat.
- Base64 yang bytes-nya adalah gambar dikenali (PNG/JPEG/GIF/WebP) → tidak ambigu; auto-route ke Base64 mode gambar.
- Hex color (belum ada tool khusus di v1) → tampilkan swatch warna inline di halaman utama + pesan netral + grid tool.
- Tidak ada yang cocok → pesan netral + grid semua tool (bisa dicari).

Setiap detektor mengembalikan skor 0..1, tinggal di `detectors/`, wajib punya unit test (string kosong, input tidak valid, input besar, serta contoh Base64 gambar PNG/JPEG 1×1 untuk detektor #8–#9).

## 7. Share via URL

- State tool di-encode ke URL hash: `#/t/<toolId>?d=<lz-string compressed>`
- Tombol Copy share link di setiap halaman tool.
- Jika link mengandung data, tampilkan banner kecil yang bisa ditutup: "This link contains pasted data — don't share it if it's sensitive."
- **Batasan:** hanya state teks ≤ 50 KB yang di-encode ke URL. Data gambar (file atau Base64 gambar besar) TIDAK dimasukkan ke URL — dikirim via modul handoff in-memory (`lib/handoff.ts`) dan hilang saat reload; halaman tool menampilkan info kecil: "Image loaded in-memory (not in share link)".

## 8. UX Requirements

- Dark mode default + toggle light, persist di localStorage.
- Ctrl/Cmd+K command palette: fuzzy search judul + keywords tool.
- Recent tools (maks 5, localStorage) di halaman utama.
- Badge di hero: "100% client-side — your data never leaves the browser."
- Responsif sampai mobile; font monospace di semua area kode; tombol Copy di setiap output.
- Mode gambar: dropzone dengan highlight saat drag-over, tombol "Choose file", dukungan paste Ctrl+V, preview dengan latar checkerboard (bukan monospace), tombol Download, dan metadata (nama, MIME, ukuran, dimensi).
- Ukuran file gambar: proses async hingga ~5 MB tanpa memblokir UI; di atas itu tampilkan peringatan performa (tetap boleh dicoba).
- Desain minimal bersih; tanpa library komponen berat.

## 9. Non-Goals (jangan dibangun)

- ❌ Backend, akun, auth, cloud sync
- ❌ Fitur AI (cukup placeholder interface)
- ❌ Regex tester, diff checker, pipeline/flow chaining, API playground
- ❌ Analytics / tracker pihak ketiga
- ❌ i18n (Inggris saja untuk v1)
- ❌ Pengolahan gambar (resize, crop, konversi format, kompresi ulang, OCR) — Base64 gambar hanya encode/decode apa adanya

## 10. Struktur Proyek

```
src/
  tools/        registry.ts + satu folder per tool (logic.ts + ui.tsx)
  detectors/
  components/   palette, layout, chips, toast, dropzone
  lib/          assistant.ts (placeholder), urlState.ts, handoff.ts,
                bytes.ts (base64/UTF-8/magic bytes), utils
  hooks/
```

## 11. Fase Pengerjaan (urut; jalankan build + test tiap fase)

1. Scaffold Vite, theme Tailwind, registry + router, tools JSON/Base64/JWT (Base64 sudah termasuk mode gambar dua arah)
2. 5 tools sisanya (timestamp, uuid, hash, url, cron) + halaman all-tools
3. Smart Paste: detektor (termasuk Data URI + Base64-gambar) + UX halaman utama + chip saran + paste/drop gambar
4. Share-via-URL, PWA, command palette, dark mode, recent tools
5. Polish, test suite lengkap, README (setup, scripts, catatan arsitektur)

## 12. Acceptance Criteria (definisi "selesai")

- [ ] `npm run build` lolos tanpa error TypeScript (strict mode)
- [ ] Setiap fungsi transform & setiap detektor punya unit test Vitest
- [ ] Unit test khusus gambar: sniffing MIME (PNG/JPEG/GIF/WebP), roundtrip file → Base64 → deteksi ulang, dan validasi Data URI valid/tidak valid
- [ ] Lighthouse performance ≥ 95 di halaman utama
- [ ] Paste JWT / JSON / timestamp / Base64 teks di halaman utama ter-route dengan benar (integration test)
- [ ] Paste / drag-drop gambar di halaman utama ter-route ke Base64 mode gambar, dan Base64 gambar ter-decode menjadi preview yang bisa di-download (integration test)
- [ ] Berfungsi penuh offline setelah load pertama (PWA)
- [ ] README menjelaskan cara menambah tool baru via registry ≤ 3 langkah

## 13. Catatan Operasional untuk Agent

- Kerjakan satu fase per sesi/perintah; setelah selesai, jalankan `npm run build` dan `npm run test`, lalu laporkan hasilnya.
- Commit inkremental dengan pesan yang bermakna (conventional commits: `feat(tools): ...`, `test(detectors): ...`).
- Jika ada keputusan teknis yang ambigu, pilih yang paling sederhana dan catat di README bagian "Decisions".

## 14. Changelog

**v1.1 — 2026-11-11** (revisi sesuai permintaan: "base64 harusnya gambar, bukan teks; input dan output gambar atau base64; cek yang lainnya juga")

1. **base64 (bagian 5):** kini dua mode — Teks dan Gambar — keduanya dua arah. Input bisa file gambar (picker/drag-drop/Ctrl+V) dan output Base64/Data URI, atau sebaliknya input Base64/Data URI dan output preview gambar + download. Ditambah sniffing MIME dari magic bytes, metadata file, dan aturan eksplisit "Base64 gambar bukan teks".
2. **hash (bagian 5):** tambah input file (drag-drop/picker) selain teks, sehingga MD5/SHA-1/SHA-256 bisa dihitung dari gambar/biner.
3. **Smart Paste (bagian 6):** tambah jalur paste/drop gambar dari clipboard langsung ke Base64 mode gambar; tambah detektor Data URI (poin 8); detektor Base64 (poin 9) kini mengenali magic bytes gambar; perjelas perilaku hex color (swatch inline karena belum ada tool-nya).
4. **Share via URL (bagian 7):** state teks ≤ 50 KB tetap ke URL; data gambar lewat handoff in-memory agar URL tidak meledak.
5. **Tech Stack (bagian 3):** tambah baris File & gambar (File API + Clipboard API + FileReader, native).
6. **UX (bagian 8):** tambah dropzone, preview checkerboard, tombol Download, metadata, dan batas nyaman ~5 MB.
7. **Non-Goals (bagian 9):** tambah larangan pengolahan gambar (resize/crop/konversi/kompresi/OCR) agar cakupan tidak melebar.
8. **Struktur (bagian 10):** `lib/bytes.ts` (base64/UTF-8/magic bytes), `lib/handoff.ts`, komponen `dropzone`.
9. **Acceptance Criteria (bagian 12):** tambah unit test MIME/roundtrip gambar dan integration test paste/drop gambar.
10. **Fase (bagian 11):** mode gambar Base64 digarap sejak Fase 1; detektor gambar di Fase 3.
