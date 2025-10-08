-- ===================================
-- NEW DATABASE SCHEMA FOR ABSENSI PENGAJIAN
-- ===================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS dabsensi CASCADE;
DROP TABLE IF EXISTS absensi CASCADE;
DROP TABLE IF EXISTS mjamaah CASCADE;
DROP TABLE IF EXISTS mmasjid CASCADE;
DROP TABLE IF EXISTS mkelompok CASCADE;
DROP TABLE IF EXISTS mpengajian CASCADE;
DROP TABLE IF EXISTS mkategori CASCADE;
DROP TABLE IF EXISTS mhadist CASCADE;
DROP TABLE IF EXISTS malquran CASCADE;
DROP TABLE IF EXISTS mdesa CASCADE;
DROP TABLE IF EXISTS mdaerah CASCADE;
DROP TABLE IF EXISTS mdapukan CASCADE;
DROP TABLE IF EXISTS muser CASCADE;

-- Create user table for authentication
CREATE TABLE muser (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'super_admin', 'admin', 'user'
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_modified VARCHAR(255)
);

-- Create user roles table for super admin management
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'super_admin', 'admin', 'user'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Master Tables (Only Super Admin can modify)

-- Master Daerah
CREATE TABLE mdaerah (
    id SERIAL PRIMARY KEY,
    nama_daerah VARCHAR(25),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Desa
CREATE TABLE mdesa (
    id SERIAL PRIMARY KEY,
    nama_desa VARCHAR(25),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Dapukan
CREATE TABLE mdapukan (
    id SERIAL PRIMARY KEY,
    nama_dapukan VARCHAR(100),
    deskripsi VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Kelompok
CREATE TABLE mkelompok (
    id SERIAL PRIMARY KEY,
    nama_kelompok VARCHAR(25),
    id_desa INTEGER REFERENCES mdesa(id) ON DELETE CASCADE ON UPDATE CASCADE,
    id_daerah INTEGER REFERENCES mdaerah(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Masjid
CREATE TABLE mmasjid (
    id SERIAL PRIMARY KEY,
    nama_masjid VARCHAR(25),
    id_kelompok INTEGER REFERENCES mkelompok(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Pengajian
CREATE TABLE mpengajian (
    id SERIAL PRIMARY KEY,
    nama_pengajian VARCHAR(25),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active INTEGER NOT NULL DEFAULT 1,
    user_modified VARCHAR(15)
);

-- Master Kategori
CREATE TABLE mkategori (
    id SERIAL PRIMARY KEY,
    category VARCHAR(45) NOT NULL,
    "group" VARCHAR(45),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_modified VARCHAR(45) NOT NULL
);

-- Master Hadist
CREATE TABLE mhadist (
    id SERIAL PRIMARY KEY,
    nama_hadist VARCHAR(25),
    jumlah_halaman INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_modified VARCHAR(15),
    active INTEGER NOT NULL DEFAULT 1
);

-- Master Al-Quran
CREATE TABLE malquran (
    id SERIAL PRIMARY KEY,
    nama_surat VARCHAR(25),
    juz INTEGER,
    jumlah_ayat INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_modified VARCHAR(15) NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
);

-- Master Jamaah
CREATE TABLE mjamaah (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    tgl_lahir DATE,
    jk VARCHAR(1) CHECK (jk IN ('L', 'P')) NOT NULL,
    id_kategori INTEGER REFERENCES mkategori(id),
    alamat VARCHAR(100),
    email VARCHAR(20),
    status_nikah INTEGER DEFAULT 0,
    telp_murid VARCHAR(50),
    id_kelompok INTEGER NOT NULL REFERENCES mkelompok(id) ON DELETE CASCADE,
    pendidikan INTEGER,
    sekolah VARCHAR(50),
    jurusan VARCHAR(50),
    walimurid VARCHAR(50),
    telp_wali VARCHAR(50),
    alamat_wali VARCHAR(50),
    email_wali VARCHAR(30),
    id_dapukan INTEGER REFERENCES mdapukan(id) ON DELETE CASCADE,
    active INTEGER DEFAULT 1,
    user_modified VARCHAR(15),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Tables

-- Absensi (Main attendance record)
CREATE TABLE absensi (
    id SERIAL PRIMARY KEY,
    pengajian INTEGER REFERENCES mpengajian(id),
    tgl DATE,
    tempat INTEGER REFERENCES mmasjid(id),
    kelompok VARCHAR(50),
    peserta VARCHAR(50),
    tingkat INTEGER,
    jam_mulai TIME,
    jam_akhir TIME,
    quran INTEGER REFERENCES malquran(id),
    pengajar_quran VARCHAR(50),
    ayat_awal INTEGER,
    ayat_akhir INTEGER,
    hadist INTEGER REFERENCES mhadist(id),
    pengajar_hadist VARCHAR(50),
    hal_awal INTEGER,
    hal_akhir INTEGER,
    penasehat VARCHAR(50),
    infaq DECIMAL(10,0),
    active INTEGER DEFAULT 1,
    user_modified VARCHAR(15),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detail Absensi (Individual attendance)
CREATE TABLE dabsensi (
    id INTEGER NOT NULL REFERENCES absensi(id),
    idx SERIAL,
    id_siswa INTEGER REFERENCES mjamaah(id),
    status VARCHAR(1) CHECK (status IN ('A', 'H', 'S', 'I')) DEFAULT 'A',
    keterangan TEXT,
    jam_datang TIME,
    user_modified VARCHAR(15),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (idx, id)
);

-- ===================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================

-- Enable RLS for all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdaerah ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdapukan ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkelompok ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmasjid ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpengajian ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE mhadist ENABLE ROW LEVEL SECURITY;
ALTER TABLE malquran ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjamaah ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE dabsensi ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_uuid AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM user_roles WHERE user_id = auth.uid()),
        'user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- POLICIES FOR MASTER TABLES (Super Admin Only)
-- ===================================

-- User Roles policies
CREATE POLICY "Super admin can manage user roles" ON user_roles
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Master table policies (Super Admin only for CUD, all authenticated users can read)
CREATE POLICY "All authenticated users can read master data" ON mdaerah
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only super admin can modify master data" ON mdaerah
    FOR ALL USING (is_super_admin(auth.uid()));

-- Apply same pattern to all master tables
CREATE POLICY "All authenticated users can read master data" ON mdesa
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mdesa
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mdapukan
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mdapukan
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mkelompok
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mkelompok
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mmasjid
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mmasjid
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mpengajian
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mpengajian
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mkategori
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mkategori
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mhadist
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mhadist
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON malquran
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON malquran
    FOR ALL USING (is_super_admin(auth.uid()));

CREATE POLICY "All authenticated users can read master data" ON mjamaah
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only super admin can modify master data" ON mjamaah
    FOR ALL USING (is_super_admin(auth.uid()));

-- ===================================
-- POLICIES FOR TRANSACTION TABLES
-- ===================================

-- Absensi - all authenticated users can manage
CREATE POLICY "Authenticated users can manage absensi" ON absensi
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage detail absensi" ON dabsensi
    FOR ALL USING (auth.role() = 'authenticated');

-- ===================================
-- INITIAL DATA
-- ===================================

-- Insert default super admin role (replace with actual user UUID)
-- This should be done manually in Supabase dashboard

-- Sample data for testing
INSERT INTO mdaerah (nama_daerah, user_modified) VALUES
('Jakarta Pusat', 'system'),
('Jakarta Barat', 'system');

INSERT INTO mdesa (nama_desa, user_modified) VALUES
('Kelurahan A', 'system'),
('Kelurahan B', 'system'),
('Kelurahan C', 'system');

INSERT INTO mdapukan (nama_dapukan, deskripsi, user_modified) VALUES
('Dapukan Ikhwan', 'Kelompok dapukan untuk ikhwan', 'system');

INSERT INTO mkelompok (nama_kelompok, id_desa, id_daerah, user_modified) VALUES
('Kelompok 1', 1, 1, 'system'),
('Kelompok 2', 2, 1, 'system');

INSERT INTO mmasjid (nama_masjid, id_kelompok, user_modified) VALUES
('Masjid Al-Ikhlas', 1, 'system'),
('Masjid An-Nur', 2, 'system');

INSERT INTO mpengajian (nama_pengajian, user_modified) VALUES
('Pengajian Maghrib', 'system'),
('Pengajian Subuh', 'system'),
('Pengajian Ahad', 'system');

INSERT INTO mkategori (category, "group", user_modified) VALUES
('Anak-anak', 'Usia', 'system'),
('Remaja', 'Usia', 'system'),
('Dewasa', 'Usia', 'system'),
('Putra', 'Gender', 'system'),
('Putri', 'Gender', 'system');

-- Al-Quran sample data
INSERT INTO malquran (nama_surat, juz, jumlah_ayat, user_modified) VALUES
('Al-Fatihah', 1, 7, 'system'),
('Al-Baqarah', 1, 286, 'system'),
('Ali Imran', 3, 200, 'system');

-- Hadist sample data
INSERT INTO mhadist (nama_hadist, jumlah_halaman, user_modified) VALUES
('Shahih Bukhari', 1000, 'system'),
('Shahih Muslim', 800, 'system'),
('Sunan Abu Dawud', 600, 'system');

-- ===================================
-- SAMPLE USERS
-- ===================================

-- Insert Super Admin user
INSERT INTO muser (email, full_name, role, active, user_modified) VALUES
('admin@pengajian.com', 'Super Administrator', 'super_admin', 1, 'system'),
('admin2@pengajian.com', 'Administrator', 'admin', 1, 'system'),
('user@pengajian.com', 'Regular User', 'user', 1, 'system');
