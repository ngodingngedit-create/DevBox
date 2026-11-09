DevBox — Privacy-First Developer Toolbox (MVP)
Dokumen ini adalah sumber kebenaran untuk AI agent.Kerjakan fase demi fase sesuai urutan. Jangan menambahkan fituryang ada di bagian Non-Goals.

1. Ringkasan Proyek
Satu halaman dengan kotak paste besar: pengguna menempel apa pun(JSON, JWT, Base64, cron, timestamp...), aplikasi mendeteksiotomatis dan menawarkan tool yang tepat — tanpa data pernahkeluar dari browser.

Jenis: SPA (Single Page Application), tanpa backend
Posisi: privacy-first, 100% client-side
Status: MVP — tanpa AI, tanpa akun
2. Peran Agent
Kamu adalah senior front-end engineer. Bangun MVP lengkap dengankualitas production: kode bersih, ter-tipe ketat, dan teruji.Ikuti stack dan arsitektur di bawah secara ketat.

3. Tech Stack (ketat, jangan diganti)
Kebutuhan	Pilihan
Framework	Vite + React + TypeScript (strict, tanpa any)
Styling	Tailwind CSS
Editor kode	Monaco Editor
Kompresi URL	lz-string
PWA / offline	vite-plugin-pwa
Hashing	Web Crypto API (MD5: lib pure-JS kecil, karena Web Crypto tak mendukung)
Testing	Vitest + React Testing Library
Hosting	Static (Cloudflare Pages / Vercel) — tanpa server
4. Arsitektur (wajib)
Setiap tool adalah modul dengan kontrak seragam:

export interface Tool {  id: string;                      // "jwt", "json", ...  title: string;                   // "JWT Decoder"  description: string;  keywords: string[];              // untuk search & command palette  detect?(input: string): number;  // skor keyakinan 0..1 (Smart Paste)  component: React.FC;             // halaman UI tool}
Aturan arsitektur:

tools/registry.ts mengekspor semua tool; routing, pencarian,dan halaman utama dibangun dari registry ini.
Semua logika transform = pure function ditools/<id>/logic.ts, terpisah dari UI (mudah dites,dipakai ulang untuk pipeline di v2).
Placeholder lib/assistant.ts berisi hook kosonguseAssistant() — lapisan AI masa depan tersambung di sini.Jangan bangun AI sekarang.
5. Tools MVP (8, tepat ini)
#	id	Fungsi	Catatan
1	json	Formatter/validator	Pretty (indent 2/4), minify, error position + pesan jelas, sort keys opsional
2	jwt	Decoder	Split ., decode base64url header/payload, tabel claims, status exp/iat vs waktu sekarang, signature ditampilkan mentah (tanpa verifikasi)
3	base64	Encode/decode	Dukungan UTF-8 penuh, mode dua arah
4	url	Encode/decode	Toggle encodeURIComponent vs encodeURI
5	timestamp	Konverter	Auto-detect detik (10 digit) vs milidetik (13), output lokal + UTC + ISO 8601, arah terbalik, tombol "now"
6	uuid	Generator/validator	v4 via crypto.randomUUID, bulk N, upper/lower, copy semua
7	hash	MD5, SHA-1, SHA-256	Input teks, lower/upper, tombol copy
8	cron	Explainer	Parse 5–6 field, deskripsi bahasa Inggris, 5 jadwal berikutnya dihitung client-side (sebutkan asumsi timezone)
6. Smart Paste (USP — kerjakan dengan hati-hati)
Halaman utama = hero di tengah + satu kotak paste besar,placeholder: "Paste anything — JSON, JWT, Base64, cron, timestamp…"

Detektor dieksekusi dalam urutan ini (urutan mencegahsalah-deteksi; jangan diubah):

JWT → /^eyJ[\w-]+\.[\w-]+\.[\w-]*$/
JSON → diawali {/[ dan JSON.parse sukses
UUID → regex kanonik UUID
Timestamp → integer 10 digit (detik) / 13 digit (ms) di rentang wajar
Hex color → /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
Hash → 32 / 40 / 64 karakter hex
Cron → 5–6 field cron dipisah spasi
Base64 → charset valid, panjang %4 == 0, hasil decode printable UTF-8
URL-encoded → beberapa urutan %XX
Perilaku:

Keyakinan tinggi & tidak ambigu → auto-route ke tool denganinput terisi; toast "Detected JWT — opened JWT Decoder" + tombol Undo.
Ambigu (mis. Base64 vs URL-encoded) → tampilkan chip kandidat.
Tidak ada yang cocok → pesan netral + grid semua tool (bisa dicari).
Setiap detektor mengembalikan skor 0..1, tinggal di detectors/,wajib punya unit test (string kosong, input tidak valid, input besar).
7. Share via URL
State tool di-encode ke URL hash: #/t/<toolId>?d=<lz-string compressed>
Tombol Copy share link di setiap halaman tool.
Jika link mengandung data, tampilkan banner kecil yang bisaditutup: "This link contains pasted data — don't share it if it's sensitive."
8. UX Requirements
Dark mode default + toggle light, persist di localStorage.
Ctrl/Cmd+K command palette: fuzzy search judul + keywords tool.
Recent tools (maks 5, localStorage) di halaman utama.
Badge di hero: "100% client-side — your data never leaves the browser."
Responsif sampai mobile; font monospace di semua area kode;tombol Copy di setiap output.
Desain minimal bersih; tanpa library komponen berat.
9. Non-Goals (jangan dibangun)
❌ Backend, akun, auth, cloud sync
❌ Fitur AI (cukup placeholder interface)
❌ Regex tester, diff checker, pipeline/flow chaining, API playground
❌ Analytics / tracker pihak ketiga
❌ i18n (Inggris saja untuk v1)
10. Struktur Proyek
src/  tools/        registry.ts + satu folder per tool (logic.ts + ui.tsx)  detectors/  components/   palette, layout, chips, toast  lib/          assistant.ts (placeholder), urlState.ts, utils  hooks/
11. Fase Pengerjaan (urut; jalankan build + test tiap fase)
Scaffold Vite, theme Tailwind, registry + router, tools JSON/Base64/JWT
5 tools sisanya (timestamp, uuid, hash, url, cron) + halaman all-tools
Smart Paste: detektor + UX halaman utama + chip saran
Share-via-URL, PWA, command palette, dark mode, recent tools
Polish, test suite lengkap, README (setup, scripts, catatan arsitektur)
12. Acceptance Criteria (definisi "selesai")
 npm run build lolos tanpa error TypeScript (strict mode)
 Setiap fungsi transform & setiap detektor punya unit test Vitest
 Lighthouse performance ≥ 95 di halaman utama
 Paste JWT / JSON / timestamp / Base64 di halaman utamater-route dengan benar (ada integration test)
 Berfungsi penuh offline setelah load pertama (PWA)
 README menjelaskan cara menambah tool baru via registry ≤ 3 langkah
13. Catatan Operasional untuk Agent
Kerjakan satu fase per sesi/perintah; setelah selesai,jalankan npm run build dan npm run test, lalu laporkan hasilnya.
Commit inkremental dengan pesan yang bermakna(conventional commits: feat(tools): ..., test(detectors): ...).
Jika ada keputusan teknis yang ambigu, pilih yang paling sederhanadan catat di README bagian "Decisions".