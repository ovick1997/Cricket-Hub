import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile?.organization_id) {
      return new Response(JSON.stringify({ error: "Caller has no organization" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _org_id: callerProfile.organization_id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { user_id, organization_id, role, remove } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REMOVE: unassign user from their org
    if (remove === true) {
      console.log(`Removing user ${user_id} from their organization`);

      // Get user's current org
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user_id)
        .single();

      if (targetProfile?.organization_id) {
        // Delete role entries
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("organization_id", targetProfile.organization_id);
      }

      // Clear org from profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ organization_id: null, is_approved: false })
        .eq("user_id", user_id);

      if (profileError) {
        console.error("Remove profile error:", profileError);
        return new Response(JSON.stringify({ error: "Failed to remove: " + profileError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Remove successful");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ASSIGN: assign user to organization with role
    if (!organization_id || !role) {
      return new Response(JSON.stringify({ error: "Missing organization_id or role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Assigning user ${user_id} to org ${organization_id} with role ${role}`);

    // Remove old role entries for this user
    const { data: oldRoles } = await supabaseAdmin
      .from("user_roles")
      .select("id, organization_id")
      .eq("user_id", user_id);

    if (oldRoles && oldRoles.length > 0) {
      for (const oldRole of oldRoles) {
        if (oldRole.organization_id !== organization_id) {
          await supabaseAdmin.from("user_roles").delete().eq("id", oldRole.id);
        }
      }
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("organization_id", organization_id);
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ organization_id, is_approved: true })
      .eq("user_id", user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(JSON.stringify({ error: "Failed to update profile: " + profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert new role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id, organization_id, role });

    if (roleError) {
      console.error("Role insert error:", roleError);
      return new Response(JSON.stringify({ error: "Failed to assign role: " + roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Assignment successful");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});