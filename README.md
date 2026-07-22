# CatatKu - Aplikasi Manajemen Keuangan Pribadi

**CatatKu** adalah aplikasi manajemen keuangan pribadi berbasis web yang dirancang untuk membantu pengguna mencatat, memantau, dan mengelola keuangan bulanan secara rapi, aman, dan intuitif.

---

## 🚀 Fitur Utama

- **🔐 Autentikasi & Keamanan Pengguna**
  - Registrasi & Login dengan enkripsi password (`bcryptjs`).
  - Manajemen sesi pengguna berbasis `express-session`.
  - Proteksi lengkap terhadap serangan CSRF (*Cross-Site Request Forgery*) pada seluruh formulir.
  - Pembatasan akses halaman menggunakan *middleware* `requireAuth`.

- **🏷️ Kelola Kategori Keuangan**
  - Pembuatan otomatis (*auto-seed*) kategori default saat pengguna baru mendaftar (Makanan, Transportasi, Pendidikan, Hiburan, Lainnya, Pemasukan Umum).
  - Manajemen CRUD (Tambah, Edit, Hapus) untuk kategori tipe Pemasukan (`INCOME`) maupun Pengeluaran (`EXPENSE`).
  - Proteksi hapus kategori jika kategori sedang digunakan oleh transaksi.

- **💸 Manajemen Transaksi**
  - Pencatatan transaksi pemasukan dan pengeluaran secara terinci (Jumlah, Kategori, Tanggal, dan Catatan/Deskripsi).
  - Tampilan daftar transaksi dengan paginasi dan filter jenis transaksi.
  - Validasi *server-side* ketat untuk memastikan data yang diinput valid (jumlah bernilai positif, kategori & tanggal wajib).

- **🎯 Anggaran Bulanan & Notifikasi Peringatan**
  - Penetapan target anggaran bulanan per kategori pengeluaran (`EXPENSE`).
  - Visualisasi *progress bar* pemakaian anggaran dengan warna dinamis (Hijau 🟢 → Kuning 🟡 → Merah 🔴).
  - Notifikasi & badge peringatan otomatis jika anggaran terpakai >80% (hampir habis) atau >100% (terlampaui).

- **📊 Dashboard Interaktif**
  - Ringkasan total saldo (*All-time balance*) yang dihitung otomatis (Total Pemasukan - Total Pengeluaran).
  - Rekap bulanan pemasukan dan pengeluaran berjalan.
  - Grafik *Doughnut Chart* (Chart.js) untuk perincian pengeluaran per kategori bulan ini.
  - Kartu peringatan singkat untuk anggaran yang kritis/hampir habis.

- **📈 Laporan & Visualisasi Keuangan**
  - Grafik *Bar Chart* tren 6 bulan terakhir yang membandingkan Pemasukan vs Pengeluaran.
  - Grafik *Pie Chart* komposisi pengeluaran per kategori yang dapat difilter berdasarkan Bulan & Tahun.
  - Tabel riwayat transaksi komprehensif dilengkapi filter berdasarkan rentang tanggal (*startDate* - *endDate*) dan kategori.

---

## 🛠️ Tech Stack

- **Backend / Core**: Node.js, Express.js
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Frontend & Views**: EJS (Embedded JavaScript templates), Tailwind CSS
- **Visualisasi Data**: Chart.js
- **Keamanan & Utilities**: `bcryptjs`, `express-session`, `csurf`

---

## 📁 Struktur Folder

```text
Catatku/
├── prisma/
│   ├── schema.prisma        # Schema database Prisma (User, Category, Transaction, Budget)
│   └── migrations/           # Riwayat migrasi database
├── public/
│   └── css/                  # File CSS terkompilasi Tailwind
├── src/
│   ├── controllers/          # HTTP request/response handlers
│   ├── services/             # Jantung logika bisnis & kueri database (Prisma)
│   ├── routes/               # Definisi rute Express per modul
│   ├── middlewares/          # Middleware autentikasi (requireAuth)
│   ├── lib/                  # Inisialisasi Prisma Client
│   └── app.js                # Entry point utama aplikasi Express
├── views/                    # EJS View templates (auth, dashboard, categories, transactions, budgets, reports)
├── .env.example              # Template konfigurasi environment
├── package.json
└── README.md
```

---

## 💻 Langkah Instalasi Lokal

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### 1. Clone Repositori
```bash
git clone https://github.com/lainasyafira-netizen/catatku.git
cd catatku
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Setup Environment Variables (.env)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan variabel environment pada file `.env` (khususnya koneksi PostgreSQL & `SESSION_SECRET`):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/catatkudb?schema=public"
SESSION_SECRET="rahasia-super-aman"
PORT=3000
```

### 4. Jalankan Migrasi Database
Pastikan PostgreSQL Anda sudah berjalan, kemudian jalankan migrasi Prisma:
```bash
npx prisma migrate dev
```

### 5. Jalankan Aplikasi
Jalankan server dalam mode pengembangan (*development mode*):
```bash
npm run dev
```

Buka peramban (*browser*) Anda dan akses:
`http://localhost:3000`
