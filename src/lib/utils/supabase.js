import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";

// Get environment variables - working for both client and server
const supabaseUrl = browser
  ? import.meta.env.VITE_SUPABASE_URL
  : process.env.VITE_SUPABASE_URL || "https://trxxqmxugbxgqnujhfnc.supabase.co";

const supabaseAnonKey = browser
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHhxbXh1Z2J4Z3FudWpoZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjE5NzMsImV4cCI6MjA3NTI5Nzk3M30.voTDSvmqOeh-k-2VBKWeSFrW3w5FbCQ787YDbz9UwcY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database service functions
export class DatabaseService {
  // User authentication functions
  static async login(email, password) {
    try {
      console.log("Trying to login with:", email, password);
      console.log("Supabase client configured:", !!supabase);

      // First check if user exists in muser table
      const { data: userData, error: userError } = await supabase
        .from("muser")
        .select("*")
        .eq("email", email)
        .eq("active", 1)
        .single();

      console.log("Database query result:", { userData, userError });

      if (userError || !userData) {
        throw new Error(
          "User tidak ditemukan atau tidak aktif. Error: " +
            (userError?.message || "No data")
        );
      }

      // Simple password check for demo (in production, use bcrypt or similar)
      // For now, we'll accept 'password' as the password for all users
      if (password !== "password") {
        throw new Error("Password salah");
      }

      // Create a mock Supabase session for the user
      // This simulates proper authentication flow
      const mockUser = {
        id: userData.id,
        email: userData.email,
        user_metadata: {},
        app_metadata: {},
        aud: "authenticated",
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      // Store session info in localStorage to persist across page refreshes
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "supabase.auth.session",
          JSON.stringify({
            user: mockUser,
            access_token: "mock_token_" + userData.id,
            refresh_token: "mock_refresh_" + userData.id,
            expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            token_type: "bearer",
          })
        );
      }

      console.log("Login successful for user:", userData);

      return {
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          profile: userData,
          supabaseUser: mockUser,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login gagal",
      };
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      console.log("Testing database connection...");
      console.log("Supabase URL:", supabaseUrl);
      console.log(
        "Supabase Key:",
        supabaseAnonKey ? "Key exists" : "Key missing"
      );

      // Test simple query
      const { data, error } = await supabase
        .from("muser")
        .select("id, email, full_name, role")
        .limit(5);

      console.log("Test query result:", { data, error });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        message: "Database connection successful",
      };
    } catch (error) {
      console.error("Database connection failed:", error);
      return {
        success: false,
        error: error.message,
        message: "Database connection failed",
      };
    }
  }

  static async logout() {
    try {
      // Clear localStorage session
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.session");
      }

      // Also try to sign out from Supabase (in case there's an actual session)
      await supabase.auth.signOut();

      return { success: true, error: null };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  // Jamaah (Students) functions
  static async getJamaahByKategori(kategoriId = null) {
    let query = supabase
      .from("mjamaah")
      .select(
        `
				*,
				mkategori(nama_kategori),
				mkelompok(nama_kelompok, mmasjid(nama_masjid))
			`
      )
      .eq("is_active", true)
      .order("nama_lengkap");

    if (kategoriId) {
      query = query.eq("kategori_id", kategoriId);
    }

    const { data, error } = await query;
    return { data, error };
  }

  // Kategori functions
  static async getKategori() {
    const { data, error } = await supabase
      .from("mkategori")
      .select("*")
      .eq("is_active", true)
      .order("nama_kategori");

    return { data, error };
  }

  // Pengajian functions
  static async getPengajian() {
    const { data, error } = await supabase
      .from("mpengajian")
      .select(
        `
				*,
				mkelompok(
					nama_kelompok,
					mkategori(nama_kategori),
					mmasjid(nama_masjid)
				)
			`
      )
      .eq("is_active", true)
      .order("nama_pengajian");

    return { data, error };
  }

  // Absensi functions
  static async saveAbsensi(absensiData) {
    const { data, error } = await supabase
      .from("absensi")
      .upsert(absensiData, {
        onConflict: "jamaah_id,pengajian_id,tanggal_absensi",
      })
      .select();

    return { data, error };
  }

  static async getAbsensiByTanggal(tanggal, pengajianId = null) {
    let query = supabase
      .from("absensi")
      .select(
        `
				*,
				mjamaah(nomor_induk, nama_lengkap, mkategori(nama_kategori)),
				mpengajian(nama_pengajian)
			`
      )
      .eq("tanggal_absensi", tanggal);

    if (pengajianId) {
      query = query.eq("pengajian_id", pengajianId);
    }

    const { data, error } = await query.order("mjamaah(nama_lengkap)");
    return { data, error };
  }

  static async getRekapAbsensiBulanan(bulan, tahun, kategoriId = null) {
    const startDate = `${tahun}-${bulan.toString().padStart(2, "0")}-01`;
    const endDate = `${tahun}-${bulan.toString().padStart(2, "0")}-31`;

    let query = supabase.rpc("get_rekap_absensi_bulanan", {
      start_date: startDate,
      end_date: endDate,
      kategori_filter: kategoriId,
    });

    const { data, error } = await query;
    return { data, error };
  }

  // Dashboard statistics
  static async getDashboardStats() {
    try {
      // Get stats using manual queries instead of view
      const [jamaahResult, pengajianResult, kelompokResult, masjidResult] =
        await Promise.all([
          // Total jamaah by gender
          supabase.from("mjamaah").select("jk").eq("active", 1),

          // Total pengajian
          supabase.from("pengajian").select("id").eq("active", 1),

          // Total kelompok
          supabase.from("mkelompok").select("id").eq("active", 1),

          // Total masjid
          supabase.from("mmasjid").select("id").eq("active", 1),
        ]);

      const jamaahData = jamaahResult.data || [];
      const stats = {
        total_jamaah: jamaahData.length,
        total_putra: jamaahData.filter((j) => j.jk === "L").length,
        total_putri: jamaahData.filter((j) => j.jk === "P").length,
        total_pengajian: pengajianResult.data?.length || 0,
        total_kelompok: kelompokResult.data?.length || 0,
        total_masjid: masjidResult.data?.length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return { data: null, error };
    }
  }

  static async getAbsensiHariIni() {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("absensi")
        .select(
          `
          status_kehadiran,
          mjamaah!inner(
            id,
            nama,
            mkategori(category)
          )
        `
        )
        .eq("tanggal_absensi", today)
        .eq("mjamaah.active", 1);

      if (error) {
        console.error("Error getting today attendance:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error getting today attendance:", error);
      return { data: [], error };
    }
  }
}

// Utility functions for formatting
export const formatters = {
  date: (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  },

  time: (timeString) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  },

  statusKehadiran: (status) => {
    const statusMap = {
      H: { label: "Hadir", class: "badge-success" },
      A: { label: "Absen", class: "badge-error" },
      I: { label: "Izin", class: "badge-warning" },
    };
    return statusMap[status] || { label: "Unknown", class: "badge-info" };
  },

  percentage: (value) => {
    return `${(value || 0).toFixed(1)}%`;
  },
};
