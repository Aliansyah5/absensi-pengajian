-- ============================================
-- SKEMA DATABASE APLIKASI ABSENSI PENGAJIAN
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABEL MASTER
-- ============================================

-- Tabel Master User (Admin dan Super Admin)
CREATE TABLE muser (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Daerah
CREATE TABLE mdaerah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_daerah VARCHAR(10) UNIQUE NOT NULL,
    nama_daerah VARCHAR(100) NOT NULL,
    provinsi VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Desa
CREATE TABLE mdesa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daerah_id UUID NOT NULL REFERENCES mdaerah(id) ON DELETE CASCADE,
    kode_desa VARCHAR(10) UNIQUE NOT NULL,
    nama_desa VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Masjid
CREATE TABLE mmasjid (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    desa_id UUID NOT NULL REFERENCES mdesa(id) ON DELETE CASCADE,
    kode_masjid VARCHAR(10) UNIQUE NOT NULL,
    nama_masjid VARCHAR(100) NOT NULL,
    alamat TEXT,
    imam VARCHAR(100),
    contact_person VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Kategori (Putra/Putri)
CREATE TABLE mkategori (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_kategori VARCHAR(10) UNIQUE NOT NULL,
    nama_kategori VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Kelompok
CREATE TABLE mkelompok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    masjid_id UUID NOT NULL REFERENCES mmasjid(id) ON DELETE CASCADE,
    kategori_id UUID NOT NULL REFERENCES mkategori(id) ON DELETE CASCADE,
    kode_kelompok VARCHAR(10) UNIQUE NOT NULL,
    nama_kelompok VARCHAR(100) NOT NULL,
    pembina VARCHAR(100),
    jadwal_hari VARCHAR(20),
    jadwal_waktu TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Pengajian
CREATE TABLE mpengajian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id UUID NOT NULL REFERENCES mkelompok(id) ON DELETE CASCADE,
    kode_pengajian VARCHAR(10) UNIQUE NOT NULL,
    nama_pengajian VARCHAR(100) NOT NULL,
    jenis_pengajian VARCHAR(50) NOT NULL,
    materi TEXT,
    ustadz VARCHAR(100),
    durasi_menit INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Jamaah (Siswa)
CREATE TABLE mjamaah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id UUID NOT NULL REFERENCES mkelompok(id) ON DELETE CASCADE,
    kategori_id UUID NOT NULL REFERENCES mkategori(id) ON DELETE CASCADE,
    nomor_induk VARCHAR(20) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    nama_panggilan VARCHAR(50),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    nama_orangtua VARCHAR(100),
    contact_orangtua VARCHAR(15),
    tanggal_daftar DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Al-Quran (untuk tracking bacaan)
CREATE TABLE malquran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_surat INTEGER NOT NULL,
    nama_surat VARCHAR(50) NOT NULL,
    jumlah_ayat INTEGER NOT NULL,
    jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Makkiyah', 'Madaniyah')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Hadits (untuk tracking hafalan)
CREATE TABLE mhadist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_hadits VARCHAR(20) NOT NULL,
    judul_hadits VARCHAR(100) NOT NULL,
    sumber VARCHAR(50) NOT NULL,
    tingkat_kesulitan VARCHAR(20) DEFAULT 'mudah',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Client (untuk multi-tenancy jika diperlukan)
CREATE TABLE mclient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_client VARCHAR(10) UNIQUE NOT NULL,
    nama_client VARCHAR(100) NOT NULL,
    alamat TEXT,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Dapukan (klasifikasi kemampuan)
CREATE TABLE mdapukan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_dapukan VARCHAR(10) UNIQUE NOT NULL,
    nama_dapukan VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    level_urutan INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL TRANSAKSI
-- ============================================

-- Tabel Transaksi Absensi
CREATE TABLE absensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jamaah_id UUID NOT NULL REFERENCES mjamaah(id) ON DELETE CASCADE,
    pengajian_id UUID NOT NULL REFERENCES mpengajian(id) ON DELETE CASCADE,
    tanggal_absensi DATE NOT NULL,
    waktu_absensi TIME DEFAULT CURRENT_TIME,
    status_kehadiran VARCHAR(1) NOT NULL CHECK (status_kehadiran IN ('H', 'A', 'I')),
    keterangan TEXT,
    user_input_id UUID REFERENCES muser(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint untuk mencegah duplikasi absensi per hari
    UNIQUE(jamaah_id, pengajian_id, tanggal_absensi)
);

-- Tabel Detail Absensi (untuk data tambahan)
CREATE TABLE dabsensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    absensi_id UUID NOT NULL REFERENCES absensi(id) ON DELETE CASCADE,
    jenis_detail VARCHAR(50) NOT NULL,
    nilai_detail TEXT,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES untuk PERFORMA
-- ============================================

-- Indexes untuk tabel absensi
CREATE INDEX idx_absensi_jamaah_id ON absensi(jamaah_id);
CREATE INDEX idx_absensi_pengajian_id ON absensi(pengajian_id);
CREATE INDEX idx_absensi_tanggal ON absensi(tanggal_absensi);
CREATE INDEX idx_absensi_status ON absensi(status_kehadiran);

-- Indexes untuk tabel jamaah
CREATE INDEX idx_jamaah_kelompok_id ON mjamaah(kelompok_id);
CREATE INDEX idx_jamaah_kategori_id ON mjamaah(kategori_id);
CREATE INDEX idx_jamaah_nomor_induk ON mjamaah(nomor_induk);
CREATE INDEX idx_jamaah_is_active ON mjamaah(is_active);

-- Indexes untuk tabel pengajian
CREATE INDEX idx_pengajian_kelompok_id ON mpengajian(kelompok_id);
CREATE INDEX idx_pengajian_is_active ON mpengajian(is_active);

-- Indexes untuk tabel kelompok
CREATE INDEX idx_kelompok_masjid_id ON mkelompok(masjid_id);
CREATE INDEX idx_kelompok_kategori_id ON mkelompok(kategori_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk auto-update timestamp
CREATE TRIGGER update_muser_updated_at BEFORE UPDATE ON muser FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mdaerah_updated_at BEFORE UPDATE ON mdaerah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mdesa_updated_at BEFORE UPDATE ON mdesa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mmasjid_updated_at BEFORE UPDATE ON mmasjid FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mkategori_updated_at BEFORE UPDATE ON mkategori FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mkelompok_updated_at BEFORE UPDATE ON mkelompok FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mpengajian_updated_at BEFORE UPDATE ON mpengajian FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mjamaah_updated_at BEFORE UPDATE ON mjamaah FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mclient_updated_at BEFORE UPDATE ON mclient FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mdapukan_updated_at BEFORE UPDATE ON mdapukan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_absensi_updated_at BEFORE UPDATE ON absensi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATA SEED (CONTOH DATA AWAL)
-- ============================================

-- Insert kategori dasar
INSERT INTO mkategori (kode_kategori, nama_kategori, deskripsi) VALUES
('PUTRA', 'Putra', 'Kelompok jamaah laki-laki'),
('PUTRI', 'Putri', 'Kelompok jamaah perempuan');

-- Insert user admin default
INSERT INTO muser (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@pengajian.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'super_admin'),
('ustadz', 'ustadz@pengajian.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ustadz Admin', 'admin');

-- Insert daerah contoh
INSERT INTO mdaerah (kode_daerah, nama_daerah, provinsi) VALUES
('JKT001', 'Jakarta Pusat', 'DKI Jakarta'),
('BDG001', 'Bandung Kota', 'Jawa Barat');

-- Insert desa contoh
INSERT INTO mdesa (daerah_id, kode_desa, nama_desa, kecamatan) VALUES
((SELECT id FROM mdaerah WHERE kode_daerah = 'JKT001'), 'DSA001', 'Menteng', 'Menteng'),
((SELECT id FROM mdaerah WHERE kode_daerah = 'BDG001'), 'DSA002', 'Cidadap', 'Cidadap');

-- Insert masjid contoh
INSERT INTO mmasjid (desa_id, kode_masjid, nama_masjid, alamat, imam) VALUES
((SELECT id FROM mdesa WHERE kode_desa = 'DSA001'), 'MSJ001', 'Masjid Al-Ikhlas', 'Jl. Menteng Raya No. 10', 'Ustadz Ahmad'),
((SELECT id FROM mdesa WHERE kode_desa = 'DSA002'), 'MSJ002', 'Masjid Ar-Rahman', 'Jl. Cidadap No. 5', 'Ustadz Budi');

-- Insert kelompok contoh
INSERT INTO mkelompok (masjid_id, kategori_id, kode_kelompok, nama_kelompok, pembina, jadwal_hari, jadwal_waktu) VALUES
((SELECT id FROM mmasjid WHERE kode_masjid = 'MSJ001'), (SELECT id FROM mkategori WHERE kode_kategori = 'PUTRA'), 'KLP001', 'Kelompok Putra A', 'Ustadz Ahmad', 'Sabtu', '08:00:00'),
((SELECT id FROM mmasjid WHERE kode_masjid = 'MSJ001'), (SELECT id FROM mkategori WHERE kode_kategori = 'PUTRI'), 'KLP002', 'Kelompok Putri A', 'Ustadzah Fatimah', 'Minggu', '08:00:00');

-- Insert pengajian contoh
INSERT INTO mpengajian (kelompok_id, kode_pengajian, nama_pengajian, jenis_pengajian, materi, ustadz) VALUES
((SELECT id FROM mkelompok WHERE kode_kelompok = 'KLP001'), 'PGJ001', 'Pengajian Tahfidz Putra', 'Tahfidz Al-Quran', 'Hafalan Juz 30', 'Ustadz Ahmad'),
((SELECT id FROM mkelompok WHERE kode_kelompok = 'KLP002'), 'PGJ002', 'Pengajian Tahfidz Putri', 'Tahfidz Al-Quran', 'Hafalan Juz 30', 'Ustadzah Fatimah');

-- ============================================
-- VIEWS UNTUK REPORTING
-- ============================================

-- View untuk rekap absensi bulanan
CREATE OR REPLACE VIEW v_rekap_absensi_bulanan AS
SELECT
    j.id as jamaah_id,
    j.nomor_induk,
    j.nama_lengkap,
    k.nama_kategori,
    p.nama_pengajian,
    DATE_TRUNC('month', a.tanggal_absensi) as bulan_tahun,
    COUNT(CASE WHEN a.status_kehadiran = 'H' THEN 1 END) as total_hadir,
    COUNT(CASE WHEN a.status_kehadiran = 'A' THEN 1 END) as total_absen,
    COUNT(CASE WHEN a.status_kehadiran = 'I' THEN 1 END) as total_izin,
    COUNT(*) as total_pertemuan,
    ROUND(
        (COUNT(CASE WHEN a.status_kehadiran = 'H' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
    ) as persentase_kehadiran
FROM mjamaah j
JOIN mkategori k ON j.kategori_id = k.id
JOIN mkelompok kl ON j.kelompok_id = kl.id
JOIN mpengajian p ON kl.id = p.kelompok_id
LEFT JOIN absensi a ON j.id = a.jamaah_id AND p.id = a.pengajian_id
WHERE j.is_active = true
GROUP BY j.id, j.nomor_induk, j.nama_lengkap, k.nama_kategori, p.nama_pengajian, DATE_TRUNC('month', a.tanggal_absensi)
ORDER BY bulan_tahun DESC, j.nama_lengkap;

-- View untuk dashboard statistik
CREATE OR REPLACE VIEW v_dashboard_statistik AS
SELECT
    COUNT(DISTINCT j.id) as total_jamaah,
    COUNT(DISTINCT CASE WHEN k.kode_kategori = 'PUTRA' THEN j.id END) as total_putra,
    COUNT(DISTINCT CASE WHEN k.kode_kategori = 'PUTRI' THEN j.id END) as total_putri,
    COUNT(DISTINCT p.id) as total_pengajian,
    COUNT(DISTINCT kl.id) as total_kelompok,
    COUNT(DISTINCT m.id) as total_masjid
FROM mjamaah j
LEFT JOIN mkategori k ON j.kategori_id = k.id
LEFT JOIN mkelompok kl ON j.kelompok_id = kl.id
LEFT JOIN mpengajian p ON kl.id = p.kelompok_id
LEFT JOIN mmasjid m ON kl.masjid_id = m.id
WHERE j.is_active = true;
