# 📋 Panduan Implementasi Struktur Database Baru

## 🎯 Ringkasan Perubahan

Sistem absensi pengajian telah diperbarui dengan struktur database yang lebih komprehensif dan sistem permission berbasis role untuk Super Admin.

## 🗃️ Struktur Database Baru

### Master Tables (Hanya Super Admin yang dapat mengelola)

1. **mdaerah** - Master data daerah
2. **mdesa** - Master data desa
3. **mdapukan** - Master data dapukan
4. **mkelompok** - Master data kelompok (dengan relasi ke desa dan daerah)
5. **mmasjid** - Master data masjid (dengan relasi ke kelompok)
6. **mpengajian** - Master data pengajian
7. **mkategori** - Master data kategori jamaah
8. **mhadist** - Master data kitab hadist
9. **malquran** - Master data surat Al-Quran
10. **mjamaah** - Master data jamaah (dengan relasi lengkap)

### Transaction Tables

1. **absensi** - Header transaksi absensi (sesi pengajian)
2. **dabsensi** - Detail absensi per jamaah
3. **user_roles** - Manajemen role pengguna

## 🔐 Sistem Permission

### Role Types

- **super_admin**: Akses penuh termasuk mengelola master data
- **admin**: Akses mengelola transaksi absensi
- **user**: Akses read-only

### Validation Rules

- Master tables (m\*): Hanya Super Admin yang bisa Create, Update, Delete
- Semua user authenticated bisa Read master data
- Transaction tables: Semua user authenticated bisa mengelola

## 📁 File Structure Baru

```
src/
├── lib/
│   └── services/
│       ├── masterData.js     # Service untuk CRUD master data
│       └── absensi.js        # Service untuk transaksi absensi
├── routes/
│   ├── master/
│   │   └── +page.svelte      # Interface manajemen master data
│   └── absensi-new/
│       └── +page.svelte      # Interface absensi dengan struktur baru
└── database/
    └── schema_new.sql        # SQL schema untuk Supabase
```

## 🚀 Langkah-langkah Implementasi

### 1. Setup Database di Supabase

```sql
-- Jalankan script di database/schema_new.sql
-- Script akan membuat:
-- ✅ Semua tabel master dan transaksi
-- ✅ Row Level Security policies
-- ✅ Helper functions untuk validation
-- ✅ Sample data untuk testing
```

### 2. Set Super Admin Role

```sql
-- Tambahkan role super admin untuk user pertama
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-dari-supabase-auth', 'super_admin');
```

### 3. Update Environment

Pastikan konfigurasi Supabase sudah benar di `src/lib/utils/supabase.js`

### 4. Test Implementasi

1. **Test Master Data Management:**

   - Login sebagai Super Admin
   - Akses `/master`
   - Test CRUD operations pada semua master tables

2. **Test Absensi System:**

   - Akses `/absensi-new`
   - Test create/update absensi session
   - Test save individual attendance

3. **Test Permission System:**
   - Login sebagai user biasa
   - Verify tidak bisa akses master data management
   - Verify bisa read master data dan manage absensi

## 🔧 Service APIs

### MasterDataService

```javascript
// Check permission
await MasterDataService.isSuperAdmin();
await MasterDataService.getUserRole();

// Generic CRUD
await MasterDataService.getMasterData("tablename");
await MasterDataService.createMasterRecord("tablename", data);
await MasterDataService.updateMasterRecord("tablename", id, data);
await MasterDataService.deleteMasterRecord("tablename", id);
```

### Specific Services

```javascript
// Pengajian
await PengajianService.getAllPengajian();
await PengajianService.createPengajian(data);

// Jamaah
await JamaahService.getAllJamaah(filters);
await JamaahService.createJamaah(data);

// Kelompok (dengan relasi)
await KelompokService.getAllKelompok(); // Include desa & daerah

// Dan seterusnya untuk semua master tables...
```

### AbsensiService

```javascript
// Session management
await AbsensiService.createAbsensi(sessionData);
await AbsensiService.updateAbsensi(id, sessionData);
await AbsensiService.getAbsensiByTanggalPengajian(date, pengajianId);

// Detail attendance
await AbsensiService.saveAbsensiDetail(absensiId, jamaahAbsensiArray);
await AbsensiService.getAbsensiDetail(absensiId);

// Reports
await AbsensiService.getAbsensiStats(filters);
await AbsensiService.getLaporanAbsensiJamaah(jamaahId, filters);
```

## 📊 Database Schema Relations

```
mdaerah (1) ────┐
                ├─── mkelompok (n)
mdesa (1) ──────┘         │
                          ├─── mmasjid (n)
                          └─── mjamaah (n)
                                   │
mkategori (1) ─────────────────────┘
mdapukan (1) ──────────────────────┘

mpengajian (1) ─── absensi (n) ─── dabsensi (n) ─── mjamaah (1)
mmasjid (1) ───────┘
malquran (1) ──────┘
mhadist (1) ───────┘
```

## 🎨 UI Components

### Master Data Management (`/master`)

- **Tabs** untuk setiap master table
- **CRUD Operations** dengan modal forms
- **Permission validation** - hanya Super Admin
- **Search & Filter** capabilities
- **Responsive design** untuk desktop dan mobile

### New Absensi System (`/absensi-new`)

- **Session Configuration** - pengajian details, timing, materi
- **Materi Al-Quran** - surat, ayat, pengajar
- **Materi Hadist** - kitab, halaman, pengajar
- **Bulk Actions** - set all status sekaligus
- **Individual Attendance** - per jamaah dengan 4 status (H/A/S/I)
- **Real-time Summary** - statistik kehadiran

## 🔍 Status Absensi

- **H** = Hadir
- **A** = Absen
- **S** = Sakit
- **I** = Izin

## 📱 Responsive Design

- **Mobile First** approach
- **Desktop Enhancement** dengan grid layouts
- **Touch-friendly** buttons untuk mobile
- **Keyboard navigation** support

## 🛠️ Migration Strategy

1. **Backup** existing data
2. **Run** new schema di Supabase
3. **Migrate** existing data ke struktur baru
4. **Test** semua functionality
5. **Deploy** ke production

## 📈 Benefits

1. **Structured Data** - Relasi yang jelas antar tabel
2. **Role-based Access** - Security yang lebih baik
3. **Comprehensive Logging** - Track semua perubahan
4. **Scalable Architecture** - Mudah ditambah fitur baru
5. **Better Reporting** - Data yang lebih kaya untuk analisis

## 🐛 Troubleshooting

### Permission Errors

```bash
# Check user role
SELECT role FROM user_roles WHERE user_id = 'current-user-id';

# Grant super admin
INSERT INTO user_roles (user_id, role) VALUES ('user-id', 'super_admin');
```

### RLS Issues

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Debug RLS
SELECT auth.uid(), auth.role();
```

### Service Errors

```javascript
// Enable detailed error logging
console.error("Service error:", error.message, error.details);
```

## 📞 Support

Jika ada pertanyaan atau issue, silakan cek:

1. Console browser untuk error messages
2. Supabase dashboard untuk database issues
3. Network tab untuk API call failures

---

**Status**: ✅ Ready for implementation
**Version**: 1.0.0
**Last Updated**: 2025-10-06
