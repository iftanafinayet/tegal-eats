/**
 * One-time admin seeder script.
 * Run: node scripts/create-admin.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env
 * (Find it in: Supabase Dashboard → Project Settings → API → service_role key)
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const ADMIN_EMAIL = "admin@tegaleats.com";
const ADMIN_PASSWORD = "admin123";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n🔧 Creating admin user: ${ADMIN_EMAIL}...`);

  // 1. Create or get existing user
  let userId;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log("ℹ️  User already exists, skipping creation.");
    userId = existing.id;
    // Update password just in case
    await supabase.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD });
    console.log("✅ Password updated.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      console.error("❌ Failed to create user:", error.message);
      process.exit(1);
    }

    userId = data.user.id;
    console.log(`✅ User created. ID: ${userId}`);
  }

  // 2. Assign admin role
  console.log("🔧 Assigning admin role...");
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

  if (roleError) {
    console.error("❌ Failed to assign admin role:", roleError.message);
    process.exit(1);
  }

  console.log("✅ Admin role assigned successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin Credentials:");
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Login at: /login → then access /admin\n");
}

main();
