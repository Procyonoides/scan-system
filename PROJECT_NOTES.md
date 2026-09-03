# PROJECT_NOTES.md — HSK PRO Scan System (CI3 → Angular Migration)

> **Catatan buat Claude di sesi/akun lain:** ini file konteks proyek yang sedang
> dikerjakan bareng user (Bobby, IT Department, berbasis di Kudus/Jawa Tengah,
> zona waktu WIB/UTC+7). Baca ini dulu sebelum mulai bantu, biar gak perlu
> nanya ulang hal-hal yang udah pernah dibahas. Update file ini kalau ada
> progress baru.

---

## 1. Konteks Proyek

User sedang **migrasi sistem scan gudang** dari CodeIgniter 3 (PHP lama) ke
stack Angular + Node.js/Express. Tiga repo GitHub terkait (milik
`Procyonoides`):

| Repo | Peran |
|---|---|
| `ci3-scan` | Sistem LAMA (PHP/CodeIgniter 3) — dipakai sebagai REFERENSI buat bandingin logic, bukan buat diedit |
| `scan-system` | Frontend Angular (BARU) |
| `scan-backend` | Backend Node.js/Express + MSSQL (BARU) |

Local path di komputer user (Windows, PowerShell):
`D:\New Z\Angular\scan-backend` dan `D:\New Z\Angular\scan-system`

Database: SQL Server Express (`localhost\SQLEXPRESS`), nama database
**`Backup_hskpro`**. Tabel-tabel penting: `master_database`, `receiving`,
`shipping`, `stok`, `users`, `list_model`, `list_size`, `list_production`,
`data_receiving`/`data_shipping` (arsip), `backup_receiving`/`backup_shipping`,
`duplicate`.

Aplikasinya dipakai di gudang beneran (production), staff scan barcode pakai
role RECEIVING/SHIPPING, role IT & MANAGEMENT akses dashboard/laporan.

**⚠️ Kondisi akses GitHub saat ini:** di sesi paling akhir, akses ke
`github.com`/`codeload.github.com`/`api.github.com`/`raw.githubusercontent.com`
dari tool bash/web_fetch **keblokir** ("Host not in allowlist"), padahal
sebelumnya (banyak sesi awal) bisa. Kalau ini masih kejadian pas sesi baru,
JANGAN buang waktu retry berkali-kali — langsung minta user upload file/zip
project-nya ke chat. Cukup 1x coba fetch dulu buat mastiin, baru pivot ke
minta upload kalau gagal.

---

## 2. Bug yang SUDAH diperbaiki

### 2.1 Stock Monitoring — First Stock vs Warehouse Stock salah & gak real-time
- **Definisi yang benar** (beda sama CI3 lama yang nyampur):
  - `firstStock` = snapshot stok AWAL hari ini (stabil, dari tabel `stok`,
    auto-dibuat dari `stock_akhir` kemarin kalau belum ada — self-healing,
    gak butuh cron job)
  - `warehouseStock` = LIVE `SUM(stock)` dari `master_database` saat itu juga
- Dibuat helper terpusat: **`utils/warehouseStats.js`** — dipakai bareng oleh
  `dashboard.routes.js`, `stock.routes.js`, dan di-emit real-time lewat
  Socket.IO dari `receiving.routes.js` & `shipping.routes.js`.

### 2.2 Import Excel (Master Data) — gagal total
- Header di template resmi (UPPERCASE) gak cocok field backend (lowercase) →
  semua baris ketolak. Root cause kedua: staff bikin file sendiri dengan
  header gaya beda-beda (`"label size"` bukan `"size"`, dll).
- **Fix:** `utils/headerNormalizer.js` — normalisasi + tabel alias (termasuk
  alias Bahasa Indonesia: `warna→color`, `jumlah→quantity`).
- Sekalian fix: leading zero (`four_digit`) ilang karena XLSX parser → pakai
  `{ raw: false }`. Sekalian fix: detail error per-baris gak ditampilin di
  frontend → sekarang muncul.

### 2.3 Search — harus tekan Enter dulu
- Master Data & Option (Model/Size/Production): search cuma jalan pas
  `(keyup.enter)`. **Fix:** tambah `(input)` → RxJS `Subject` →
  `debounceTime(400)` → auto-search. Enter tetap bisa instant search.

### 2.4 Operation Record & Backup — stock gak sinkron (BUG WARISAN DARI CI3!)
Ditemukan pas audit fitur Report/Record/Backup yang sebelumnya belum dicek
dalam-dalam. **Penting:** dicek ke `ci3-scan`, dan bug ini SUDAH ADA dari
sistem lama — cuma di CI3 field `quantity` di form edit-nya di-set `readonly`
(gak bisa diapa-apain kecuali ganti `username`), jadi bug-nya gak pernah
ketrigger. Pas di-port ke Angular, `quantity` sengaja dibikin editable
(fitur baru), yang bikin bug lama ini jadi aktual berdampak.

3 masalah di `routes/masterData.routes.js` (`PUT/DELETE /record`,
`POST /backup`):
1. **🔴 Stock gak sinkron** — edit/hapus record scan gak pernah nyesuain
   stock di `master_database`. **Fix:** hitung selisih quantity (edit) atau
   full quantity (delete), lalu UPDATE stock sesuai arah receiving
   (nambah/turun) vs shipping (kebalikannya).
2. **🟡 "Sukses palsu"** — PUT/DELETE gak ngecek row yang bener2 kena,
   selalu bilang "success" walau 0 baris berubah. **Fix:** cari dulu record
   di 3 tingkat tabel (aktif → arsip `data_*` → backup `backup_*`), 404 kalau
   gak ketemu di manapun.
3. **⚪ Backup gak transaksional** — INSERT ke tabel backup + DELETE dari
   tabel aktif itu 2 query terpisah, gak dibungkus transaksi. **Fix:** dibuat
   helper baru **`utils/transaction.js`** (`runInTransaction(callback)`,
   pakai `mssql` Transaction/Request asli, butuh `getPool()` dari
   `config/database.js`). PUT/DELETE `/record` JUGA dibungkus transaksi ini
   (find + update/delete + sync stock jadi 1 kesatuan atomik).

**⚠️ Dependency penting:** `utils/transaction.js` butuh `config/database.js`
punya `getPool: () => pool` di `module.exports`. Kalau muncul error
`"getPool is not a function"`, itu tandanya `config/database.js` di komputer
user BELUM punya export ini — pernah kejadian karena fix pertama cuma kasih
`masterData.routes.js` + `utils/transaction.js`, lupa sertain
`config/database.js`.

### 2.5 Operation Record — Delete/Edit gagal karena presisi milidetik
- `GET /records` format tanggal pakai `CONVERT(varchar, date_time, 120)` yang
  MOTONG milidetik. Nilai yang kepotong ini dikirim balik ke frontend, dipakai
  lagi sebagai identifier pas edit/delete (`WHERE date_time = @dateTime`) →
  gak pernah exact-match sama data asli → edit/delete SELALU gagal (dulu diem2
  "sukses palsu" - lihat 2.4 poin 2 - sekarang jujur 404).
- **Fix:** ganti ke format **121** (include milidetik) di `GET /records`
  query saja (bukan di GET /barcodes yang beda konteks).

---

## 3. Bug yang DITEMUKAN tapi BELUM diperbaiki (perlu keputusan user)

### ⚠️ Shipping single-scan bisa bikin stock MINUS
`routes/shipping.routes.js`, `POST /scan` (single, BUKAN batch) gak ngecek
stock cukup sebelum dikurangi — beda sama `/batch-scan` yang punya
pengecekan. Didokumentasikan lewat test (`shipping.routes.test.js`, ada
tanda ⚠️). User bilang "nanti aja" 2x ditanya. **Jangan tawarin lagi kecuali
user yang mulai duluan.**

---

## 4. Testing Backend — 209 test, 15 suite, semua lolos

Framework: **Jest** + **Supertest**. Setup: `jest.config.js` di root,
`package.json` script `"test": "jest"`.

### Struktur file test:
```
tests/
  helpers/testApp.js            — Express app minimal buat supertest, auth
                                   dipalsuin via header x-test-username/-position
  utils/
    warehouseStats.test.js  (5)
    headerNormalizer.test.js (17)
    password.test.js        (8)  — ada waitFor() polling, jangan nebak tick
    actAsLogger.test.js     (12)
    transaction.test.js     (5)  — mock mssql Transaction/Request langsung
  routes/
    receiving.routes.test.js    (9)
    shipping.routes.test.js     (7)  — termasuk test dokumentasi bug §3
    auth.routes.test.js         (17)
    user.routes.test.js         (17)
    masterData.routes.test.js   (26) — barcode CRUD + GET/PUT/DELETE record +
                                        POST backup (yang paling kompleks,
                                        mock runInTransaction dgn txQuery)
    dashboard.routes.test.js    (8)  — timezone-safe (WIB/UTC teruji)
    stock.routes.test.js        (7)
    transaction.routes.test.js  (14)
    report.routes.test.js       (20)
    option.routes.test.js       (36) — describe.each utk model/size/production
```

### Pola penting yang udah kebukti kepake:
```js
jest.mock('../../config/database', () => ({ query: jest.fn(), dbName: 'TestDB' }));
jest.mock('../../middleware/auth.middleware', () => ({
  verifyToken: (req, res, next) => next(),
  verifyRole: () => (req, res, next) => next()
}));
// Buat endpoint yang pakai runInTransaction (record/backup):
const mockTxQuery = jest.fn();
jest.mock('../../utils/transaction', () => ({
  runInTransaction: jest.fn((callback) => callback(mockTxQuery))
}));
```
- Database SELALU di-mock, gak pernah nyentuh SQL Server beneran.
- Async fire-and-forget (background cache refresh dll) → pakai polling
  `waitFor()`, JANGAN nebak jumlah `setImmediate` tick (flaky pas jalan
  paralel banyak test suite).
- Deskripsi test: Bahasa Indonesia, kasual.

### Belum ditest: Frontend Angular (`scan-system`) — 0 unit test asli
(infrastruktur Jasmine/Karma udah ada, 12 file `.spec.ts` boilerplate doang).

---

## 5. Sesi UI Debugging — Operation Record page (PENTING, metodologi baru)

User awalnya frustrasi karena beberapa kali dibilang "tampilan gak berubah/
masih jelek" walau udah dikasih fix CSS berkali-kali secara "nebak". Beberapa
turn awal Claude SALAH karena cuma modal-in teks OCR dari screenshot tanpa
benar-benar liat gambarnya — **jangan ulangi ini**. Setelah itu pindah ke
metodologi yang jauh lebih reliable:

### Metodologi yang TERBUKTI ampuh:
1. **Selalu `view` file gambar screenshot secara LANGSUNG** (bukan cuma baca
   teks yang ke-extract otomatis) sebelum diagnosis.
2. **Render ulang markup + CSS ASLI project pakai Playwright** (`npx sass`
   buat compile SCSS project beneran, gabung sama `bootstrap.min.css` +
   `adminlte.min.css` versi persis yang dipakai project, render di headless
   Chromium, screenshot + `getComputedStyle()` buat verifikasi). Ini JAUH
   lebih akurat daripada nebak dari baca kode doang.
3. Simulasiin efek Angular `ViewEncapsulation` (nambahin attribute selector
   kayak `[_ngcontent-xxx]` ke elemen test) kalau curiga component-scoped
   style vs global style lagi konflik.

### Temuan besar: `@import '../../../../styles.scss';` di component .scss
- **Cuma ada di 2 file**: `record.component.scss` dan `backup.component.scss`
  (bukan project-wide, sudah dicek ke semua 14 komponen).
- **Kenapa bahaya:** re-import seluruh global stylesheet ke dalam file SCSS
  komponen bikin Angular nge-compile ulang SEMUA rule global (termasuk reset
  agresif `* { padding:0; margin:0; }`) dengan attribute selector scoping
  (ViewEncapsulation). Salinan yang di-scope ini bisa MENANG lawan Bootstrap
  punya `.page-link { padding: ... }` tergantung urutan Angular nyuntik
  `<style>` tag saat runtime — gak konsisten/unpredictable.
- **Gejala nyata:** tombol nomor pagination non-aktif (2, 3, ..., N) jadi
  `padding:0`, nempel jadi teks polos tanpa kotak, sementara tombol aktif
  (background-color solid) masih kelihatan kayak pill karena warnanya
  nutupin walau padding-nya 0 juga.
- **Fix:** HAPUS baris `@import` itu dari kedua file. Global styles udah
  di-load sekali dengan benar lewat `angular.json` → `styles` array; komponen
  TIDAK PERNAH perlu re-import stylesheet global.
- **Setelah fix ini dikonfirmasi user via screenshot: padding pagination
  udah bener** (ada jarak antar nomor).

### Temuan design-system: `.card-header` SELALU dark-navy gradient (GLOBAL, disengaja)
```scss
// src/styles.scss
.card .card-header {
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  color: white;
  ...
}
```
Ini pola GLOBAL yang konsisten dipakai di seluruh app (bukan bug). Utility
class `bg-light` TIDAK bisa nimpa ini karena `bg-light` cuma nyentuh
`background-color`, sedangkan rule global pakai shorthand `background:`
(nyetel `background-image` gradient sekaligus) — gradient nutupin warna
terang di baliknya walau `bg-light` teknisnya "menang" di background-color.
**Pelajaran:** kalau mau bikin card-header custom, JANGAN pakai `bg-light`/
`bg-white` buat ngelawan pattern ini — ikutin aja skema dark-navy + teks
putih/`text-white-50` biar konsisten sama seluruh app.

### Temuan flexbox: `justify-content-between` gak reliable kalau ada whitespace di antara elemen
- Root cause: whitespace/newline di antara tag HTML (`<span>...</span>\n
  <button>...</button>`) bisa menghasilkan **anonymous flex item** tambahan
  di Chromium yang ngerusak perhitungan `space-between` (kebukti lewat
  `el.childNodes.length` dan `getBoundingClientRect()` — elemen terakhir gak
  nempel di ujung kanan container walau `justify-content:space-between`
  correctly applied).
- **Fix yang robust:** JANGAN pakai `justify-content-between` buat 2 elemen
  (kiri + kanan) dalam flex container. Pakai `d-flex align-items-center`
  biasa di container, terus tambahin `ms-auto` (margin-left:auto) di elemen
  yang mau didorong ke kanan. Ini immune dari whitespace-node quirk karena
  `margin:auto` nyerap SEMUA sisa ruang terlepas dari sibling lain.

### Temuan tombol vs field "gak nyambung"
- Field (`.form-control`) pakai border tipis + `box-shadow` inset (efek
  rata/flat).
- Tombol Bootstrap default (`.btn`) pakai `box-shadow` outset + border
  transparan (efek timbul/3D).
- **Fix:** kalau tombol perlu terasa "menyatu" sama row input di sebelahnya
  (misal tombol "Apply Filter"), tambahin
  `border: 1px solid var(--bs-primary); box-shadow: none !important;` biar
  flat matching sama field.

### File yang kena fix di sesi ini:
- `src/app/features/master-data/record/record.component.html`
- `src/app/features/master-data/record/record.component.scss`
- `src/app/features/master-data/backup/backup.component.scss` (cuma buang
  baris `@import`)

### Status terakhir sesi ini:
User udah apply fix `@import` removal + Reset/`ms-auto` + flat button, TAPI
sempet ada indikasi build/cache gak sepenuhnya ke-refresh (satu bagian kode
yang harusnya udah benar dari pengecekan Playwright ternyata masih kelihatan
lama di screenshot user). **User diminta full clean rebuild** (stop `ng
serve`, hapus folder `.angular` cache, `ng serve` ulang, baru hard-refresh
browser) — belum ada konfirmasi hasil akhir dari user di titik file ini
ditulis. **Kalau lanjut sesi baru dan user masih komplain soal halaman
Record kelihatan sama aja, curigai cache/build dulu sebelum ngoprek kode
lagi** — minta screenshot baru + tanya udah clean-rebuild belum.

---

## 6. Konvensi kerja dengan user (PENTING)

- **< 5 file berubah** → tempel source code LANGSUNG di chat (code block),
  sebutin path file. **≥ 5 file** → bundling `.zip`, `present_files`.
  (Pengecualian: kalau salah satu file GEDE banget — ratusan baris — dan
  resiko salah-tempel manual tinggi, boleh zip walau < 5 file, sebutin
  alasannya ke user.)
- User selalu jalanin `npm test` di komputernya sendiri dan paste hasil ke
  chat — jangan cuma percaya hasil sandbox sendiri buat hal yang mungkin
  environment-dependent (timezone, race condition, dll).
- **Untuk bug TAMPILAN/CSS: jangan nebak.** Render ulang beneran pakai
  Playwright + file CSS/SCSS asli project (lihat §5) sebelum kasih fix.
  Nebak-nebak CSS berulang kali bikin user frustrasi dan kehilangan
  kepercayaan (sempat kejadian, dibandingin gak enak sama project lain milik
  user yang "rapi dari sononya").
- Kalau akses GitHub (fetch tarball dsb) gagal, coba 1x lagi, kalau masih
  gagal langsung minta user upload file/zip — jangan disuruh nunggu berkali2
  tanpa progress nyata.
- Gaya komunikasi: **Bahasa Indonesia santai**, teknis tapi gak kaku.
- User suka scope "sekalian aja"/"lanjutkan" — progress bertahap tapi
  menyeluruh.

---

## 7. Riwayat sesi (kronologis, ringkas)

1. Investigasi First Stock vs Warehouse Stock (CI3 vs Angular).
2. Fix real-time dashboard (Socket.IO gak kirim field yang dibutuhin) →
   `warehouseStats.js`.
3. Fix Import Excel (header case + alias) — banyak false alarm di
   tengah jalan (delimiter CSV, SQL "hang" yg ternyata cold-cache).
4. Fix search debounce (Master Data & Option).
5. Audit sidebar — gak ada menu mubazir, "Transaction" agak membingungkan
   nama tapi dibiarin.
6. Setup unit testing dari nol → 192 test / 14 suite.
7. Bikin `PROJECT_NOTES.md` pertama kali.
8. Audit Report/Record/Backup → ketemu 3 bug (stock gak sinkron, sukses
   palsu, backup gak transaksional) → fix + `utils/transaction.js` → 206 test.
9. Diskusi fungsi "Operation Record" & perbandingan ke CI3 (bug warisan,
   dorman karena `quantity` readonly di versi lama).
10. Fix bug delete gagal (presisi milidetik `date_time`) → format 121 →
    209 test.
11. Fix `getPool is not a function` (config/database.js belum ke-update di
    komputer user) + nambah scan_no ke modal edit & konfirmasi delete.
12. User minta rapiin UI Record (field, notifikasi, pagination) — overhaul
    besar, banyak trial pertama SALAH karena cuma baca OCR teks screenshot.
13. User frustrasi, banding-bandingin ke project lain ("KasirKu") yang lebih
    rapi — pivot ke metodologi render-ulang-beneran pakai Playwright
    (lihat §5) — ketemu akar masalah asli: `@import` berbahaya,
    `.card-header` design system, flexbox whitespace quirk, tombol vs field
    shadow mismatch.
14. User minta cek ulang via link GitHub → **akses GitHub keblokir** di sisi
    tool (bash & web_fetch), dicoba berkali-kali tetap gagal.
15. File ini di-update (kondisi saat ditulis: user terakhir diminta clean
    rebuild utk fix Record page, belum ada konfirmasi hasil).

---

## 8. Kemungkinan langkah selanjutnya

- **Prioritas:** konfirmasi hasil clean-rebuild halaman Record — apa
  tampilannya udah bener sekarang?
- Fix bug shipping stock minus (§3) — nunggu user setuju.
- Unit test frontend Angular (`scan-system`) — belum mulai.
- Kalau user laporan halaman LAIN (bukan Record/Backup) juga "aneh", cek
  apakah ada pola serupa (component .scss lain punya `@import` berbahaya,
  atau pola flex/shadow-mismatch yang sama) — tapi jangan asumsikan otomatis,
  tetap verifikasi lewat render Playwright dulu.
- Jangan tawarin ulang rename "Transaction" di sidebar (user udah nolak).