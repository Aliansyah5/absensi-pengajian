# 📚 Aplikasi Absensi Pengajian

Aplikasi web modern untuk mengelola absensi jamaah pengajian dengan fitur lengkap dan tampilan yang responsif.

## ✨ Fitur Utama

- **Dashboard Informatif**: Statistik kehadiran real-time dan ringkasan data
- **Manajemen Jamaah**: Kelola data jamaah berdasarkan kategori Putra dan Putri
- **Input Absensi**: Interface intuitif untuk mencatat kehadiran (Hadir/Absen/Izin)
- **Laporan Bulanan**: Rekap kehadiran dengan analisis persentase dan level kehadiran
- **Autentikasi**: Login khusus admin dan super admin
- **Responsive Design**: Tampilan yang optimal di desktop dan mobile

## 🛠 Stack Teknologi

- **Frontend**: Svelte.js + SvelteKit
- **Backend & Database**: Supabase (PostgreSQL + Auth)
- **Styling**: CSS dengan variabel modern
- **Icons**: Lucide Svelte
- **Build Tool**: Vite

## 📋 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Node.js versi 18 atau lebih baru
- npm atau yarn
- Akun Supabase (gratis)
- Git

## 🚀 Langkah-langkah Setup

### 1. Clone atau Setup Proyek

```bash
# Jika menggunakan git clone (jika ada repository)
git clone <repository-url>
cd absensi-pengajian-app

# Atau gunakan proyek yang sudah ada
cd c:/xampp/htdocs/absensi-pengajian/absensi-pengajian-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### a. Buat Proyek Supabase Baru

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Daftar atau login ke akun Anda
3. Klik "New Project"
4. Isi detail proyek:
   - **Name**: Absensi Pengajian
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih yang terdekat dengan lokasi Anda
5. Tunggu hingga proyek selesai dibuat (sekitar 2 menit)

#### b. Dapatkan Kredensial Supabase

1. Di dashboard Supabase, pilih proyek Anda
2. Klik **Settings** > **API**
3. Salin:
   - **Project URL**
   - **anon public key**

#### c. Konfigurasi Environment Variables

1. Salin file `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dan isi dengan kredensial Supabase:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Setup Database

#### a. Buat Skema Database

1. Di Supabase dashboard, buka **SQL Editor**
2. Salin seluruh isi file `database/schema.sql`
3. Paste di SQL Editor dan klik **Run**
4. Tunggu hingga semua tabel terbuat

#### b. Verifikasi Setup Database

1. Buka **Table Editor** di Supabase
2. Pastikan tabel-tabel berikut sudah terbuat:
   - `muser` (users/admin)
   - `mkategori` (kategori putra/putri)
   - `mdaerah`, `mdesa`, `mmasjid` (master lokasi)
   - `mkelompok`, `mpengajian` (master pengajian)
   - `mjamaah` (data jamaah)
   - `absensi` (data kehadiran)
   - Dan tabel master lainnya

#### c. Setup Auth Supabase

1. Di Supabase dashboard, buka **Authentication** > **Settings**
2. Pastikan **Enable email confirmations** dimatikan untuk development
3. Di bagian **Auth Providers**, pastikan **Email** provider aktif

### 5. Tambah Data Awal (Opsional)

Jika ingin menambah data test, Anda bisa:

1. Gunakan data seed yang sudah ada di schema.sql
2. Atau tambah data manual melalui Supabase Table Editor

**Data Admin Default:**

- Email: `admin@pengajian.com`
- Password: `password`
- Role: `super_admin`

### 6. Jalankan Aplikasi

```bash
# Development mode
npm run dev

# Build untuk production
npm run build

# Preview build
npm run preview
```

Aplikasi akan berjalan di `http://localhost:5173`

## 🔑 Login Default

Gunakan kredensial berikut untuk login:

**Super Admin:**

- Email: `admin@pengajian.com`
- Password: `password`

**Admin:**

- Email: `ustadz@pengajian.com`
- Password: `password`

## 📱 Fitur-fitur Aplikasi

### Dashboard

- Statistik total jamaah (putra/putri)
- Ringkasan absensi hari ini
- Quick actions untuk navigasi cepat

### Data Jamaah

- Daftar jamaah dengan kategori
- Filter berdasarkan kategori
- Pencarian nama/nomor induk
- Informasi detail jamaah

### Input Absensi

- Pilih pengajian dan tanggal
- Input status kehadiran (H/A/I)
- Bulk actions untuk efisiensi
- Statistik real-time

### Laporan

- Rekap kehadiran bulanan
- Filter berdasarkan periode dan kategori
- Export ke format CSV
- Analisis persentase kehadiran

## 🎨 Kustomisasi

### Tema dan Styling

Aplikasi menggunakan CSS variables yang dapat disesuaikan di file `src/app.css`:

```css
:root {
  --primary-500: #0ea5e9; /* Warna utama */
  --success-500: #22c55e; /* Warna sukses */
  --warning-500: #f59e0b; /* Warna peringatan */
  --error-500: #ef4444; /* Warna error */
  /* ... variable lainnya */
}
```

### Menambah Menu/Halaman Baru

1. Buat file halaman baru di `src/routes/`
2. Tambahkan menu di `src/lib/components/Navbar.svelte`
3. Update array `menuItems` dengan route baru

## 🔧 Troubleshooting

### Error: "Cannot find package '@sveltejs/adapter-auto'"

```bash
npm install
```

### Error: "Supabase connection failed"

1. Periksa file `.env` pastikan URL dan key benar
2. Pastikan proyek Supabase sudah aktif
3. Cek koneksi internet

### Error: "Table doesn't exist"

1. Pastikan schema.sql sudah dijalankan di Supabase
2. Refresh browser dan coba lagi
3. Cek di Supabase Table Editor apakah tabel sudah ada

### Error saat login

1. Pastikan tabel `muser` sudah ada
2. Cek apakah data admin default sudah ter-insert
3. Pastikan Supabase Auth settings sudah benar

## 📚 Pengembangan Lanjutan

### Menambah Fitur Baru

1. **Notifikasi**: Implementasi push notification untuk reminder
2. **QR Code**: Absensi menggunakan QR code
3. **Multi-tenancy**: Support multiple organisasi
4. **Advanced Analytics**: Grafik dan chart untuk analisis data
5. **Mobile App**: Versi mobile menggunakan Capacitor

### Deployment

#### Vercel (Recommended)

1. Push kode ke GitHub
2. Connect repository di Vercel
3. Set environment variables
4. Deploy

#### Netlify

1. Build aplikasi: `npm run build`
2. Upload folder `dist` ke Netlify
3. Set environment variables

#### Server Sendiri

1. Build aplikasi: `npm run build`
2. Serve folder `dist` dengan web server (Apache/Nginx)

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur: `git checkout -b fitur-baru`
3. Commit perubahan: `git commit -m 'Tambah fitur baru'`
4. Push ke branch: `git push origin fitur-baru`
5. Buat Pull Request

## 📄 Lisensi

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## 🆘 Support

Jika mengalami masalah atau butuh bantuan:

1. Buka issue di GitHub repository
2. Sertakan detail error dan langkah untuk reproduce
3. Screenshot jika diperlukan

## 📝 Changelog

### Version 1.0.0

- ✅ Fitur login admin
- ✅ Dashboard dengan statistik
- ✅ Manajemen data jamaah
- ✅ Input absensi dengan bulk actions
- ✅ Laporan bulanan dengan export CSV
- ✅ Design responsive
- ✅ Supabase integration

## 🙏 Acknowledgments

- [Svelte](https://svelte.dev/) - Framework frontend yang amazing
- [Supabase](https://supabase.com/) - Backend-as-a-Service yang powerful
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [Inter Font](https://fonts.google.com/specimen/Inter) - Typography yang clean
