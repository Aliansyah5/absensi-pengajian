-- SQL Function untuk rekap absensi bulanan (jika dibutuhkan)
CREATE OR REPLACE FUNCTION get_rekap_absensi_bulanan(
    start_date DATE,
    end_date DATE,
    kategori_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    jamaah_id UUID,
    nomor_induk VARCHAR,
    nama_lengkap VARCHAR,
    nama_kategori VARCHAR,
    nama_pengajian VARCHAR,
    total_hadir BIGINT,
    total_absen BIGINT,
    total_izin BIGINT,
    total_pertemuan BIGINT,
    persentase_kehadiran NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as jamaah_id,
        j.nomor_induk,
        j.nama_lengkap,
        k.nama_kategori,
        p.nama_pengajian,
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
    LEFT JOIN absensi a ON j.id = a.jamaah_id
        AND p.id = a.pengajian_id
        AND a.tanggal_absensi BETWEEN start_date AND end_date
    WHERE j.is_active = true
        AND (kategori_filter IS NULL OR j.kategori_id = kategori_filter)
    GROUP BY j.id, j.nomor_induk, j.nama_lengkap, k.nama_kategori, p.nama_pengajian
    ORDER BY j.nama_lengkap;
END;
$$ LANGUAGE plpgsql;
