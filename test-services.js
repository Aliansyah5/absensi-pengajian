// Test script untuk semua master data services
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

// Import our services
async function importServices() {
  const {
    MasterDataService,
    PengajianService,
    DaerahService,
    DesaService,
    KelompokService,
    MasjidService,
  } = await import("./src/lib/services/masterData.js");
  return {
    MasterDataService,
    PengajianService,
    DaerahService,
    DesaService,
    KelompokService,
    MasjidService,
  };
}

async function testServices() {
  console.log("🧪 Testing Master Data Services...\n");

  try {
    const services = await importServices();
    const {
      MasterDataService,
      PengajianService,
      DaerahService,
      DesaService,
      KelompokService,
      MasjidService,
    } = services;

    // Test authentication first
    console.log("🔐 Testing authentication...");
    const isSuperAdmin = await MasterDataService.isSuperAdmin();
    const userRole = await MasterDataService.getUserRole();
    console.log("Is Super Admin:", isSuperAdmin);
    console.log("User Role:", userRole);

    // Test master access
    const hasReadAccess = await MasterDataService.validateMasterAccess("read");
    console.log("Has Read Access:", hasReadAccess);
    console.log("");

    // Test each service
    const servicesToTest = [
      {
        name: "Pengajian",
        service: PengajianService,
        method: "getAllPengajian",
      },
      { name: "Daerah", service: DaerahService, method: "getAllDaerah" },
      { name: "Desa", service: DesaService, method: "getAllDesa" },
      { name: "Kelompok", service: KelompokService, method: "getAllKelompok" },
      { name: "Masjid", service: MasjidService, method: "getAllMasjid" },
    ];

    for (const { name, service, method } of servicesToTest) {
      console.log(`📊 Testing ${name} Service...`);
      try {
        const data = await service[method]();
        console.log(`✅ ${name}: ${data?.length || 0} records found`);

        if (data && data.length > 0) {
          console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
        } else {
          console.warn(`⚠️  No data found for ${name}`);
        }
      } catch (error) {
        console.error(`❌ Error testing ${name}:`, error.message);
      }
      console.log("");
    }

    // Test relational methods
    console.log("🔗 Testing relational methods...");

    try {
      console.log("Testing KelompokService.getAllDesa()...");
      const desaOptions = await KelompokService.getAllDesa();
      console.log(`✅ Desa options: ${desaOptions?.length || 0} records`);

      console.log("Testing KelompokService.getAllDaerah()...");
      const daerahOptions = await KelompokService.getAllDaerah();
      console.log(`✅ Daerah options: ${daerahOptions?.length || 0} records`);

      console.log("Testing MasjidService.getAllKelompok()...");
      const kelompokOptions = await MasjidService.getAllKelompok();
      console.log(
        `✅ Kelompok options: ${kelompokOptions?.length || 0} records`
      );
    } catch (error) {
      console.error("❌ Error testing relational methods:", error.message);
    }

    console.log("\n🎯 Service testing completed!");
  } catch (error) {
    console.error("💥 Fatal error in service testing:", error);
  }
}

// Run the test
testServices().catch((err) => {
  console.error("💥 Script error:", err);
});
