import { supabase } from "../utils/supabase.js";

/**
 * Absensi Service untuk struktur database baru
 * Mengelola absensi dengan tabel header (absensi) dan detail (dabsensi)
 */
export class AbsensiService {
  /**
   * Mendapatkan semua data absensi dengan pagination
   */
  static async getAllAbsensi(page = 1, limit = 10, filters = {}) {
    let query = supabase
      .from("absensi")
      .select(
        `
				*,
				mpengajian (nama_pengajian),
				mmasjid (nama_masjid),
				malquran (nama_surat),
				mhadist (nama_hadist)
			`
      )
      .eq("active", 1)
      .order("tgl", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (filters.pengajian) query = query.eq("pengajian", filters.pengajian);
    if (filters.tempat) query = query.eq("tempat", filters.tempat);
    if (filters.tanggal_mulai) query = query.gte("tgl", filters.tanggal_mulai);
    if (filters.tanggal_akhir) query = query.lte("tgl", filters.tanggal_akhir);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Mendapatkan data absensi berdasarkan ID
   */
  static async getAbsensiById(id) {
    const { data, error } = await supabase
      .from("absensi")
      .select(
        `
				*,
				mpengajian (nama_pengajian),
				mmasjid (nama_masjid, mkelompok(nama_kelompok)),
				malquran (nama_surat, juz, jumlah_ayat),
				mhadist (nama_hadist, jumlah_halaman)
			`
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mendapatkan detail absensi jamaah untuk satu sesi
   */
  static async getAbsensiDetail(absensiId) {
    const { data, error } = await supabase
      .from("dabsensi")
      .select(
        `
				*,
				mjamaah (nama, jk, mkategori(category), mkelompok(nama_kelompok))
			`
      )
      .eq("id", absensiId)
      .order("idx", { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Membuat sesi absensi baru
   */
  static async createAbsensi(absensiData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    const newAbsensi = {
      ...absensiData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_modified: user.email || "system",
      active: 1,
    };

    const { data, error } = await supabase
      .from("absensi")
      .insert(newAbsensi)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update data absensi
   */
  static async updateAbsensi(id, absensiData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    const updateData = {
      ...absensiData,
      updated_at: new Date().toISOString(),
      user_modified: user.email || "system",
    };

    const { data, error } = await supabase
      .from("absensi")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Menghapus sesi absensi (soft delete)
   */
  static async deleteAbsensi(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    const { data, error } = await supabase
      .from("absensi")
      .update({
        active: 0,
        updated_at: new Date().toISOString(),
        user_modified: user.email || "system",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Menyimpan detail absensi jamaah
   */
  static async saveAbsensiDetail(absensiId, jamaahAbsensi) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    // Hapus detail absensi yang sudah ada untuk sesi ini
    await supabase.from("dabsensi").delete().eq("id", absensiId);

    // Insert detail absensi baru
    const detailRecords = jamaahAbsensi.map((item, index) => ({
      id: absensiId,
      id_siswa: item.jamaah_id,
      status: item.status,
      keterangan: item.keterangan || null,
      jam_datang: item.jam_datang || null,
      user_modified: user.email || "system",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("dabsensi")
      .insert(detailRecords)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Mendapatkan absensi berdasarkan tanggal dan pengajian
   */
  static async getAbsensiByTanggalPengajian(tanggal, pengajianId) {
    const { data, error } = await supabase
      .from("absensi")
      .select(
        `
				*,
				dabsensi (*, mjamaah(nama, jk))
			`
      )
      .eq("tgl", tanggal)
      .eq("pengajian", pengajianId)
      .eq("active", 1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  /**
   * Mendapatkan statistik absensi
   */
  static async getAbsensiStats(filters = {}) {
    let query = supabase.from("dabsensi").select(`
				status,
				absensi!inner(tgl, pengajian, active)
			`);

    // Apply filters
    if (filters.tanggal_mulai) {
      query = query.gte("absensi.tgl", filters.tanggal_mulai);
    }
    if (filters.tanggal_akhir) {
      query = query.lte("absensi.tgl", filters.tanggal_akhir);
    }
    if (filters.pengajian) {
      query = query.eq("absensi.pengajian", filters.pengajian);
    }

    query = query.eq("absensi.active", 1);

    const { data, error } = await query;
    if (error) throw error;

    // Hitung statistik
    const stats = {
      total: data.length,
      hadir: data.filter((item) => item.status === "H").length,
      absen: data.filter((item) => item.status === "A").length,
      sakit: data.filter((item) => item.status === "S").length,
      izin: data.filter((item) => item.status === "I").length,
    };

    return stats;
  }

  /**
   * Mendapatkan laporan absensi jamaah
   */
  static async getLaporanAbsensiJamaah(jamaahId, filters = {}) {
    let query = supabase
      .from("dabsensi")
      .select(
        `
				*,
				absensi!inner(tgl, pengajian, mpengajian(nama_pengajian))
			`
      )
      .eq("id_siswa", jamaahId);

    // Apply filters
    if (filters.tanggal_mulai) {
      query = query.gte("absensi.tgl", filters.tanggal_mulai);
    }
    if (filters.tanggal_akhir) {
      query = query.lte("absensi.tgl", filters.tanggal_akhir);
    }
    if (filters.pengajian) {
      query = query.eq("absensi.pengajian", filters.pengajian);
    }

    query = query
      .eq("absensi.active", 1)
      .order("absensi.tgl", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  /**
   * Export data absensi untuk laporan
   */
  static async exportAbsensi(filters = {}) {
    let query = supabase
      .from("absensi")
      .select(
        `
				*,
				mpengajian (nama_pengajian),
				mmasjid (nama_masjid),
				dabsensi (
					*,
					mjamaah (nama, jk, mkategori(category))
				)
			`
      )
      .eq("active", 1);

    // Apply filters
    if (filters.tanggal_mulai) query = query.gte("tgl", filters.tanggal_mulai);
    if (filters.tanggal_akhir) query = query.lte("tgl", filters.tanggal_akhir);
    if (filters.pengajian) query = query.eq("pengajian", filters.pengajian);

    query = query.order("tgl", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  /**
   * Mendapatkan ringkasan absensi hari ini
   */
  static async getRingkasanHariIni() {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("dabsensi")
      .select(
        `
				status,
				absensi!inner(tgl)
			`
      )
      .eq("absensi.tgl", today)
      .eq("absensi.active", 1);

    if (error) throw error;

    const stats = {
      total: data.length,
      hadir: data.filter((item) => item.status === "H").length,
      absen: data.filter((item) => item.status === "A").length,
      sakit: data.filter((item) => item.status === "S").length,
      izin: data.filter((item) => item.status === "I").length,
    };

    return stats;
  }

  /**
   * Validasi apakah absensi sudah ada untuk tanggal dan pengajian tertentu
   */
  static async validateAbsensiExist(tanggal, pengajianId) {
    const { data, error } = await supabase
      .from("absensi")
      .select("id")
      .eq("tgl", tanggal)
      .eq("pengajian", pengajianId)
      .eq("active", 1)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Mendapatkan daftar tanggal absensi yang tersedia
   */
  static async getAvailableDates(pengajianId = null) {
    let query = supabase
      .from("absensi")
      .select("tgl, pengajian, mpengajian(nama_pengajian)")
      .eq("active", 1);

    if (pengajianId) {
      query = query.eq("pengajian", pengajianId);
    }

    query = query.order("tgl", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }
}
