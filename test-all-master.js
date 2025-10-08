// Test semua master data untuk debugging
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vzglkvuyeivpwsrjwqze.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2xrdnV5ZWl2cHdzcmp3cXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzNjg1NzYsImV4cCI6MjA0Mzk0NDU3Nn0.KOSWTlrLJ0QQOxZTJgL4-P0QjANJi8BFjKGOJJLMxNs";

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock localStorage untuk testing
if (typeof window === "undefined") {
  global.localStorage = {
    getItem: () =>
      JSON.stringify({
        user: { email: "admin@test.com" },
      }),
    setItem: () => {},
    removeItem: () => {},
  };
  global.window = { localStorage: global.localStorage };
}

async function testAllMasterData() {
  console.log("🔍 Testing All Master Data...\n");

  const tables = [
    { name: "pengajian", table: "mpengajian" },
    { name: "daerah", table: "mdaerah" },
    { name: "desa", table: "mdesa" },
    { name: "kelompok", table: "mkelompok" },
    { name: "masjid", table: "mmasjid" },
    { name: "kategori", table: "mkategori" },
    { name: "hadist", table: "mhadist" },
    { name: "alquran", table: "malquran" },
    { name: "dapukan", table: "mdapukan" },
    { name: "jamaah", table: "mjamaah" },
  ];

  for (const { name, table } of tables) {
    console.log(`📊 Testing ${name} (${table})...`);

    try {
      // Test 1: Raw data without filter
      const { data: allData, error: allError } = await supabase
        .from(table)
        .select("*");

      if (allError) {
        console.error(`❌ ${name} - Raw query error:`, allError);
        continue;
      }

      console.log(`✅ ${name} - Total records: ${allData?.length || 0}`);

      // Test 2: With active = 1 filter
      const { data: activeData, error: activeError } = await supabase
        .from(table)
        .select("*")
        .eq("active", 1);

      if (!activeError) {
        console.log(
          `✅ ${name} - Active=1 records: ${activeData?.length || 0}`
        );
      } else {
        console.log(
          `⚠️  ${name} - Active=1 filter failed:`,
          activeError.message
        );
      }

      // Show sample record if exists
      if (allData && allData.length > 0) {
        const sampleKeys = Object.keys(allData[0]);
        console.log(`   📋 Columns: ${sampleKeys.join(", ")}`);

        // Check active field values
        const activeValues = [...new Set(allData.map((item) => item.active))];
        console.log(`   🔢 Active values found: ${activeValues.join(", ")}`);

        // Show first record (truncated)
        const sample = allData[0];
        const truncatedSample = {};
        Object.keys(sample)
          .slice(0, 5)
          .forEach((key) => {
            truncatedSample[key] = sample[key];
          });
        console.log(`   📝 Sample:`, truncatedSample);
      } else {
        console.log(`   ⚠️  No data found in ${table}`);
      }
    } catch (error) {
      console.error(`❌ ${name} - Exception:`, error.message);
    }

    console.log(""); // Empty line for readability
  }

  // Test authentication
  console.log("🔐 Testing Authentication...");
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Supabase user:", user ? "Authenticated" : "Not authenticated");

    // Test localStorage session
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("supabase.auth.session");
      console.log("localStorage session:", session ? "Found" : "Not found");
    }
  } catch (error) {
    console.error("Auth test error:", error);
  }
}

// Run the test
testAllMasterData()
  .then(() => {
    console.log("🎯 All master data testing completed");
  })
  .catch((err) => {
    console.error("💥 Fatal error:", err);
  });
