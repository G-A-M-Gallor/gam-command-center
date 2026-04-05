// EMERGENCY: Fix talent pool security vulnerability
// Direct SQL execution to close vulnerability immediately
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("[emergency-security-fix] CRITICAL: Applying talent pool security fix");

    // Direct database connection
    const dbUrl = Deno.env.get("DATABASE_URL");
    if (!dbUrl) {
      throw new Error("DATABASE_URL not found");
    }

    // Execute SQL commands directly
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const client = new Client(dbUrl);
    await client.connect();

    console.log("🔒 Dropping vulnerable policy...");
    try {
      await client.queryObject(`DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;`);
      console.log("✅ Vulnerable policy dropped");
    } catch (error) {
      console.log("⚠️ Policy drop:", error.message);
    }

    console.log("🛡️ Creating secure policies...");

    // Policy 1: Users can read own profile
    await client.queryObject(`
      CREATE POLICY "Users can read own profile"
        ON user_profiles FOR SELECT TO authenticated
        USING (auth.uid() = id);
    `);

    // Policy 2: Admin and internal can read all profiles
    await client.queryObject(`
      CREATE POLICY "Admin and internal can read all profiles"
        ON user_profiles FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'internal')
          )
        );
    `);

    // Policy 3: Talent profiles are protected
    await client.queryObject(`
      CREATE POLICY "Talent profiles are protected"
        ON user_profiles FOR SELECT TO authenticated
        USING (
          role != 'talent' OR
          auth.uid() = id OR
          EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'internal')
          )
        );
    `);

    await client.end();

    console.log("🔒 SECURITY VULNERABILITY CLOSED!");

    return new Response(JSON.stringify({
      success: true,
      message: "🔒 CRITICAL SECURITY FIX APPLIED",
      vulnerability: "talent_pool_data_exposure",
      status: "CLOSED",
      details: "Talent profiles now protected with role-based access control",
      policies_created: [
        "Users can read own profile",
        "Admin and internal can read all profiles",
        "Talent profiles are protected"
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("[emergency-security-fix] CRITICAL FAILURE:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      critical: true,
      message: "🚨 SECURITY FIX FAILED - MANUAL INTERVENTION REQUIRED",
      vulnerability: "talent_pool_data_exposure",
      status: "STILL_OPEN"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});