import { supabase } from "../utils/supabase.js";
import moment from "moment";

/**
 * Absensi Service untuk struktur database baru
 * Mengelola absensi dengan tabel header (absensi) dan detail (dabsensi)
 */
export class AbsensiService {
  /**
   * Helper method to get current authenticated user from multiple sources
   */
  static async getCurrentUser() {
    try {
      // First try to get user from Supabase auth
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      let currentUser = supabaseUser;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
        // Try the auth store first
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedAuthUser = JSON.parse(authUser);
            currentUser = parsedAuthUser.supabaseUser || parsedAuthUser;
          } catch (e) {
            console.log("Error parsing auth_user:", e);
          }
        }

        // Fallback to supabase session format
        if (!currentUser) {
          const session = localStorage.getItem("supabase.auth.session");
          if (session) {
            try {
              const parsedSession = JSON.parse(session);
              currentUser = parsedSession.user;
            } catch (e) {
              console.log("Error parsing session:", e);
            }
          }
        }
      }

      return currentUser;
    } catch (error) {
      console.log("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Get user's kelompok access (returns array of kelompok IDs)
   */
  static async getUserKelompok() {
    try {
      // First try to get user from localStorage auth
      if (typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedUser = JSON.parse(authUser);
            if (parsedUser?.profile?.kelompok) {
              // Parse kelompok string: "1,2,3" -> [1, 2, 3]
              const kelompokStr = parsedUser.profile.kelompok.toString();
              return kelompokStr
                .split(",")
                .map((k) => parseInt(k.trim()))
                .filter((k) => !isNaN(k));
            }
          } catch (e) {
            console.log("Error parsing auth_user for kelompok:", e);
          }
        }
      }

      return [];
    } catch (error) {
      console.error("Error getting user kelompok:", error);
      return [];
    }
  }

  /**
   * Get user role
   */
  static async getUserRole() {
    try {
      // Get user from localStorage auth_user
      if (typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedUser = JSON.parse(authUser);
            const userRole = parsedUser?.profile?.role;
            return userRole || "user";
          } catch (e) {
            console.log("Error parsing auth_user:", e);
            return "user";
          }
        }
      }

      return "guest";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
    }
  }

  /**
   * Get jamaah list filtered by kelompok with user access control
   * @param {number|string} kelompokId - Selected kelompok ID
   * @param {Array} tingkatIds - Array of kategori/tingkat IDs to filter (optional)
   */
  static async getJamaahByKelompok(kelompokId, tingkatIds = []) {
    try {
      // Get user's kelompok access and role
      const userRole = await this.getUserRole();
      const userKelompok = await this.getUserKelompok();

      // Validate that user has access to this kelompok (unless super_admin)
      if (userRole !== "super_admin" && userKelompok.length > 0) {
        const kelompokIdNum = parseInt(kelompokId);
        if (!userKelompok.includes(kelompokIdNum)) {
          throw new Error(
            "Anda tidak memiliki akses untuk melihat jamaah dari kelompok ini"
          );
        }
      }

      // Build query
      let query = supabase
        .from("mjamaah")
        .select(
          `
          *,
          mkategori (category),
          mkelompok (nama_kelompok),
          mdapukan (nama_dapukan)
        `
        )
        .eq("active", 1)
        .eq("id_kelompok", kelompokId)
        .order("nama", { ascending: true });

      // Apply tingkat filter if provided
      if (tingkatIds && tingkatIds.length > 0) {
        query = query.in("id_kategori", tingkatIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching jamaah by kelompok:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getJamaahByKelompok:", error);
      throw error;
    }
  }

  /**
   * Mendapatkan semua data absensi dengan pagination
   */
  static async getAllAbsensi(page = 1, limit = 10, filters = {}) {
    //var today yyyy-mm-dd with momentjs
    const today = moment().format("YYYY-MM-DD");

    let query = supabase
      .from("absensi")
      .select(
        `
				*,
				mpengajian (nama_pengajian),
				mmasjid (nama_masjid),
				malquran (nama_surat),
				mhadist (nama_hadist),
				dabsensi (id)
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

  static async getAllAbsensiToday() {
    //var today yyyy-mm-dd with momentjs
    const today = moment().format("YYYY-MM-DD");

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
      .eq("tgl", today)
      .order("tgl", { ascending: false });

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
   * Alias untuk getAbsensiById (untuk konsistensi API)
   */
  static async getById(id) {
    return await this.getAbsensiById(id);
  }

  /**
   * Mendapatkan data absensi lengkap dengan detail jamaah
   */
  static async getDetailWithJamaah(absensiId) {
    try {
      // Get absensi header
      const absensi = await this.getAbsensiById(absensiId);

      // Get detail jamaah
      const detail = await this.getAbsensiDetail(absensiId);

      return {
        ...absensi,
        detail_jamaah: detail,
      };
    } catch (error) {
      console.error("Error getting absensi detail with jamaah:", error);
      throw error;
    }
  }

  /**
   * Membuat sesi absensi baru
   */
  static async createAbsensi(absensiData) {
    // Get user from localStorage
    let userEmail = "system";
    if (typeof window !== "undefined") {
      const authUser = localStorage.getItem("auth_user");
      if (authUser) {
        try {
          const parsedUser = JSON.parse(authUser);
          userEmail =
            parsedUser?.profile?.username || parsedUser?.email || "system";
        } catch (e) {
          console.log("Error parsing auth_user:", e);
        }
      }
    }

    const newAbsensi = {
      ...absensiData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_modified: userEmail,
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
    // Get user from localStorage
    let userEmail = "system";
    if (typeof window !== "undefined") {
      const authUser = localStorage.getItem("auth_user");
      if (authUser) {
        try {
          const parsedUser = JSON.parse(authUser);
          userEmail =
            parsedUser?.profile?.username || parsedUser?.email || "system";
        } catch (e) {
          console.log("Error parsing auth_user:", e);
        }
      }
    }

    const updateData = {
      ...absensiData,
      updated_at: new Date().toISOString(),
      user_modified: userEmail,
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
    try {
      // First try to get user from Supabase auth
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      let currentUser = supabaseUser;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
        // Try the auth store first
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedAuthUser = JSON.parse(authUser);
            currentUser = parsedAuthUser;
          } catch (e) {
            console.log("Error parsing auth_user:", e);
          }
        }

        // Fallback to supabase session format
        if (!currentUser) {
          const session = localStorage.getItem("supabase.auth.session");
          if (session) {
            try {
              const parsedSession = JSON.parse(session);
              currentUser = parsedSession.user;
            } catch (e) {
              console.log("Error parsing session:", e);
            }
          }
        }
      }

      // Get user email for logging
      const userEmail =
        currentUser?.email || currentUser?.profile?.email || "system";

      //hapus dabsensi juga
      await supabase.from("dabsensi").delete().eq("id", id);

      const { data, error } = await supabase
        .from("absensi")
        .update({
          active: 0,
          updated_at: new Date().toISOString(),
          user_modified: userEmail,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error deleting absensi:", error);
      throw error;
    }
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
    try {
      console.log(
        `[AbsensiService] Fetching attendance for jamaah ID: ${jamaahId} with filters:`,
        filters
      );

      // ✅ Validasi jamaah ID
      if (!jamaahId || isNaN(jamaahId)) {
        throw new Error(`Invalid jamaah ID: ${jamaahId}`);
      }

      const numericJamaahId = parseInt(jamaahId);

      // ✅ Query dasar
      let query = supabase
        .from("dabsensi")
        .select(
          `
        id,
        id_siswa,
        status,
        keterangan,
        jam_datang,
        created_at,
        updated_at,
        absensi!inner(
          id,
          tgl,
          pengajian,
          active,
          mpengajian(nama_pengajian)
        )
      `
        )
        .eq("id_siswa", numericJamaahId)
        .eq("absensi.active", 1);

      // ✅ Filter tanggal dan pengajian
      if (filters.tanggal_mulai) {
        query = query.gte("absensi.tgl", filters.tanggal_mulai);
        console.log(
          `[AbsensiService] Applied start date filter: ${filters.tanggal_mulai}`
        );
      }

      if (filters.tanggal_akhir) {
        query = query.lte("absensi.tgl", filters.tanggal_akhir);
        console.log(
          `[AbsensiService] Applied end date filter: ${filters.tanggal_akhir}`
        );
      }

      if (filters.pengajian) {
        query = query.eq("absensi.pengajian", filters.pengajian);
        console.log(
          `[AbsensiService] Applied pengajian filter: ${filters.pengajian}`
        );
      }

      // 🚫 Tidak bisa .order("absensi.tgl") — jadi kita urutkan manual di JS nanti
      console.log(
        `[AbsensiService] Executing query for jamaah ${numericJamaahId}...`
      );
      const { data, error } = await query;

      if (error) {
        console.error(`[AbsensiService] Database error:`, error);
        throw error;
      }

      let result = data || [];

      // ✅ Urutkan manual berdasarkan absensi.tgl (descending)
      result = result.sort((a, b) => {
        const dateA = new Date(a.absensi?.tgl || 0);
        const dateB = new Date(b.absensi?.tgl || 0);
        return dateB - dateA;
      });

      console.log(
        `[AbsensiService] Found ${result.length} records for jamaah ${numericJamaahId}`
      );

      if (result.length > 0) {
        console.log(`[AbsensiService] Sample record:`, {
          id: result[0].id,
          tgl: result[0].absensi?.tgl,
          pengajian: result[0].absensi?.mpengajian?.nama_pengajian,
        });
      }

      return result;
    } catch (error) {
      console.error(
        `[AbsensiService] Error in getLaporanAbsensiJamaah for jamaah ${jamaahId}:`,
        {
          message: error?.message,
          name: error?.name,
          code: error?.code,
          filters,
        }
      );
      throw error;
    }
  }

  /**
   * Alternative method to get attendance data with simplified approach
   * Useful when the main method has relationship issues
   */
  static async getLaporanAbsensiJamaahSimple(jamaahId, filters = {}) {
    try {
      console.log(
        `[AbsensiService] Fetching attendance (simple) for jamaah ID: ${jamaahId} with filters:`,
        filters
      );

      // Validate jamaah ID
      if (!jamaahId || isNaN(jamaahId)) {
        throw new Error(`Invalid jamaah ID: ${jamaahId}`);
      }

      // First, get all dabsensi records for this jamaah
      let dabsensiQuery = supabase
        .from("dabsensi")
        .select("*")
        .eq("id_siswa", jamaahId);

      console.log(
        `[AbsensiService] Fetching dabsensi records for jamaah ${jamaahId}...`
      );
      const { data: dabsensiData, error: dabsensiError } = await dabsensiQuery;

      if (dabsensiError) {
        console.error(
          `[AbsensiService] Error fetching dabsensi for jamaah ${jamaahId}:`,
          dabsensiError
        );
        throw dabsensiError;
      }

      if (!dabsensiData || dabsensiData.length === 0) {
        console.log(
          `[AbsensiService] No dabsensi records found for jamaah ${jamaahId}`
        );
        return [];
      }

      console.log(
        `[AbsensiService] Found ${dabsensiData.length} dabsensi records for jamaah ${jamaahId}`
      );

      // Get unique absensi IDs from dabsensi records
      const absensiIds = [...new Set(dabsensiData.map((d) => d.id))];

      if (absensiIds.length === 0) {
        console.log(
          `[AbsensiService] No absensi IDs found in dabsensi records`
        );
        return [];
      }

      console.log(
        `[AbsensiService] Found ${absensiIds.length} unique absensi IDs:`,
        absensiIds.slice(0, 5),
        absensiIds.length > 5 ? "..." : ""
      );

      // Get absensi headers for these IDs with filters
      let absensiQuery = supabase
        .from("absensi")
        .select(
          `
          id,
          tgl,
          pengajian,
          active,
          mpengajian(nama_pengajian)
        `
        )
        .in("id", absensiIds)
        .eq("active", 1);

      // Apply date filters
      if (filters.tanggal_mulai) {
        absensiQuery = absensiQuery.gte("tgl", filters.tanggal_mulai);
        console.log(
          `[AbsensiService] Applied start date filter: ${filters.tanggal_mulai}`
        );
      }
      if (filters.tanggal_akhir) {
        absensiQuery = absensiQuery.lte("tgl", filters.tanggal_akhir);
        console.log(
          `[AbsensiService] Applied end date filter: ${filters.tanggal_akhir}`
        );
      }
      if (filters.pengajian) {
        absensiQuery = absensiQuery.eq("pengajian", filters.pengajian);
        console.log(
          `[AbsensiService] Applied pengajian filter: ${filters.pengajian}`
        );
      }

      console.log(`[AbsensiService] Fetching absensi headers...`);
      const { data: absensiData, error: absensiError } = await absensiQuery;

      if (absensiError) {
        console.error(
          `[AbsensiService] Error fetching absensi for jamaah ${jamaahId}:`,
          absensiError
        );
        throw absensiError;
      }

      console.log(
        `[AbsensiService] Found ${
          absensiData?.length || 0
        } matching absensi records`
      );

      // Combine dabsensi and absensi data
      const result = dabsensiData
        .map((dabsensi) => {
          const absensi = absensiData?.find((a) => a.id === dabsensi.id);
          if (absensi) {
            return {
              ...dabsensi,
              absensi: absensi,
            };
          }
          return null;
        })
        .filter((item) => item !== null)
        .sort((a, b) => {
          const dateA = new Date(b.absensi.tgl);
          const dateB = new Date(a.absensi.tgl);
          return dateA.getTime() - dateB.getTime();
        });

      console.log(
        `[AbsensiService] Successfully combined data: ${result.length} attendance records (simple) for jamaah ${jamaahId}`
      );

      // Log sample of the result for debugging
      if (result.length > 0) {
        console.log(`[AbsensiService] Sample combined record:`, {
          id: result[0].id,
          id_siswa: result[0].id_siswa,
          status: result[0].status,
          absensi_date: result[0].absensi?.tgl,
          pengajian_name: result[0].absensi?.mpengajian?.nama_pengajian,
        });
      }

      return result;
    } catch (error) {
      console.error(
        `[AbsensiService] Error in getLaporanAbsensiJamaahSimple for jamaah ${jamaahId}:`,
        {
          message: error.message,
          stack: error.stack,
          filters: filters,
        }
      );
      throw error;
    }
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
   * Save complete absensi data with form and jamaah attendance
   * @param {Object} params - Parameters object
   * @param {Object} params.formData - Form data from PengajianForm
   * @param {Array} params.jamaahAbsensi - Array of jamaah attendance data
   * @param {string} params.tanggal - Date string
   * @param {number} params.pengajianId - Selected pengajian ID
   */
  static async saveAbsensi({ formData, jamaahAbsensi, tanggal, pengajianId }) {
    try {
      // First try to get user from Supabase auth
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      let currentUser = supabaseUser;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
        // Try the auth store first
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedAuthUser = JSON.parse(authUser);
            currentUser = parsedAuthUser;
          } catch (e) {
            console.log("Error parsing auth_user:", e);
          }
        }

        // Fallback to supabase session format
        if (!currentUser) {
          const session = localStorage.getItem("supabase.auth.session");
          if (session) {
            try {
              const parsedSession = JSON.parse(session);
              currentUser = parsedSession.user;
            } catch (e) {
              console.log("Error parsing session:", e);
            }
          }
        }
      }

      if (!currentUser) throw new Error("User tidak terautentikasi");

      // Get user email for logging
      const userEmail =
        currentUser.email || currentUser.profile?.email || "system";

      if (!jamaahAbsensi || jamaahAbsensi.length === 0) {
        throw new Error("Tidak ada data absensi jamaah untuk disimpan");
      }

      if (!pengajianId) {
        throw new Error("ID Pengajian tidak ditemukan");
      }

      // Use first tingkat from array for database storage (since DB expects single value)
      // If multiple tingkat selected, store as comma-separated string (e.g., "1,2,3")
      const tingkatValue =
        formData.tingkat && formData.tingkat.length > 0
          ? formData.tingkat.join(",")
          : "1";

      // Step 1: Create absensi header record
      const absensiHeaderData = {
        pengajian: pengajianId,
        tgl: tanggal,
        tempat: formData.tempat || null, // Store selected masjid
        kelompok: formData.kelompok || "", // Store selected kelompok ID
        peserta: jamaahAbsensi.length.toString(), // Auto-calculated from jamaah count
        tingkat: tingkatValue, // Store as comma-separated string
        jam_mulai: formData.jam_mulai || "19:00",
        jam_akhir: formData.jam_akhir || "20:30",
        quran: formData.quran || null,
        pengajar_quran: formData.pengajar_quran || "",
        ayat_awal: formData.ayat_awal ? parseInt(formData.ayat_awal) : null,
        ayat_akhir: formData.ayat_akhir ? parseInt(formData.ayat_akhir) : null,
        hadist: formData.hadist || null,
        pengajar_hadist: formData.pengajar_hadist || "",
        hal_awal: formData.hal_awal ? parseInt(formData.hal_awal) : null,
        hal_akhir: formData.hal_akhir ? parseInt(formData.hal_akhir) : null,
        penasehat: formData.penasehat || "",
        infaq: formData.infaq ? parseFloat(formData.infaq) : 0,
        active: 1,
        user_modified: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert absensi header
      const { data: absensiHeader, error: headerError } = await supabase
        .from("absensi")
        .insert(absensiHeaderData)
        .select()
        .single();

      if (headerError) {
        console.error("Error creating absensi header:", headerError);
        throw headerError;
      }

      // Step 2: Create dabsensi detail records
      const now = new Date();
      const jam_datang = now.toTimeString().slice(0, 5);
      const detailRecords = jamaahAbsensi.map((item) => ({
        id: absensiHeader.id, // Use the absensi header ID
        id_siswa: item.jamaah_id,
        jam_datang: jam_datang,
        status: item.status_kehadiran,
        keterangan: item.keterangan || "",
        user_modified: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert detail records
      const { data: detailData, error: detailError } = await supabase
        .from("dabsensi")
        .insert(detailRecords)
        .select();

      if (detailError) {
        console.error("Error creating absensi details:", detailError);
        // If detail insert fails, we should rollback the header
        await supabase.from("absensi").delete().eq("id", absensiHeader.id);
        throw detailError;
      }

      return {
        header: absensiHeader,
        details: detailData,
      };
    } catch (error) {
      console.error("Error saving absensi:", error);
      throw error;
    }
  }

  /**
   * Update complete absensi data with form and jamaah attendance
   * @param {Object} params - Parameters object
   * @param {number} params.absensiId - ID of existing absensi to update
   * @param {Object} params.formData - Form data from PengajianForm
   * @param {Array} params.jamaahAbsensi - Array of jamaah attendance data
   * @param {string} params.tanggal - Date string
   * @param {number} params.pengajianId - Selected pengajian ID
   */
  static async updateAbsensiComplete({
    absensiId,
    formData,
    jamaahAbsensi,
    tanggal,
    pengajianId,
  }) {
    try {
      // First try to get user from Supabase auth
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      let currentUser = supabaseUser;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedAuthUser = JSON.parse(authUser);
            currentUser = parsedAuthUser;
          } catch (e) {
            console.log("Error parsing auth_user:", e);
          }
        }

        if (!currentUser) {
          const session = localStorage.getItem("supabase.auth.session");
          if (session) {
            try {
              const parsedSession = JSON.parse(session);
              currentUser = parsedSession.user;
            } catch (e) {
              console.log("Error parsing session:", e);
            }
          }
        }
      }

      if (!currentUser) throw new Error("User tidak terautentikasi");

      // Get user email for logging
      const userEmail =
        currentUser.email || currentUser.profile?.email || "system";

      if (!jamaahAbsensi || jamaahAbsensi.length === 0) {
        throw new Error("Tidak ada data absensi jamaah untuk disimpan");
      }

      if (!pengajianId) {
        throw new Error("ID Pengajian tidak ditemukan");
      }

      // Use first tingkat from array for database storage (since DB expects single value)
      // If multiple tingkat selected, store as comma-separated string (e.g., "1,2,3")
      const tingkatValue =
        formData.tingkat && formData.tingkat.length > 0
          ? formData.tingkat.join(",")
          : "1";

      // Update absensi header
      const updateHeaderData = {
        pengajian: pengajianId,
        tgl: tanggal,
        tempat: formData.tempat || null, // Store selected masjid
        kelompok: formData.kelompok || "", // Store selected kelompok ID
        peserta: jamaahAbsensi.length.toString(), // Auto-calculated from jamaah count
        tingkat: tingkatValue, // Store as comma-separated string
        jam_mulai: formData.jam_mulai || "19:00",
        jam_akhir: formData.jam_akhir || "20:30",
        quran: formData.quran || null,
        pengajar_quran: formData.pengajar_quran || "",
        ayat_awal: formData.ayat_awal ? parseInt(formData.ayat_awal) : null,
        ayat_akhir: formData.ayat_akhir ? parseInt(formData.ayat_akhir) : null,
        hadist: formData.hadist || null,
        pengajar_hadist: formData.pengajar_hadist || "",
        hal_awal: formData.hal_awal ? parseInt(formData.hal_awal) : null,
        hal_akhir: formData.hal_akhir ? parseInt(formData.hal_akhir) : null,
        penasehat: formData.penasehat || "",
        infaq: formData.infaq ? parseFloat(formData.infaq) : 0,
        user_modified: userEmail,
        updated_at: new Date().toISOString(),
      };

      // Update absensi header
      const { data: absensiHeader, error: headerError } = await supabase
        .from("absensi")
        .update(updateHeaderData)
        .eq("id", absensiId)
        .select()
        .single();

      if (headerError) {
        console.error("Error updating absensi header:", headerError);
        throw headerError;
      }

      // Delete existing detail records
      await supabase.from("dabsensi").delete().eq("id", absensiId);

      // Insert new detail records
      const now = new Date();
      const jam_datang = now.toTimeString().slice(0, 5);
      const detailRecords = jamaahAbsensi.map((item) => ({
        id: absensiId,
        id_siswa: item.jamaah_id,
        jam_datang: jam_datang,
        status: item.status_kehadiran,
        keterangan: item.keterangan || "",
        user_modified: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert detail records
      const { data: detailData, error: detailError } = await supabase
        .from("dabsensi")
        .insert(detailRecords)
        .select();

      if (detailError) {
        console.error("Error updating absensi details:", detailError);
        throw detailError;
      }

      return {
        header: absensiHeader,
        details: detailData,
      };
    } catch (error) {
      console.error("Error updating absensi:", error);
      throw error;
    }
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

  /**
   * Update individual jamaah attendance status
   * For real-time auto-save functionality
   */
  static async updateIndividualAttendance({
    absensiId,
    jamaahId,
    status,
    keterangan = "",
  }) {
    try {
      const currentUser = await this.getCurrentUser();

      // If no user, return null silently (don't throw error)
      if (!currentUser) {
        console.log("User not authenticated, skipping auto-save");
        return null;
      }

      // Get user email for logging
      const userEmail = currentUser.email || "system";

      // Check if attendance record already exists
      const { data: existingRecord } = await supabase
        .from("dabsensi")
        .select("*")
        .eq("id", absensiId)
        .eq("id_siswa", jamaahId)
        .single();

      const attendanceData = {
        id: absensiId,
        id_siswa: jamaahId,
        status: status,
        keterangan: keterangan || null,
        user_modified: userEmail,
        updated_at: new Date().toISOString(),
      };

      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from("dabsensi")
          .update(attendanceData)
          .eq("id", absensiId)
          .eq("id_siswa", jamaahId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new record - create new object with created_at
        const newAttendanceData = {
          ...attendanceData,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("dabsensi")
          .insert([newAttendanceData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      // Log error but don't throw to prevent UI disruption
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("Auto-save failed:", errorMessage);
      return null;
    }
  }

  /**
   * Create or update absensi header for auto-save functionality
   */
  static async ensureAbsensiHeader({ formData, tanggal, pengajianId }) {
    try {
      const currentUser = await this.getCurrentUser();

      // If no user, return null silently
      if (!currentUser) {
        console.log("User not authenticated, skipping header creation");
        return null;
      }

      // Get user email for logging
      const userEmail = currentUser.email || "system";

      // Check if absensi header already exists for this date and pengajian
      const { data: existingAbsensi } = await supabase
        .from("absensi")
        .select("*")
        .eq("tgl", tanggal)
        .eq("pengajian", pengajianId)
        .eq("active", 1)
        .single();

      if (existingAbsensi) {
        return existingAbsensi;
      }

      // Create new absensi header
      const absensiData = {
        pengajian: pengajianId,
        tgl: tanggal,
        tempat: formData.tempat || null,
        kelompok: formData.kelompok || null,
        tingkat: Array.isArray(formData.tingkat)
          ? formData.tingkat.join(",")
          : formData.tingkat || "",
        jam_mulai: formData.jam_mulai || "19:00",
        jam_akhir: formData.jam_akhir || "20:30",
        quran: formData.quran || null,
        pengajar_quran: formData.pengajar_quran || "",
        ayat_awal: formData.ayat_awal || "",
        ayat_akhir: formData.ayat_akhir || "",
        hadist: formData.hadist || null,
        pengajar_hadist: formData.pengajar_hadist || "",
        hal_awal: formData.hal_awal || "",
        hal_akhir: formData.hal_akhir || "",
        penasehat: formData.penasehat || "",
        infaq: parseFloat(formData.infaq) || 0,
        active: 1,
        user_modified: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("absensi")
        .insert([absensiData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Log error but don't throw to prevent UI disruption
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log("Header creation failed:", errorMessage);
      return null;
    }
  }
}
