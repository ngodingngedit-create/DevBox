# DevBox — Privacy-First Developer Toolbox (MVP)

100% client-side developer toolbox. Data Anda tidak pernah keluar dari browser. Tidak ada server backend, tidak ada pelacak, berfungsi offline sebagai PWA.

---

## ⚡ Fitur Utama

- **Smart Paste (Auto-detection)**: Tempel teks apa pun (JWT, JSON, UUID, Timestamp, Hex Color, Hash, Cron, Base64, URL-encoded) dan DevBox langsung mengarahkan Anda ke tool yang tepat dengan toast Undo.
- **8 MVP Tools**:
  1. `json`: Formatter, validator, minifier, error pointer, sort keys.
  2. `jwt`: JWT token inspector, claims table, expiry status, signature viewer.
  3. `base64`: Encoder/decoder dengan dukungan UTF-8 penuh.
  4. `url`: URL encoder/decoder (standar URI & komponen query).
  5. `timestamp`: Deteksi otomatis detik (10 digit) vs milidetik (13 digit), konversi ISO/UTC/lokal, dan tombol "Now".
  6. `uuid`: Bulk v4 UUID generator, toggle huruf besar/kecil, dan validator kanonik.
  7. `hash`: Penghasil hash MD5, SHA-1, dan SHA-256 via Web Crypto API.
  8. `cron`: Explainer ekspresi cron bahasa manusia dan kalkulator 5 jadwal berikutnya di browser.
- **Share via URL**: Simpan state tool ke URL hash terkompresi (`lz-string`) dengan banner peringatan data sensitif.
- **Offline & PWA Ready**: Didukung oleh `vite-plugin-pwa` dengan Service Worker aktif.
- **Command Palette (`Ctrl/Cmd + K`)**: Cari tool berdasarkan nama atau kata kunci instan.
- **Dark & Light Mode**: Default tema gelap dengan opsi beralih, tersimpan di `localStorage`.
- **Recent Tools**: Riwayat 5 tool terakhir yang digunakan di halaman utama.

---

## 🚀 Setup & Scripts

### Instalasi Dependencies
```bash
npm install
```

### Menjalankan Server Pengembangan
```bash
npm run dev
```

### Menjalankan Unit Tests (Vitest)
```bash
npm run test
```

### Build untuk Produksi
```bash
npm run build
```

---

## 🛠️ Cara Menambah Tool Baru (≤ 3 Langkah)

Arsitektur DevBox dirancang agar modul tool seragam dan independen:

1. **Buat folder tool baru di `src/tools/<id>/`**:
   - `logic.ts`: Pure function untuk komputasi/transformasi dan unit test-nya (`logic.test.ts`).
   - `ui.tsx`: Komponen React yang mengimplementasikan `React.FC<ToolProps>`.

2. **Daftarkan tool di `src/tools/registry.ts`**:
   Tambahkan entry baru ke array `toolsRegistry`:
   ```ts
   {
     id: 'my-tool',
     title: 'My Tool Title',
     description: 'Deskripsi fungsi tool...',
     keywords: ['keyword1', 'keyword2'],
     component: MyToolComponent,
   }
   ```

3. **(Opsional) Daftarkan detektor Smart Paste di `src/detectors/index.ts`**:
   Tambahkan fungsi deteksi `detectMyTool(input: string): number` (skor `0..1`) ke array `orderedDetectors`.

Selesai! Routing, pencarian Command Palette, dan grid halaman utama akan otomatis mengenali tool baru tersebut.

---

## 📐 Keputusan Teknis (Decisions)

- **Pure Client Hashing**: Web Crypto API native digunakan untuk SHA-1 dan SHA-256. MD5 menggunakan algoritma pure-JS ringkas karena Web Crypto tidak menyediakan algoritma MD5.
- **Routing Berbasis Hash**: DevBox menggunakan `#/...` agar kompatibel di semua hosting static (Cloudflare Pages, GitHub Pages, Vercel) tanpa memerlukan rewrite server-side.
- **Zero Heavy Component Libraries**: Dibangun dengan Tailwind CSS dan Lucide React murni untuk mempertahankan ukuran bundle minimal dan performa Lighthouse tinggi.
- **AI Hook Placeholder**: `src/lib/assistant.ts` menyediakan interface `useAssistant()` kosong sesuai kontrak arsitektur v1 untuk ekstensi masa depan tanpa backend.
