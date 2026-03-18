// supabase/functions/send-password-reset-otp/index.ts
// Sends a password reset OTP via Brevo (Sendinblue) transactional API.
// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not in the Vite/TS project.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, recipientName, code } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!code) {
      return new Response(JSON.stringify({ error: "code is required" }), {
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

    const subject = "Reset Your Password — IPMS";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #2563eb, #1e3a8a); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Password Reset Request</h1>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
            Hi <strong>${recipientName || "there"}</strong>,
          </p>

          <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
            We received a request to reset your IPMS password. Use the code below to proceed. This code expires in 10 minutes.
          </p>

          <div style="background: #f0f6ff; border: 2px solid #2563eb; padding: 20px; border-radius: 8px; text-align: center; margin: 0 0 24px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">
              Your Reset Code
            </div>
            <div style="color: #1e3a8a; font-size: 36px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">
              ${code}
            </div>
          </div>

          <p style="color: #374151; font-size: 14px; margin: 0 0 16px;">
            <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your account is secure.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 4px; margin: 0 0 16px;">
            <p style="color: #7f1d1d; font-size: 13px; margin: 0;">
              Never share this code with anyone. IPMS support will never ask for your reset code.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            This is an automated message from IPMS. Please do not reply to this email.
          </p>
        </div>

        <div style="text-align: center; padding: 16px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © IPMS Procurement System
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

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("send-password-reset-otp error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
