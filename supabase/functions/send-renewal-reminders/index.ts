import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reminder timing configuration
const MONTHLY_REMINDER_HOURS = 24; // 24 hours before renewal
const YEARLY_REMINDER_DAYS = [7, 1]; // 7 days and 1 day before renewal

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const now = new Date();
    
    console.log(`Running renewal reminders check at ${now.toISOString()}`);

    // Find subscriptions needing reminders
    const { data: subscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan, billing_cycle, next_renewal_date, auto_renew, renewal_reminder_sent_at")
      .eq("auto_renew", true)
      .not("next_renewal_date", "is", null)
      .in("status", ["active", "trialing"]);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${subscriptions?.length || 0} active auto-renewing subscriptions`);

    let remindersSent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions || []) {
      try {
        const renewalDate = new Date(sub.next_renewal_date);
        const hoursUntilRenewal = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const daysUntilRenewal = Math.ceil(hoursUntilRenewal / 24);

        // Skip if already sent a reminder in the last 12 hours
        if (sub.renewal_reminder_sent_at) {
          const lastReminder = new Date(sub.renewal_reminder_sent_at);
          const hoursSinceReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60);
          if (hoursSinceReminder < 12) {
            continue;
          }
        }

        let shouldSendReminder = false;
        let reminderType = "";

        if (sub.billing_cycle === "yearly") {
          // Yearly: Send reminders at 7 days and 1 day before
          if (daysUntilRenewal <= 7 && daysUntilRenewal > 1) {
            shouldSendReminder = true;
            reminderType = "7_days";
          } else if (daysUntilRenewal <= 1 && hoursUntilRenewal > 0) {
            shouldSendReminder = true;
            reminderType = "24_hours";
          }
        } else {
          // Monthly: Send reminder at 24-48 hours before
          if (hoursUntilRenewal <= 48 && hoursUntilRenewal > 0) {
            shouldSendReminder = true;
            reminderType = "24_hours";
          }
        }

        if (shouldSendReminder) {
          // Get user profile for name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", sub.user_id)
            .single();

          const userName = profile?.full_name || "مستخدم";
          const cycleText = sub.billing_cycle === "yearly" ? "السنوي" : "الشهري";
          const cycleTextEn = sub.billing_cycle === "yearly" ? "annual" : "monthly";

          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            type: "renewal_reminder",
            payload: {
              title_ar: "تذكير بالتجديد",
              title_en: "Renewal Reminder",
              message_ar: `مرحباً ${userName}! اشتراكك ${cycleText} سيتجدد تلقائياً ${daysUntilRenewal <= 1 ? "خلال 24 ساعة" : `خلال ${daysUntilRenewal} أيام`}. يمكنك إدارة اشتراكك من الإعدادات.`,
              message_en: `Hi ${userName}! Your ${cycleTextEn} subscription will auto-renew ${daysUntilRenewal <= 1 ? "within 24 hours" : `in ${daysUntilRenewal} days`}. You can manage it in Settings.`,
              renewal_date: sub.next_renewal_date,
              billing_cycle: sub.billing_cycle,
              reminder_type: reminderType,
            },
          });

          // Record the reminder
          await supabase.from("renewal_reminders").insert({
            user_id: sub.user_id,
            subscription_id: sub.id,
            reminder_type: reminderType,
            billing_cycle: sub.billing_cycle,
            channel: "in_app",
          });

          // Update last reminder sent timestamp
          await supabase
            .from("user_subscriptions")
            .update({ renewal_reminder_sent_at: now.toISOString() })
            .eq("id", sub.id);

          remindersSent++;
          console.log(`Sent ${reminderType} reminder to user ${sub.user_id} for ${sub.billing_cycle} subscription`);
        }
      } catch (subError) {
        const errorMsg = `Error processing subscription ${sub.id}: ${subError}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Also check for grace period expiring subscriptions
    const { data: graceSubscriptions } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, grace_period_ends_at")
      .not("grace_period_ends_at", "is", null)
      .gt("grace_period_ends_at", now.toISOString());

    for (const sub of graceSubscriptions || []) {
      const graceEnd = new Date(sub.grace_period_ends_at!);
      const hoursUntilExpiry = (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminder at 24 hours before grace period ends
      if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) {
        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          type: "grace_period_ending",
          payload: {
            title_ar: "⚠️ تنتهي فترة السماح قريباً",
            title_en: "⚠️ Grace Period Ending Soon",
            message_ar: "يرجى تحديث طريقة الدفع خلال 24 ساعة للحفاظ على اشتراكك.",
            message_en: "Please update your payment method within 24 hours to keep your subscription.",
            grace_period_ends_at: sub.grace_period_ends_at,
          },
        });

        await supabase.from("renewal_reminders").insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          reminder_type: "grace_period",
          billing_cycle: "monthly", // doesn't matter for grace period
          channel: "in_app",
        });

        remindersSent++;
        console.log(`Sent grace period reminder to user ${sub.user_id}`);
      }
    }

    console.log(`Completed: ${remindersSent} reminders sent, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: remindersSent,
        errors: errors.length > 0 ? errors : undefined 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Renewal reminders error:", error);
    return new Response(
      JSON.stringify({ error: "unexpected_error", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});