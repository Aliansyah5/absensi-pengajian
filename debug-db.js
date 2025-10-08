// Debug script untuk test database connection
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vzglkvuyeivpwsrjwqze.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2xrdnV5ZWl2cHdzcmp3cXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzNjg1NzYsImV4cCI6MjA0Mzk0NDU3Nn0.KOSWTlrLJ0QQOxZTJgL4-P0QjANJi8BFjKGOJJLMxNs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log("🔍 Testing database connection...");

  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("mpengajian")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Database connection failed:", testError);
      return;
    }

    console.log("✅ Database connection successful");

    // Check all master tables
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
      "mjamaah",
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("active", 1)
          .limit(5);

        if (error) {
          console.error(`❌ Error accessing table ${table}:`, error);
        } else {
          console.log(`✅ Table ${table}: ${data?.length || 0} records found`);
          if (data && data.length > 0) {
            console.log(`   Sample: ${JSON.stringify(data[0], null, 2)}`);
          }
        }
      } catch (err) {
        console.error(`❌ Exception accessing table ${table}:`, err);
      }
    }

    // Test specific Kelompok query with JOIN
    console.log("\n🔍 Testing Kelompok query with JOIN...");
    const { data: kelompokData, error: kelompokError } = await supabase
      .from("mkelompok")
      .select(
        `
        *,
        mdesa (nama_desa),
        mdaerah (nama_daerah)
      `
      )
      .eq("active", 1)
      .limit(3);

    if (kelompokError) {
      console.error("❌ Kelompok JOIN query failed:", kelompokError);
    } else {
      console.log("✅ Kelompok JOIN query successful:", kelompokData);
    }

    // Test specific Masjid query with JOIN
    console.log("\n🔍 Testing Masjid query with JOIN...");
    const { data: masjidData, error: masjidError } = await supabase
      .from("mmasjid")
      .select(
        `
        *,
        mkelompok (nama_kelompok, mdesa(nama_desa), mdaerah(nama_daerah))
      `
      )
      .eq("active", 1)
      .limit(3);

    if (masjidError) {
      console.error("❌ Masjid JOIN query failed:", masjidError);
    } else {
      console.log("✅ Masjid JOIN query successful:", masjidData);
    }
  } catch (error) {
    console.error("❌ General error:", error);
  }
}

// Run the test
testDatabase()
  .then(() => {
    console.log("\n🎯 Database test completed");
  })
  .catch((err) => {
    console.error("💥 Fatal error:", err);
  });
