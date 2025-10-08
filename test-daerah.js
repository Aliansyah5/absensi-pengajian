// Test script khusus untuk debug daerah data
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vzglkvuyeivpwsrjwqze.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z2xrdnV5ZWl2cHdzcmp3cXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzNjg1NzYsImV4cCI6MjA0Mzk0NDU3Nn0.KOSWTlrLJ0QQOxZTJgL4-P0QjANJi8BFjKGOJJLMxNs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDaerahData() {
  console.log("🔍 Testing Daerah Data...\n");

  try {
    // Test 1: Check raw table structure
    console.log("1. Checking raw table data...");
    const { data: rawData, error: rawError } = await supabase
      .from("mdaerah")
      .select("*")
      .limit(10);

    if (rawError) {
      console.error("❌ Raw data error:", rawError);
    } else {
      console.log("✅ Raw data found:", rawData?.length || 0, "records");
      if (rawData && rawData.length > 0) {
        console.log("Sample record:", JSON.stringify(rawData[0], null, 2));
      }
    }

    // Test 2: Check with active = 1
    console.log("\n2. Checking with active = 1...");
    const { data: activeData, error: activeError } = await supabase
      .from("mdaerah")
      .select("*")
      .eq("active", 1);

    if (activeError) {
      console.error("❌ Active=1 error:", activeError);
    } else {
      console.log(
        "✅ Active=1 data found:",
        activeData?.length || 0,
        "records"
      );
      if (activeData && activeData.length > 0) {
        console.log(
          "Sample active record:",
          JSON.stringify(activeData[0], null, 2)
        );
      }
    }

    // Test 3: Check with different active values
    console.log("\n3. Checking different active values...");
    const { data: allData, error: allError } = await supabase
      .from("mdaerah")
      .select("*");

    if (allError) {
      console.error("❌ All data error:", allError);
    } else {
      console.log("✅ All data found:", allData?.length || 0, "records");

      // Group by active values
      const activeGroups = {};
      allData?.forEach((item) => {
        const activeValue = item.active;
        if (!activeGroups[activeValue]) {
          activeGroups[activeValue] = 0;
        }
        activeGroups[activeValue]++;
      });

      console.log("Active value distribution:", activeGroups);
    }

    // Test 4: Check table schema
    console.log("\n4. Checking table schema...");
    const { data: schemaData, error: schemaError } = await supabase
      .from("mdaerah")
      .select("*")
      .limit(1);

    if (schemaData && schemaData.length > 0) {
      console.log("✅ Table columns:", Object.keys(schemaData[0]));
    }

    // Test 5: Try to insert a test record
    console.log("\n5. Testing insert capability...");
    const testRecord = {
      nama_daerah: "Test Daerah Debug",
      active: 1,
    };

    const { data: insertData, error: insertError } = await supabase
      .from("mdaerah")
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error("❌ Insert error:", insertError);
    } else {
      console.log("✅ Insert successful:", insertData);

      // Clean up test record
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from("mdaerah")
          .delete()
          .eq("id", insertData[0].id);

        if (deleteError) {
          console.error("❌ Cleanup error:", deleteError);
        } else {
          console.log("✅ Test record cleaned up");
        }
      }
    }
  } catch (error) {
    console.error("💥 General error:", error);
  }
}

// Run the test
testDaerahData()
  .then(() => {
    console.log("\n🎯 Daerah data test completed");
  })
  .catch((err) => {
    console.error("💥 Fatal error:", err);
  });
