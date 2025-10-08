// Script untuk test dan populate database dengan sample data
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vzglkvuyeivpwsrjwqze.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2xrdnV5ZWl2cHdzcmp3cXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzNjg1NzYsImV4cCI6MjA0Mzk0NDU3Nn0.KOSWTlrLJ0QQOxZTJgL4-P0QjANJi8BFjKGOJJLMxNs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSampleData() {
  console.log("🚀 Starting database population...");

  try {
    // 1. Insert sample pengajian data
    console.log("📚 Adding sample pengajian data...");
    const pengajianData = [
      { nama_pengajian: "Pengajian Rutin Masjid Al-Ikhlas", active: 1 },
      { nama_pengajian: "Kajian Tafsir Al-Quran", active: 1 },
      { nama_pengajian: "Pengajian Hadits Sahih", active: 1 },
    ];

    for (const item of pengajianData) {
      const { error } = await supabase.from("mpengajian").upsert(item);
      if (error) console.error("Error inserting pengajian:", error);
    }

    // 2. Insert sample daerah data
    console.log("🗺️ Adding sample daerah data...");
    const daerahData = [
      { nama_daerah: "Jakarta Selatan", active: 1 },
      { nama_daerah: "Jakarta Pusat", active: 1 },
      { nama_daerah: "Jakarta Utara", active: 1 },
    ];

    for (const item of daerahData) {
      const { error } = await supabase.from("mdaerah").upsert(item);
      if (error) console.error("Error inserting daerah:", error);
    }

    // 3. Insert sample desa data
    console.log("🏘️ Adding sample desa data...");
    const desaData = [
      { nama_desa: "Kemang", active: 1 },
      { nama_desa: "Pondok Indah", active: 1 },
      { nama_desa: "Kebayoran Baru", active: 1 },
    ];

    for (const item of desaData) {
      const { error } = await supabase.from("mdesa").upsert(item);
      if (error) console.error("Error inserting desa:", error);
    }

    // Get IDs for foreign keys
    const { data: daerahList } = await supabase
      .from("mdaerah")
      .select("id, nama_daerah")
      .eq("active", 1);

    const { data: desaList } = await supabase
      .from("mdesa")
      .select("id, nama_desa")
      .eq("active", 1);

    // 4. Insert sample kelompok data
    if (
      daerahList &&
      desaList &&
      daerahList.length > 0 &&
      desaList.length > 0
    ) {
      console.log("👥 Adding sample kelompok data...");
      const kelompokData = [
        {
          nama_kelompok: "Kelompok Masjid Al-Hidayah",
          id_daerah: daerahList[0].id,
          id_desa: desaList[0].id,
          active: 1,
        },
        {
          nama_kelompok: "Kelompok Musholla As-Salam",
          id_daerah: daerahList[1].id,
          id_desa: desaList[1].id,
          active: 1,
        },
      ];

      for (const item of kelompokData) {
        const { error } = await supabase.from("mkelompok").upsert(item);
        if (error) console.error("Error inserting kelompok:", error);
      }
    }

    // Get kelompok IDs
    const { data: kelompokList } = await supabase
      .from("mkelompok")
      .select("id, nama_kelompok")
      .eq("active", 1);

    // 5. Insert sample masjid data
    if (kelompokList && kelompokList.length > 0) {
      console.log("🕌 Adding sample masjid data...");
      const masjidData = [
        {
          nama_masjid: "Masjid Al-Ikhlas",
          id_kelompok: kelompokList[0].id,
          active: 1,
        },
        {
          nama_masjid: "Masjid Ar-Rahman",
          id_kelompok: kelompokList[0].id,
          active: 1,
        },
      ];

      for (const item of masjidData) {
        const { error } = await supabase.from("mmasjid").upsert(item);
        if (error) console.error("Error inserting masjid:", error);
      }
    }

    // 6. Insert other master data
    console.log("📝 Adding sample kategori data...");
    const kategoriData = [
      { category: "Jamaah Rutin", group: "Aktif", active: 1 },
      { category: "Jamaah Baru", group: "Pemula", active: 1 },
    ];

    for (const item of kategoriData) {
      const { error } = await supabase.from("mkategori").upsert(item);
      if (error) console.error("Error inserting kategori:", error);
    }

    console.log("📖 Adding sample hadist data...");
    const hadistData = [
      { nama_hadist: "Sahih Bukhari", jumlah_halaman: 500, active: 1 },
      { nama_hadist: "Sahih Muslim", jumlah_halaman: 450, active: 1 },
    ];

    for (const item of hadistData) {
      const { error } = await supabase.from("mhadist").upsert(item);
      if (error) console.error("Error inserting hadist:", error);
    }

    console.log("📿 Adding sample alquran data...");
    const alquranData = [
      { nama_surat: "Al-Fatihah", juz: 1, jumlah_ayat: 7, active: 1 },
      { nama_surat: "Al-Baqarah", juz: 1, jumlah_ayat: 286, active: 1 },
    ];

    for (const item of alquranData) {
      const { error } = await supabase.from("malquran").upsert(item);
      if (error) console.error("Error inserting alquran:", error);
    }

    console.log("🍽️ Adding sample dapukan data...");
    const dapukanData = [
      { nama_dapukan: "Menu Nasi Kotak", active: 1 },
      { nama_dapukan: "Menu Snack Box", active: 1 },
    ];

    for (const item of dapukanData) {
      const { error } = await supabase.from("mdapukan").upsert(item);
      if (error) console.error("Error inserting dapukan:", error);
    }

    console.log("✅ Sample data population completed!");

    // Verify data
    console.log("\n📊 Verifying inserted data...");
    const tables = [
      "mpengajian",
      "mdaerah",
      "mdesa",
      "mkelompok",
      "mmasjid",
      "mkategori",
      "mhadist",
      "malquran",
      "mdapukan",
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("active", 1);

      if (error) {
        console.error(`❌ Error verifying ${table}:`, error);
      } else {
        console.log(`✅ ${table}: ${data?.length || 0} records`);
      }
    }
  } catch (error) {
    console.error("💥 Error populating database:", error);
  }
}

// Run the population script
populateSampleData()
  .then(() => {
    console.log("\n🎯 Database population completed");
  })
  .catch((err) => {
    console.error("💥 Fatal error:", err);
  });
