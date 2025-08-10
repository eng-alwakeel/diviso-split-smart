import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function arabicToEnglishDigits(input: string) {
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    ",": ".",
  };
  return input.replace(/[٠-٩,]/g, (d) => map[d] ?? d);
}

function extractFields(text: string) {
  const t = arabicToEnglishDigits(text.replace(/\u066B/g, ".")); // Arabic decimal sep
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const merchant = lines[0]?.slice(0, 80) || null;

  const totalRegex = /(الإجمالي|المجموع|إجمالي|Total|Grand Total)\s*[:\-]?
\s*([0-9]+(?:\.[0-9]{1,2})?)/i;
  const vatRegex = /(ضريبة(?:\s*القيمة\s*المضافة)?|VAT)\s*[:\-]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i;
  const dateRegex = /(?:(?:\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})|(?:\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}))/;

  const totalMatch = t.match(totalRegex);
  const vatMatch = t.match(vatRegex);
  const dateMatch = arabicToEnglishDigits(t).match(dateRegex);

  return {
    merchant,
    total: totalMatch ? Number(totalMatch[2]) : null,
    vat: vatMatch ? Number(vatMatch[2]) : null,
    currency: "SAR",
    date: dateMatch ? new Date(dateMatch[0]) : null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_path } = await req.json();
    if (!file_path) {
      return new Response(JSON.stringify({ error: "file_path is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VISION_KEY = Deno.env.get("GCP_VISION_API_KEY");

    if (!VISION_KEY) {
      return new Response(JSON.stringify({ error: "GCP_VISION_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.split(" ")[1];
    const { data: userRes } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } } as any;
    const userId = userRes?.user?.id ?? null;

    // Download the image from storage
    const { data: file, error: dErr } = await supabase.storage.from("receipts").download(file_path);
    if (dErr || !file) {
      return new Response(JSON.stringify({ error: "Cannot download file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const arr = new Uint8Array(await file.arrayBuffer());
    const b64 = btoa(String.fromCharCode(...arr));

    // Call Google Vision
    const body = {
      requests: [
        {
          image: { content: b64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        },
      ],
    };

    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`;
    let resp = await fetch(visionUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let data = await resp.json();

    // Fallback to TEXT_DETECTION
    if (!data?.responses?.[0]?.fullTextAnnotation?.text) {
      const fallbackBody = {
        requests: [
          {
            image: { content: b64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      };
      resp = await fetch(visionUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fallbackBody) });
      data = await resp.json();
    }

    const text: string =
      data?.responses?.[0]?.fullTextAnnotation?.text ||
      data?.responses?.[0]?.textAnnotations?.[0]?.description ||
      "";

    const fields = extractFields(text || "");

    // Save OCR result
    if (userId) {
      await supabase.from("receipt_ocr").insert({
        storage_path: file_path,
        merchant: fields.merchant,
        total: fields.total,
        vat: fields.vat,
        currency: fields.currency,
        receipt_date: fields.date ? new Date(fields.date).toISOString() : null,
        raw_text: text,
        created_by: userId,
      });
    }

    return new Response(
      JSON.stringify({
        merchant: fields.merchant,
        total: fields.total,
        vat: fields.vat,
        currency: fields.currency,
        date: fields.date ? new Date(fields.date).toISOString().slice(0, 10) : null,
        raw_text: text,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("process_receipt error:", e);
    return new Response(JSON.stringify({ error: "processing_failed", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
