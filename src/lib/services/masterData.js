import { supabase } from "../utils/supabase.js";

/**
 * Master Data Service
 * Handles CRUD operations for master tables with super admin validation
 */
export class MasterDataService {
  /**
   * Check if current user is super admin
   */
  static async isSuperAdmin() {
    try {
      // First try to get user from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let currentUser = user;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
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

      if (!currentUser) return false;

      // Check if user has super_admin role in muser table
      const { data, error } = await supabase
        .from("muser")
        .select("role")
        .eq("email", currentUser.email)
        .eq("active", 1)
        .single();

      if (error) {
        console.error("Error checking super admin status:", error);
        return false;
      }

      return data?.role === "super_admin";
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  }

  /**
   * Get user role
   */
  static async getUserRole() {
    try {
      // First try to get user from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let currentUser = user;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
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

      if (!currentUser) return "guest";

      // Get role from muser table
      const { data, error } = await supabase
        .from("muser")
        .select("role")
        .eq("email", currentUser.email)
        .eq("active", 1)
        .single();

      if (error) {
        console.error("Error getting user role:", error);
        return "user";
      }

      return data?.role || "user";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
    }
  }

  /**
   * Set user role (only super admin can do this)
   */
  static async setUserRole(userId, role) {
    const isAdmin = await this.isSuperAdmin();
    if (!isAdmin) {
      throw new Error("Hanya Super Admin yang dapat mengatur role pengguna");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString(),
        user_modified: user?.email || "system",
      })
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Generic CRUD operations for master tables
   */
  static async validateMasterAccess(operation = "read") {
    if (operation === "read") {
      // Anyone authenticated can read - check both Supabase auth and localStorage session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let currentUser = user;

      // If no Supabase user, try to get from localStorage session (for our mock auth)
      if (!currentUser && typeof window !== "undefined") {
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

      return !!currentUser;
    }

    // For create, update, delete - only super admin
    return await this.isSuperAdmin();
  }
  /**
   * Get all records from a master table
   */
  static async getMasterData(tableName, filters = {}) {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    let { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("active", 1)
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Apply filters manual jika ada
    if (Object.keys(filters).length) {
      data = (data || []).filter((row) => {
        return Object.entries(filters).every(
          ([k, v]) => v === null || v === undefined || v === "" || row[k] === v
        );
      });
    }
    return data;
  }

  /**
   * Get single record by ID
   */
  static async getMasterRecord(tableName, id) {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak.");
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new master record
   */
  static async createMasterRecord(tableName, recordData) {
    const hasAccess = await MasterDataService.validateMasterAccess("create");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin yang dapat menambah data master."
      );
    }

    // Get current user from either Supabase auth or localStorage
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let currentUser = user;

    // If no Supabase user, try to get from localStorage session
    if (!currentUser && typeof window !== "undefined") {
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

    const newRecord = {
      ...recordData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_modified: currentUser?.email || "system",
      active: 1,
    };

    const { data, error } = await supabase
      .from(tableName)
      .insert(newRecord)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Update master record
   */
  static async updateMasterRecord(tableName, id, recordData) {
    const hasAccess = await MasterDataService.validateMasterAccess("update");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin yang dapat mengubah data master."
      );
    }

    // Get current user from either Supabase auth or localStorage
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let currentUser = user;

    // If no Supabase user, try to get from localStorage session
    if (!currentUser && typeof window !== "undefined") {
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

    const updateData = {
      ...recordData,
      updated_at: new Date().toISOString(),
      user_modified: currentUser?.email || "system",
    };

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Soft delete master record
   */
  static async deleteMasterRecord(tableName, id) {
    const hasAccess = await MasterDataService.validateMasterAccess("delete");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin yang dapat menghapus data master."
      );
    }

    // Get current user from either Supabase auth or localStorage
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let currentUser = user;

    // If no Supabase user, try to get from localStorage session
    if (!currentUser && typeof window !== "undefined") {
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

    const { data, error } = await supabase
      .from(tableName)
      .update({
        active: 0,
        updated_at: new Date().toISOString(),
        user_modified: currentUser?.email || "system",
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Hard delete master record (permanent)
   */
  static async permanentDeleteMasterRecord(tableName, id) {
    const hasAccess = await MasterDataService.validateMasterAccess("delete");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin yang dapat menghapus data master."
      );
    }

    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }
}

/**
 * Specific services for each master table
 */

// Pengajian Service
export class PengajianService extends MasterDataService {
  static async getAllPengajian() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess)
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    try {
      const { data, error } = await supabase
        .from("mpengajian")
        .select("*")
        .eq("active", 1)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("getAllPengajian error:", error);
      throw error;
    }
  }
  static async createPengajian(data) {
    return await MasterDataService.createMasterRecord("mpengajian", {
      nama_pengajian: data.nama_pengajian,
    });
  }
  static async updatePengajian(id, data) {
    return await MasterDataService.updateMasterRecord("mpengajian", id, {
      nama_pengajian: data.nama_pengajian,
    });
  }
  static async deletePengajian(id) {
    return await MasterDataService.deleteMasterRecord("mpengajian", id);
  }
}

// Daerah Service
export class DaerahService extends MasterDataService {
  static async getAllDaerah() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess)
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    try {
      const { data, error } = await supabase
        .from("mdaerah")
        .select("*")
        .eq("active", 1)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("getAllDaerah error:", error);
      throw error;
    }
  }
  static async createDaerah(data) {
    return await MasterDataService.createMasterRecord("mdaerah", {
      nama_daerah: data.nama_daerah,
    });
  }
  static async updateDaerah(id, data) {
    return await MasterDataService.updateMasterRecord("mdaerah", id, {
      nama_daerah: data.nama_daerah,
    });
  }
  static async deleteDaerah(id) {
    return await MasterDataService.deleteMasterRecord("mdaerah", id);
  }
}

// Desa Service
export class DesaService extends MasterDataService {
  static async getAllDesa() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess)
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    try {
      const { data, error } = await supabase
        .from("mdesa")
        .select("*")
        .eq("active", 1)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("getAllDesa error:", error);
      throw error;
    }
  }
  static async createDesa(data) {
    return await MasterDataService.createMasterRecord("mdesa", {
      nama_desa: data.nama_desa,
    });
  }
  static async updateDesa(id, data) {
    return await MasterDataService.updateMasterRecord("mdesa", id, {
      nama_desa: data.nama_desa,
    });
  }
  static async deleteDesa(id) {
    return await MasterDataService.deleteMasterRecord("mdesa", id);
  }
}

// Kelompok Service
export class KelompokService extends MasterDataService {
  static async getAllKelompok() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Enhanced query with JOIN to get related names
      const { data, error } = await supabase
        .from("mkelompok")
        .select(
          `
          *,
          mdesa(nama_desa),
          mdaerah(nama_daerah)
        `
        )
        .eq("active", 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching kelompok:", error);
        throw error;
      }

      // Flatten the response to include desa and daerah names directly
      const flattenedData =
        data?.map((item) => ({
          ...item,
          nama_desa: item.mdesa?.nama_desa || "-",
          nama_daerah: item.mdaerah?.nama_daerah || "-",
        })) || [];

      console.log("Kelompok data with relationships:", flattenedData);
      return flattenedData;
    } catch (error) {
      console.error("Exception in getAllKelompok:", error);
      throw error;
    }
  }

  static async getAllDesa() {
    try {
      const { data, error } = await supabase
        .from("mdesa")
        .select("id, nama_desa")
        .eq("active", 1)
        .order("nama_desa");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching desa options:", error);
      return [];
    }
  }

  static async getAllDaerah() {
    try {
      const { data, error } = await supabase
        .from("mdaerah")
        .select("id, nama_daerah")
        .eq("active", 1)
        .order("nama_daerah");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching daerah options:", error);
      return [];
    }
  }

  static async createKelompok(data) {
    return await MasterDataService.createMasterRecord("mkelompok", {
      nama_kelompok: data.nama_kelompok,
      id_desa: data.id_desa,
      id_daerah: data.id_daerah,
    });
  }

  static async updateKelompok(id, data) {
    return await MasterDataService.updateMasterRecord("mkelompok", id, {
      nama_kelompok: data.nama_kelompok,
      id_desa: data.id_desa,
      id_daerah: data.id_daerah,
    });
  }

  static async deleteKelompok(id) {
    return await MasterDataService.deleteMasterRecord("mkelompok", id);
  }
}

// Masjid Service
export class MasjidService extends MasterDataService {
  static async getAllMasjid() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Enhanced query with JOIN to get kelompok name
      const { data, error } = await supabase
        .from("mmasjid")
        .select(
          `
          *,
          mkelompok(nama_kelompok)
        `
        )
        .eq("active", 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching masjid:", error);
        throw error;
      }

      // Flatten the response to include kelompok name directly
      const flattenedData =
        data?.map((item) => ({
          ...item,
          nama_kelompok: item.mkelompok?.nama_kelompok || "-",
        })) || [];

      console.log("Masjid data with relationships:", flattenedData);
      return flattenedData;
    } catch (error) {
      console.error("Exception in getAllMasjid:", error);
      throw error;
    }
  }

  static async getAllKelompok() {
    try {
      const { data, error } = await supabase
        .from("mkelompok")
        .select("id, nama_kelompok")
        .eq("active", 1)
        .order("nama_kelompok");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching kelompok options:", error);
      return [];
    }
  }

  static async createMasjid(data) {
    return await MasterDataService.createMasterRecord("mmasjid", {
      nama_masjid: data.nama_masjid,
      id_kelompok: data.id_kelompok,
    });
  }

  static async updateMasjid(id, data) {
    return await MasterDataService.updateMasterRecord("mmasjid", id, {
      nama_masjid: data.nama_masjid,
      id_kelompok: data.id_kelompok,
    });
  }

  static async deleteMasjid(id) {
    return await MasterDataService.deleteMasterRecord("mmasjid", id);
  }
}

// Kategori Service
export class KategoriService extends MasterDataService {
  static async getAllKategori() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Try with active=1 first
      const { data, error } = await supabase
        .from("mkategori")
        .select("*")
        .eq("active", 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching kategori:", error);
        throw error;
      }

      console.log("Raw kategori data:", data);
      return data || [];
    } catch (error) {
      console.error("Exception in getAllKategori:", error);
      throw error;
    }
  }

  static async createKategori(data) {
    return await MasterDataService.createMasterRecord("mkategori", {
      category: data.category,
      group: data.group,
    });
  }

  static async updateKategori(id, data) {
    return await MasterDataService.updateMasterRecord("mkategori", id, {
      category: data.category,
      group: data.group,
    });
  }

  static async deleteKategori(id) {
    return await MasterDataService.deleteMasterRecord("mkategori", id);
  }
}

// Hadist Service
export class HadistService extends MasterDataService {
  static async getAllHadist() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Try with active=1 first
      const { data, error } = await supabase
        .from("mhadist")
        .select("*")
        .eq("active", 1);

      if (error) {
        console.error("Error fetching hadist:", error);
        throw error;
      }

      console.log("Raw hadist data:", data);
      return data || [];
    } catch (error) {
      console.error("Exception in getAllHadist:", error);
      throw error;
    }
  }

  static async createHadist(data) {
    return await MasterDataService.createMasterRecord("mhadist", {
      nama_hadist: data.nama_hadist,
      jumlah_halaman: data.jumlah_halaman,
    });
  }

  static async updateHadist(id, data) {
    return await MasterDataService.updateMasterRecord("mhadist", id, {
      nama_hadist: data.nama_hadist,
      jumlah_halaman: data.jumlah_halaman,
    });
  }

  static async deleteHadist(id) {
    return await MasterDataService.deleteMasterRecord("mhadist", id);
  }
}

// Al-Quran Service
export class AlQuranService extends MasterDataService {
  static async getAllAlQuran() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Try with active=1 first
      const { data, error } = await supabase
        .from("malquran")
        .select("*")
        .eq("active", 1);

      if (error) {
        console.error("Error fetching alquran:", error);
        throw error;
      }

      console.log("Raw alquran data:", data);
      return data || [];
    } catch (error) {
      console.error("Exception in getAllAlQuran:", error);
      throw error;
    }
  }

  static async createAlQuran(data) {
    return await MasterDataService.createMasterRecord("malquran", {
      nama_surat: data.nama_surat,
      juz: data.juz,
      jumlah_ayat: data.jumlah_ayat,
    });
  }

  static async updateAlQuran(id, data) {
    return await MasterDataService.updateMasterRecord("malquran", id, {
      nama_surat: data.nama_surat,
      juz: data.juz,
      jumlah_ayat: data.jumlah_ayat,
    });
  }

  static async deleteAlQuran(id) {
    return await MasterDataService.deleteMasterRecord("malquran", id);
  }
}

// Dapukan Service
export class DapukanService extends MasterDataService {
  static async getAllDapukan() {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak. Anda harus login untuk melihat data.");
    }

    try {
      // Try with active=1 first
      const { data, error } = await supabase
        .from("mdapukan")
        .select("*")
        .eq("active", 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching dapukan:", error);
        throw error;
      }

      console.log("Raw dapukan data:", data);
      return data || [];
    } catch (error) {
      console.error("Exception in getAllDapukan:", error);
      throw error;
    }
  }

  static async createDapukan(data) {
    return await MasterDataService.createMasterRecord("mdapukan", {
      nama_dapukan: data.nama_dapukan,
      deskripsi: data.deskripsi,
    });
  }

  static async updateDapukan(id, data) {
    return await MasterDataService.updateMasterRecord("mdapukan", id, {
      nama_dapukan: data.nama_dapukan,
      deskripsi: data.deskripsi,
    });
  }

  static async deleteDapukan(id) {
    return await MasterDataService.deleteMasterRecord("mdapukan", id);
  }
}

// Jamaah Service
export class JamaahService extends MasterDataService {
  static async getAllJamaah(filters = {}) {
    const hasAccess = await MasterDataService.validateMasterAccess("read");
    if (!hasAccess) {
      throw new Error("Akses ditolak.");
    }

    let query = supabase
      .from("mjamaah")
      .select(
        `
            *,
            mkategori (category),
            mkelompok (
            nama_kelompok,
            mdesa (nama_desa),
            mdaerah (nama_daerah)
            ),
            mdapukan (nama_dapukan)
        `
      )
      .eq("active", 1) // tanpa prefix tabel
      .order("nama", { ascending: true }); // juga tanpa prefix

    // Apply filters
    if (filters.kategori) {
      // Support both single value and array for kategori filter
      if (Array.isArray(filters.kategori)) {
        // Multiple kategori - use WHERE IN
        query = query.in("id_kategori", filters.kategori);
      } else {
        // Single kategori - use equality
        query = query.eq("id_kategori", filters.kategori);
      }
    }
    if (filters.kelompok) query = query.eq("id_kelompok", filters.kelompok);
    if (filters.jk) query = query.eq("jk", filters.jk);
    if (filters.tingkat) query = query.eq("tingkat", filters.tingkat);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getAllKategori() {
    try {
      const { data, error } = await supabase
        .from("mkategori")
        .select("id, category")
        .eq("active", 1)
        .order("category");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching kategori options:", error);
      return [];
    }
  }

  static async getAllKelompok() {
    try {
      const { data, error } = await supabase
        .from("mkelompok")
        .select("id, nama_kelompok")
        .eq("active", 1)
        .order("nama_kelompok");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching kelompok options:", error);
      return [];
    }
  }

  static async getAllDapukan() {
    try {
      const { data, error } = await supabase
        .from("mdapukan")
        .select("id, nama_dapukan")
        .eq("active", 1)
        .order("nama_dapukan");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching dapukan options:", error);
      return [];
    }
  }

  static async createJamaah(data) {
    return await MasterDataService.createMasterRecord("mjamaah", {
      nama: data.nama,
      tgl_lahir: data.tgl_lahir,
      jk: data.jk,
      id_kategori: data.id_kategori,
      alamat: data.alamat,
      email: data.email,
      status_nikah: data.status_nikah,
      telp_murid: data.telp_murid,
      id_kelompok: data.id_kelompok,
      pendidikan: data.pendidikan,
      sekolah: data.sekolah,
      jurusan: data.jurusan,
      walimurid: data.walimurid,
      telp_wali: data.telp_wali,
      alamat_wali: data.alamat_wali,
      email_wali: data.email_wali,
      id_dapukan: data.id_dapukan || null,
    });
  }

  static async updateJamaah(id, data) {
    return await MasterDataService.updateMasterRecord("mjamaah", id, {
      nama: data.nama,
      tgl_lahir: data.tgl_lahir,
      jk: data.jk,
      id_kategori: data.id_kategori,
      alamat: data.alamat,
      email: data.email,
      status_nikah: data.status_nikah,
      telp_murid: data.telp_murid,
      id_kelompok: data.id_kelompok,
      pendidikan: data.pendidikan,
      sekolah: data.sekolah,
      jurusan: data.jurusan,
      walimurid: data.walimurid,
      telp_wali: data.telp_wali,
      alamat_wali: data.alamat_wali,
      email_wali: data.email_wali,
      id_dapukan: data.id_dapukan || null,
    });
  }

  static async deleteJamaah(id) {
    return await MasterDataService.deleteMasterRecord("mjamaah", id);
  }
}
