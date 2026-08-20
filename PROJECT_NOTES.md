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
  Socket.IO dari `receiving.routes.js` & `shipping.routes.js` (sebelumnya
  socket emit gak pernah kirim field `firstStock`/`warehouseStock`/dst, jadi
  dashboard gak pernah update real-time walau infrastrukturnya udah ada).
- Endpoint duplikat `/api/stocks/warehouse-stats` yang punya bug sama kayak
  CI3 (first_stock == warehouse_stock, sumbernya sama) — udah dikonsolidasi
  pakai helper yang sama.

### 2.2 Import Excel (Master Data) — gagal total
- Root cause: header di template resmi (`ORIGINAL_BARCODE` dll, UPPERCASE)
  gak cocok sama field yang dicari backend (`row.original_barcode`,
  lowercase) → SEMUA baris ketolak "Missing required fields".
- Root cause KEDUA (ditemukan belakangan): staff sering bikin file sendiri
  dengan header beda-beda gaya (`"label size"` bukan `"size"`, `"original
  barcode"` pakai spasi, dll).
- **Fix:** dibuat `utils/headerNormalizer.js` — normalisasi header (strip
  spasi/underscore/dash, lowercase) + tabel alias (`labelsize→size`,
  `originalbarcode→original_barcode`, plus alias Bahasa Indonesia kayak
  `warna→color`, `jumlah→quantity`). Dipakai di `masterData.routes.js` POST
  `/import-barcode`.
- Sekalian fix: `four_digit` dan kolom lain kehilangan leading zero (`"0036"`
  jadi `36`) karena XLSX parser — di-fix pakai opsi `{ raw: false }`.
- Sekalian fix: response error detail per-baris dari backend gak pernah
  ditampilin di frontend (cuma nunjukin ringkasan "X imported, Y errors" tanpa
  alasan) — sekarang detail per-baris muncul.

### 2.3 Search — harus tekan Enter dulu
- Di **Master Data** dan **Option** (Model/Size/Production — satu komponen
  buat 3 tab), search box awalnya cuma jalan pas `(keyup.enter)`.
- **Fix:** ditambah `(input)` event → dorong ke RxJS `Subject` →
  `debounceTime(400)` → auto-search. Enter tetap bisa dipake buat instant
  search.

---

## 3. Bug yang DITEMUKAN tapi BELUM diperbaiki (perlu keputusan user)

### ⚠️ Shipping single-scan bisa bikin stock MINUS
- **Lokasi:** `routes/shipping.routes.js`, endpoint `POST /scan` (single scan,
  BUKAN batch).
- **Masalah:** endpoint ini TIDAK ngecek apakah stock cukup sebelum
  dikurangi. Bandingin sama `POST /batch-scan` yang PUNYA pengecekan
  (`Insufficient stock`, 400).
- **Dampak:** kalau stock cuma 5, scan shipping barang qty 12 → stock jadi
  -7, gak ada penolakan sama sekali.
- **Status:** didokumentasikan lewat test (`tests/routes/shipping.routes.test.js`,
  test bertanda ⚠️), TAPI belum diperbaiki. User bilang "nanti aja" waktu
  ditanya terakhir kali. **Kalau user tanya soal ini lagi, tawarkan buat
  ditambahin pengecekan stock yang sama kayak di batch-scan.**

---

## 4. Testing Backend — Setup lengkap, 192 test

Framework: **Jest** + **Supertest**, sudah terpasang di `scan-backend`.

- `jest.config.js` di root `scan-backend`
- `package.json` → script `"test": "jest"`, devDependency `supertest`
  ditambahkan
- Total: **192 test, 14 test suite, semua lolos** (sudah divalidasi di
  komputer user sendiri, termasuk lolos di zona waktu WIB dan tahan
  dijalankan paralel/berulang — sempat ada 1 flaky test soal timing async,
  sudah difix pakai polling `waitFor()` bukan nebak jumlah tick)

### Struktur file test:
```
tests/
  helpers/
    testApp.js              — bikin Express app minimal buat supertest,
                               auth dipalsuin lewat header x-test-username /
                               x-test-position (default IT)
  utils/
    warehouseStats.test.js      (5)  — logic First/Warehouse Stock
    headerNormalizer.test.js    (17) — alias header import Excel
    password.test.js            (8)  — verifyLogin, hashPassword, cache
    actAsLogger.test.js         (12) — audit log "act as"
  routes/
    receiving.routes.test.js    (9)
    shipping.routes.test.js     (7)  — termasuk test yang DOKUMENTASIIN bug §3
    auth.routes.test.js         (17) — login, act-as, refresh, verify
    user.routes.test.js         (17) — CRUD user, ganti password
    masterData.routes.test.js   (14) — CRUD barcode + batch-delete
    dashboard.routes.test.js    (8)
    stock.routes.test.js        (7)
    transaction.routes.test.js  (14)
    report.routes.test.js       (20) — daily/monthly/export XLSX
    option.routes.test.js       (36) — model/size/production, pakai
                                        describe.each karena 3 resource ini
                                        logic-nya identik
```

### Pola/konvensi yang dipakai di semua test route:
```js
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  dbName: 'TestDB'
}));
jest.mock('../../middleware/auth.middleware', () => ({
  verifyToken: (req, res, next) => next(),
  verifyRole: () => (req, res, next) => next()
}));
// lalu pakai createTestApp(router, '/api/xxx') dari tests/helpers/testApp.js
// atau bikin app custom kalau butuh req.user dengan shape khusus (auth/user tests)
```

- Database SELALU di-mock — test gak pernah nyentuh SQL Server beneran.
- Deskripsi test ditulis dalam **Bahasa Indonesia**, gaya kasual (lanjutan
  gaya komunikasi sepanjang project ini).
- Kalau ada async fire-and-forget (kayak refresh cache password di
  background), JANGAN nebak jumlah tick (`setImmediate` sekali dsb) — bisa
  flaky pas banyak test jalan paralel. Pakai polling `waitFor()`.

### Yang BELUM ditest:
- **Frontend Angular (`scan-system`)** — nol unit test asli. Infrastrukturnya
  udah ada (Jasmine + Karma, bawaan Angular CLI), ada 12 file `.spec.ts` tapi
  isinya cuma boilerplate `it('should create')`. Kalau user minta lanjut ke
  sini, mulai dari situ.

---

## 5. Konvensi kerja dengan user (PENTING)

- **Kalau perbaikan nyentuh < 5 file** → tempel source code LANGSUNG di
  chat (pakai code block), sebutin path file yang harus ditimpa. JANGAN
  bikin zip.
- **Kalau ≥ 5 file** → bundling jadi `.zip` pakai file tools, present via
  `present_files`.
- User selalu jalanin `npm test` / hasil di komputernya sendiri dan
  nge-paste hasilnya balik ke chat — JANGAN cuma percaya hasil dari sandbox
  sendiri kalau ada kecurigaan environment-dependent (timezone, dll).
- Gaya komunikasi: **Bahasa Indonesia santai**, teknis tapi gak kaku.
  Konteks memori user juga sudah mencatat preferensi ini secara permanen.
- User cenderung minta scope pekerjaan "sekalian aja" / "lanjutkan" — dia
  suka progress bertahap tapi menyeluruh, bukan berhenti di satu fitur.

---

## 6. Riwayat singkat sesi ini (kronologis)

1. Investigasi definisi First Stock vs Warehouse Stock (CI3 vs Angular) —
   ketemu keduanya sengaja dibedakan dengan benar di versi baru.
2. User minta perbaiki live-update dashboard → ketemu bug Socket.IO gak
   ngirim field yang dibutuhin → fix + bikin `warehouseStats.js`.
3. User laporan import Excel gagal → debug panjang (termasuk false alarm
   soal delimiter CSV, false alarm soal SQL Server "hang" yang ternyata cuma
   cold-cache biasa) → ketemu akar masalah header alias → fix.
4. Fix search debounce di Master Data & Option.
5. Audit menu sidebar — kesimpulan: gak ada menu yang mubazir/duplikat,
   cuma penamaan "Transaction" agak membingungkan (isinya ledger harian,
   bukan daftar transaksi individual) — user milih dibiarin.
6. Setup unit testing dari nol di backend, progresif nambah coverage sampai
   192 test / 14 suite, termasuk nemu bug baru (shipping stock bisa minus)
   dan benerin 2 flaky test (timezone-dependent, async-timing-dependent).
7. File ini dibuat sebagai dokumentasi handoff.

---

## 7. Kemungkinan langkah selanjutnya (belum diminta, tapi relevan)

- Fix bug shipping stock minus (§3) — tinggal tunggu user setuju.
- Unit test frontend Angular (`scan-system`) — belum mulai sama sekali.
- Review logic detail di fitur yang belum diaudit dalam-dalam: Report
  (rumus grand total, pivot summary), User Management edge cases lain,
  Backup & Cleanup / Record page di Master Data.
- Rename label "Transaction" di sidebar (user sempat ditawarin, milih
  "gak, biarin aja" — jangan diulang tawarin lagi kecuali user yang mulai).