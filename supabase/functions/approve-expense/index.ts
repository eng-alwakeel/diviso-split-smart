// Approve an expense if it is pending and the caller is an admin of the expense's group
// Uses the caller's JWT (Authorization header) and relies on RLS policies for access control
// CORS is enabled for browser calls

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { expense_id } = await req.json().catch(() => ({}));
    if (!expense_id) {
      return new Response(JSON.stringify({ error: "expense_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch expense details
    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .select("id, group_id, status")
      .eq("id", expense_id)
      .maybeSingle();

    if (expErr) {
      console.error("Error fetching expense:", expErr);
      return new Response(JSON.stringify({ error: expErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!expense) {
      return new Response(JSON.stringify({ error: "Expense not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (expense.status !== "pending") {
      return new Response(JSON.stringify({ error: "Only pending expenses can be approved" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin membership
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_group_admin", {
      p_group_id: expense.group_id,
    });
    if (adminErr) {
      console.error("Admin check failed:", adminErr);
      return new Response(JSON.stringify({ error: adminErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only group admins can approve expenses" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update expense to approved
    const { error: updErr } = await supabase
      .from("expenses")
      .update({ status: "approved" })
      .eq("id", expense_id);

    if (updErr) {
      console.error("Error updating expense:", updErr);
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get current user id from auth
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user?.id) {
      console.error("Error getting user:", userErr);
      return new Response(JSON.stringify({ error: "Unable to resolve current user" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert approval record
    const { error: insErr } = await supabase
      .from("expense_approvals")
      .insert({ expense_id, approved_by: userRes.user.id });

    if (insErr) {
      console.error("Error inserting approval:", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
