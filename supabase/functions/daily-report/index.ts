// Supabase Edge Function: daily-report
//
// What it does, once a day (triggered by pg_cron — see cron.sql):
//   1. Reads every registration created in the last 24 hours.
//   2. Reads the list of report_recipients.
//   3. For each 'region' recipient, emails them a summary of just their region.
//      For each 'global' recipient (the Oman in-charge), emails a summary of
//      every region.
//   4. Sends each email through Brevo's transactional email API.
//
// Secrets this function needs (set once with the Supabase CLI, see README):
//   BREVO_API_KEY   - from Brevo: Settings -> SMTP & API -> API Keys
//   FROM_EMAIL      - a sender address verified in your Brevo account
//   FROM_NAME       - display name for the "From" field, e.g. "GLAD Training"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// Supabase inside every Edge Function — you don't set those yourself.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL")!;
const FROM_NAME = Deno.env.get("FROM_NAME") || "GLAD Training";

type Registration = {
  name: string;
  mobile_no: string;
  whatsapp_no: string;
  region: string;
  wilayat: string;
  village: string;
  created_at: string;
};

type Recipient = {
  email: string;
  name: string | null;
  scope: "region" | "global";
  region: string | null;
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function buildEmailHtml(title: string, rows: Registration[]) {
  if (rows.length === 0) {
    return `<h2>${escapeHtml(title)}</h2><p>No new registrations in the last 24 hours.</p>`;
  }
  const byRegion = new Map<string, Registration[]>();
  for (const r of rows) {
    if (!byRegion.has(r.region)) byRegion.set(r.region, []);
    byRegion.get(r.region)!.push(r);
  }
  let html = `<h2>${escapeHtml(title)}</h2><p>${rows.length} new registration(s) in the last 24 hours.</p>`;
  for (const [region, regionRows] of byRegion) {
    html += `<h3>${escapeHtml(region)} (${regionRows.length})</h3>`;
    html += `<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
      <tr style="background:#f0eaf3"><th>Name</th><th>Mobile</th><th>WhatsApp</th><th>Wilayat</th><th>Village</th></tr>`;
    for (const r of regionRows) {
      html += `<tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.mobile_no)}</td>
        <td>${escapeHtml(r.whatsapp_no)}</td>
        <td>${escapeHtml(r.wilayat)}</td>
        <td>${escapeHtml(r.village)}</td>
      </tr>`;
    }
    html += `</table><br>`;
  }
  return html;
}

async function sendBrevoEmail(to: { email: string; name?: string }, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [to],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}) to ${to.email}: ${body}`);
  }
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: registrations, error: regErr }, { data: recipients, error: recErr }] =
      await Promise.all([
        supabase
          .from("registrations")
          .select("name,mobile_no,whatsapp_no,region,wilayat,village,created_at")
          .gte("created_at", since),
        supabase
          .from("report_recipients")
          .select("email,name,scope,region")
          .eq("active", true),
      ]);

    if (regErr) throw regErr;
    if (recErr) throw recErr;

    const allRows = (registrations || []) as Registration[];
    const allRecipients = (recipients || []) as Recipient[];

    const results: { email: string; ok: boolean; error?: string }[] = [];

    for (const recipient of allRecipients) {
      const rows =
        recipient.scope === "global"
          ? allRows
          : allRows.filter((r) => r.region === recipient.region);

      const title =
        recipient.scope === "global"
          ? "GLAD Training — Daily Registration Summary (All Regions)"
          : `GLAD Training — Daily Registration Summary (${recipient.region})`;

      const html = buildEmailHtml(title, rows);

      try {
        await sendBrevoEmail(
          { email: recipient.email, name: recipient.name || undefined },
          title,
          html
        );
        results.push({ email: recipient.email, ok: true });
      } catch (e) {
        results.push({ email: recipient.email, ok: false, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ sent: results.length, results, registrations_count: allRows.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
