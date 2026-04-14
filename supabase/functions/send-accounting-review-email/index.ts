// supabase/functions/send-accounting-review-email/index.ts
// Sends an email to all accounting admins when a new procurement request is submitted.
// @ts-nocheck - Runs on Deno/Supabase Edge Runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { status: 200, headers: corsHeaders });
	}

	try {
    const { email, recipientName, prNo, creatorName, purpose } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BREVO_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const senderEmail = Deno.env.get("SENDER_EMAIL") || "ipmssystem1@gmail.com";
    const senderName = Deno.env.get("SENDER_NAME") || "IPMS Procurement";

    const subject = `New Procurement Request ${prNo || ""} — Requires Review and Validation`;
    const safeCreatorName = escapeHtml(String(creatorName || "A user"));
    const safePrNo = escapeHtml(String(prNo || ""));
    const safePurpose = purpose ? escapeHtml(String(purpose)) : "";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #2563eb, #1e3a8a); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">IPMS — New Request Pending Review</h1>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
            Hi <strong>${recipientName || "there"}</strong>,
          </p>

          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
            A new procurement request has been submitted by <strong>${safeCreatorName}</strong> and requires your review and validation.
          </p>

          <div style="background: #f0f6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 0 0 16px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px;">
              PR Number
            </div>
            <div style="color: #1e3a8a; font-size: 18px; font-weight: 700;">
              ${safePrNo}
            </div>
          </div>

          ${
            safePurpose
              ? `<div style="background: #fafafa; padding: 12px 16px; border-radius: 6px; margin: 0 0 16px;">
                  <div style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Purpose</div>
                  <div style="color: #374151; font-size: 14px;">${safePurpose}</div>
                </div>`
              : ""
          }

          <p style="color: #6b7280; font-size: 13px; margin: 24px 0 0;">
            Please log in to IPMS to review and validate this new request.
          </p>
        </div>

        <div style="text-align: center; padding: 16px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated message from IPMS. Please do not reply.
          </p>
        </div>
      </div>
    `;

    // Send via Brevo transactional email API
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: recipientName || "" }],
        subject,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error("Brevo API error:", brevoRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Failed to send email", detail: errBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await brevoRes.json();

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
