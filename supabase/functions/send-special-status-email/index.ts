// supabase/functions/send-special-status-email/index.ts
// Sends additional formal notice emails for selected status updates.
// @ts-nocheck - Runs on Deno/Supabase Edge Runtime.

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

function meetingDetailsHtml(params: {
  meetingDate?: string | null;
  meetingTime?: string | null;
  venue?: string | null;
}) {
  const date = params.meetingDate?.trim() || "To be announced";
  const time = params.meetingTime?.trim() || "To be announced";
  const venue = params.venue?.trim() || "To be announced";

  return `
    <p style="margin: 0 0 6px;"><strong>Date:</strong> ${escapeHtml(date)}</p>
    <p style="margin: 0 0 6px;"><strong>Time:</strong> ${escapeHtml(time)}</p>
    <p style="margin: 0;"><strong>Venue:</strong> ${escapeHtml(venue)}</p>
  `;
}

function buildNotice(params: {
  status: string;
  prNo: string;
  ownerName: string;
  meetingDate?: string | null;
  meetingTime?: string | null;
  venue?: string | null;
}) {
  const status = params.status;

  if (status === "notice_of_meeting") {
    return {
      subject: "Notice of Meeting for Determination of Mode of Purchase",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #111827;">
          <p>Dear Members of the BAC, Technical Working Group (TWG), and End-User,</p>
          <p>Good day!</p>
          <p>
            Please be informed that a meeting will be conducted to determine the appropriate mode of purchase for the submitted Procurement Request (PR) <strong>${escapeHtml(params.prNo)}</strong>.
            The procurement staff will be coordinating this session to ensure compliance with applicable procurement guidelines and procedures.
          </p>
          <p><strong>Details of the meeting are as follows:</strong></p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
            ${meetingDetailsHtml(params)}
          </div>
          <p>
            Your presence and participation are highly requested to facilitate timely processing of the procurement activity.
          </p>
          <p>Thank you.</p>
          <p style="margin-top: 20px;">
            Respectfully,<br />
            Ricamar D. Kintanar<br />
            BAC Secretariat<br />
            Procurement Office
          </p>
        </div>
      `,
    };
  }

  if (status === "hope_approval") {
    return {
      subject:
        "Notice of Meeting for Opening, Validation, and Awarding of Contract",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #111827;">
          <p>Dear Members of the BAC, Technical Working Group (TWG), and End-User,</p>
          <p>Good day!</p>
          <p>
            Please be advised that a meeting will be held for the opening, validation, and awarding of contract to the supplier with the Lowest Calculated and Responsive Bid (LCRB) for Procurement Request (PR) <strong>${escapeHtml(params.prNo)}</strong>.
          </p>
          <p>
            The BAC Secretariat/Procurement Personnel will facilitate this process to ensure transparency and adherence to procurement regulations.
          </p>
          <p><strong>Meeting details are as follows:</strong></p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
            ${meetingDetailsHtml(params)}
          </div>
          <p>
            Your attendance is essential for the proper conduct of this procurement activity.
          </p>
          <p>Thank you for your cooperation.</p>
          <p style="margin-top: 20px;">
            Respectfully,<br />
            Ricamar D. Kintanar<br />
            BAC Secretariat<br />
            Procurement Office
          </p>
        </div>
      `,
    };
  }

  const venue = params.venue?.trim();
  const venueLine = venue
    ? `
      <p>
        Pick-up / Delivery Point: <strong>${escapeHtml(venue)}</strong>
      </p>
    `
    : "";

  return {
    subject: "Notice of Availability of Requested Supplies/Materials/Equipment",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #111827;">
        <p>Dear ${escapeHtml(params.ownerName || "Recipient")},</p>
        <p>Good day!</p>
        <p>
          This is to inform you that the requested supplies/materials/equipment under Procurement Request (PR) <strong>${escapeHtml(params.prNo)}</strong> are now available.
        </p>
        <p>
          You may arrange for pick-up at the Supply Office or expect delivery based on the agreed schedule. Should you have any questions or require coordination, please feel free to contact our office.
        </p>
        ${venueLine}
        <p>Thank you.</p>
        <p style="margin-top: 20px;">
          Respectfully,<br />
          Jame Patrick Villegas<br />
          BAC Secretariat<br />
          Supply Office
        </p>
      </div>
    `,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const {
      status,
      prNo,
      ownerName,
      recipients,
      meetingDate,
      meetingTime,
      venue,
    } = await req.json();

    if (
      !status ||
      !["notice_of_meeting", "hope_approval", "issuance"].includes(status)
    ) {
      return new Response(JSON.stringify({ error: "Invalid status." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Recipients are required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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

    const notice = buildNotice({
      status,
      prNo: String(prNo || ""),
      ownerName: String(ownerName || "Recipient"),
      meetingDate: meetingDate ?? null,
      meetingTime: meetingTime ?? null,
      venue: venue ?? null,
    });

    const toList = recipients
      .map((email: string) => ({ email: String(email || "").trim() }))
      .filter((entry: { email: string }) => Boolean(entry.email));

    if (toList.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid recipient emails." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: toList,
        subject: notice.subject,
        htmlContent: notice.htmlContent,
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
    console.error("send-special-status-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
