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
      // Get user from localStorage auth_user
      if (typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedUser = JSON.parse(authUser);
            const userRole = parsedUser?.profile?.role;
            return userRole === "super_admin";
          } catch (e) {
            console.log("Error parsing auth_user:", e);
            return false;
          }
        }
      }

      return false;
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
      // Get user from localStorage auth_user
      if (typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
          try {
            const parsedUser = JSON.parse(authUser);
            const userRole = parsedUser?.profile?.role;
            console.log("[getUserRole] Role from localStorage:", userRole);
            return userRole || "user";
          } catch (e) {
            console.log("Error parsing auth_user:", e);
            return "user";
          }
        }
      }

      console.log("[getUserRole] No auth_user found in localStorage");
      return "guest";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
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
        console.log(
          "[getUserKelompok] Raw auth_user from localStorage:",
          authUser
        );

        if (authUser) {
          try {
            const parsedUser = JSON.parse(authUser);
            console.log("[getUserKelompok] Parsed user:", parsedUser);
            console.log("[getUserKelompok] User profile:", parsedUser?.profile);
            console.log(
              "[getUserKelompok] User kelompok field:",
              parsedUser?.profile?.kelompok
            );

            if (parsedUser?.profile?.kelompok) {
              // Parse kelompok string: "1,2,3" -> [1, 2, 3]
              const kelompokStr = parsedUser.profile.kelompok.toString();
              const kelompokArray = kelompokStr
                .split(",")
                .map((k) => parseInt(k.trim()))
                .filter((k) => !isNaN(k));

              console.log(
                "[getUserKelompok] Parsed kelompok array:",
                kelompokArray
              );
              return kelompokArray;
            } else {
              console.log(
                "[getUserKelompok] No kelompok field found in profile"
              );
            }
          } catch (e) {
            console.log("Error parsing auth user:", e);
          }
        }
      }

      // Fallback: Try to get from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      // Get kelompok from muser table
      const { data, error } = await supabase
        .from("muser")
        .select("kelompok")
        .eq("email", user.email)
        .eq("active", 1)
        .single();

      if (error || !data?.kelompok) {
        console.error("Error getting user kelompok:", error);
        return [];
      }

      // Parse kelompok string: "1,2,3" -> [1, 2, 3]
      const kelompokStr = data.kelompok.toString();
      return kelompokStr
        .split(",")
        .map((k) => parseInt(k.trim()))
        .filter((k) => !isNaN(k));
    } catch (error) {
      console.error("Error getting user kelompok:", error);
      return [];
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
      // Anyone authenticated can read - check localStorage
      if (typeof window !== "undefined") {
        const authUser = localStorage.getItem("auth_user");
        return !!authUser;
      }
      return false;
    }

    // For delete - allow both super_admin and admin
    if (operation === "delete") {
      const userRole = await this.getUserRole();
      return userRole === "super_admin" || userRole === "admin";
    }

    // For create and update - allow both super_admin and admin
    if (operation === "create" || operation === "update") {
      const userRole = await this.getUserRole();
      return userRole === "super_admin" || userRole === "admin";
    }

    return false;
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
        "Akses ditolak. Hanya Super Admin dan Admin yang dapat menambah data master."
      );
    }

    // Get current user email from localStorage (skip Supabase auth)
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

    const newRecord = {
      ...recordData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_modified: userEmail,
      active: 1,
    };

    // Use .select('*') to only get columns from main table, without joins/relations
    const { data, error } = await supabase
      .from(tableName)
      .insert(newRecord)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update master record
   */
  static async updateMasterRecord(tableName, id, recordData) {
    const hasAccess = await MasterDataService.validateMasterAccess("update");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin dan Admin yang dapat mengubah data master."
      );
    }

    // Get current user email from localStorage (skip Supabase auth)
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
      ...recordData,
      updated_at: new Date().toISOString(),
      user_modified: userEmail,
    };

    // Ensure id is integer for proper matching
    const recordId = typeof id === "string" ? parseInt(id) : id;

    // Use .select('*') to only get columns from main table, without joins/relations
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", recordId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft delete master record
   */
  static async deleteMasterRecord(tableName, id) {
    const hasAccess = await MasterDataService.validateMasterAccess("delete");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin dan Admin yang dapat menghapus data master."
      );
    }

    // Get current user email from localStorage (skip Supabase auth)
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

    // Ensure id is integer for proper matching
    const recordId = typeof id === "string" ? parseInt(id) : id;

    // Use .select('*') to only get columns from main table, without joins/relations
    const { data, error } = await supabase
      .from(tableName)
      .update({
        active: 0,
        updated_at: new Date().toISOString(),
        user_modified: userEmail,
      })
      .eq("id", recordId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Hard delete master record (permanent)
   */
  static async permanentDeleteMasterRecord(tableName, id) {
    const hasAccess = await MasterDataService.validateMasterAccess("delete");
    if (!hasAccess) {
      throw new Error(
        "Akses ditolak. Hanya Super Admin dan Admin yang dapat menghapus data master."
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
      // Get user's kelompok access
      const userRole = await MasterDataService.getUserRole();
      const userKelompok = await MasterDataService.getUserKelompok();

      console.log("[KelompokService.getAllKelompok] User role:", userRole);
      console.log(
        "[KelompokService.getAllKelompok] User kelompok access:",
        userKelompok
      );

      // Enhanced query with JOIN to get related names
      let query = supabase
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

      // Filter by user's kelompok access (unless super_admin)
      if (userRole !== "super_admin" && userKelompok.length > 0) {
        console.log(
          "[KelompokService.getAllKelompok] Applying filter - user is NOT super_admin, filtering by kelompok:",
          userKelompok
        );
        query = query.in("id", userKelompok);
      } else {
        console.log(
          "[KelompokService.getAllKelompok] NOT applying filter - reason:",
          userRole === "super_admin"
            ? "User is super_admin"
            : "No kelompok data found"
        );
      }

      const { data, error } = await query;

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

      console.log(
        "[KelompokService.getAllKelompok] Returned kelompok list:",
        flattenedData
      );
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

    // Get user's kelompok access
    const userRole = await MasterDataService.getUserRole();
    const userKelompok = await MasterDataService.getUserKelompok();

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

    // Apply kelompok filter based on user access (unless super_admin)
    if (userRole !== "super_admin" && userKelompok.length > 0) {
      query = query.in("id_kelompok", userKelompok);
    }

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
      // Get user's kelompok access
      const userRole = await MasterDataService.getUserRole();
      const userKelompok = await MasterDataService.getUserKelompok();

      console.log("[getAllKelompok] User role:", userRole);
      console.log("[getAllKelompok] User kelompok access:", userKelompok);

      let query = supabase
        .from("mkelompok")
        .select("id, nama_kelompok")
        .eq("active", 1)
        .order("nama_kelompok");

      // Filter by user's kelompok access (unless super_admin)
      if (userRole !== "super_admin" && userKelompok.length > 0) {
        console.log(
          "[getAllKelompok] Applying filter - user is NOT super_admin, filtering by kelompok:",
          userKelompok
        );
        query = query.in("id", userKelompok);
      } else {
        console.log(
          "[getAllKelompok] NOT applying filter - reason:",
          userRole === "super_admin"
            ? "User is super_admin"
            : "No kelompok data found"
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("[getAllKelompok] Returned kelompok list:", data);
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
    // Validate kelompok access for non-super_admin users
    const userRole = await MasterDataService.getUserRole();
    if (userRole !== "super_admin") {
      const userKelompok = await MasterDataService.getUserKelompok();
      if (!userKelompok.includes(parseInt(data.id_kelompok))) {
        throw new Error(
          "Anda tidak memiliki akses untuk menambah jamaah ke kelompok ini"
        );
      }
    }

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
    // Validate kelompok access for non-super_admin users
    const userRole = await MasterDataService.getUserRole();
    if (userRole !== "super_admin") {
      const userKelompok = await MasterDataService.getUserKelompok();
      if (!userKelompok.includes(parseInt(data.id_kelompok))) {
        throw new Error(
          "Anda tidak memiliki akses untuk mengubah jamaah ke kelompok ini"
        );
      }
    }

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
