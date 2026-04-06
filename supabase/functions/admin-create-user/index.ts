import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      console.error("Could not get caller user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's org
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile?.organization_id) {
      console.error("Caller has no organization");
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _org_id: callerProfile.organization_id,
      _role: "admin",
    });

    if (!isAdmin) {
      console.error("Caller is not admin");
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, role } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (createError) {
      console.error("Create user error:", createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = newUser.user!.id;
    console.log("User created:", newUserId);

    // Wait for handle_new_user trigger to create the profile
    let profileFound = false;
    for (let i = 0; i < 10; i++) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", newUserId)
        .single();
      if (profile) {
        profileFound = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!profileFound) {
      console.error("Profile not created after retries, creating manually");
      await supabaseAdmin.from("profiles").insert({
        user_id: newUserId,
        full_name: full_name || "",
        organization_id: callerProfile.organization_id,
        is_approved: true,
      });
    } else {
      // Update profile with org and approval
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          organization_id: callerProfile.organization_id,
          is_approved: true,
        })
        .eq("user_id", newUserId);
      if (updateErr) console.error("Profile update error:", updateErr.message);
    }

    // Assign role
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUserId,
      organization_id: callerProfile.organization_id,
      role: role || "viewer",
    });
    if (roleErr) console.error("Role insert error:", roleErr.message);

    console.log("User setup complete:", newUserId);
    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});