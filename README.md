# CatatKu

Aplikasi pencatatan keuangan berbasis web untuk mahasiswa, membantu mencatat pemasukan/pengeluaran dan mengatur anggaran bulanan.

## Tech Stack
- Node.js
- Express.js
- Prisma (ORM)
- PostgreSQL
- Tailwind CSS
- Chart.js

## Langkah Instalasi Lokal

1. Clone repositori ini:
   ```bash
   git clone <repository_url>
   ```

2. Pindah ke direktori project:
   ```bash
   cd catatku
   ```

3. Install semua dependensi:
   ```bash
   npm install
   ```

4. Konfigurasi Environment Variables:
   - Copy file `.env.example` menjadi `.env`
   - Sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL lokal Anda.
   ```bash
   cp .env.example .env
   ```

5. Setup Database dengan Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. Build Tailwind CSS (Opsional jika Anda mengubah styling):
   ```bash
   npm run build:css
   ```

7. Jalankan aplikasi (Development mode):
   ```bash
   npm run dev
   ```

Aplikasi akan berjalan di `http://localhost:3000`.
