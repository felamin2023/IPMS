// src/lib/generatePr.ts
// Generates a printable Purchase Request document matching the
// CTU Argao Campus official PR form layout.

import type { RequestRow } from "./requests";

/** Plain number format without currency symbol (for table cells). */
function num(n: number) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce(
    (sum, it) => sum + (it.unit_cost ?? 0) * (it.qty ?? 0),
    0,
  );
}

/** Minimum visible item rows so the form always looks filled. */
const MIN_ROWS = 15;

/**
 * Opens a new window with a printable Purchase Request document
 * matching the official CTU Argao Campus PR form.
 */
export function generatePrDocument(request: RequestRow) {
  const items = request.items ?? [];
  const total = itemsTotal(items);
  const creatorName = request.creator
    ? `${request.creator.first_name} ${request.creator.last_name}`
    : "";
  const creatorDesignation = ""; // can be populated if user profile has designation
  const dateStr = new Date(request.created_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const departmentSection = request.college?.name ?? "";
  const responsibilityCenter = request.college?.code ?? "";
  const baseUrl = window.location.origin;

  // ── Build item rows ──────────────────────────────────
  const filledRows = items
    .map(
      (item) => `
      <tr>
        <td class="c">${item.stock_no || ""}</td>
        <td class="c">${item.qty}</td>
        <td>${item.item_description}</td>
        <td class="c">${item.uom}</td>
        <td class="r">${item.unit_cost ? num(Number(item.unit_cost)) : ""}</td>
        <td class="r">${item.total_cost ? num(Number(item.total_cost)) : "-"}</td>
      </tr>`,
    )
    .join("");

  const emptyCount = Math.max(0, MIN_ROWS - items.length);
  const emptyRows = Array.from(
    { length: emptyCount },
    () => `
      <tr>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td class="r">-</td>
      </tr>`,
  ).join("");

  // ── Full HTML ────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Request – ${request.pr_no ?? "Draft"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      color: #000;
      max-width: 816px;            /* ~8.5 in */
      margin: 0 auto;
      padding: 10px 12px;
    }

    /* ── Outer border ─────────────────────────── */
    .page {
      padding: 0;
    }

    /* ── Header ───────────────────────────────── */
    .header {
      text-align: center;
      padding: 10px 16px 8px;
    }
    .header img {
      max-width: 100%;
      height: auto;
      max-height: 100px;
    }

    /* ── Title ─────────────────────────────────── */
    .title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 6px;
      text-decoration: underline;
      padding: 6px 0 8px;
    }

    /* ── Info grid (Department, PR No, Date…) ── */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .info-table td {
      border: 1px solid #000;
      padding: 3px 6px;
      vertical-align: top;
    }
    .info-table .lbl { font-weight: bold; }

    /* ── Items table ──────────────────────────── */
    .items {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .items th,
    .items td {
      border: 1px solid #000;
      padding: 3px 6px;
    }
    .items th {
      background: #fff;
      font-weight: bold;
      text-align: center;
    }
    .items .c { text-align: center; }
    .items .r { text-align: right; }

    /* ── Purpose ──────────────────────────────── */
    .purpose-row td {
      border: 1px solid #000;
      padding: 6px 8px;
      font-size: 10pt;
      min-height: 36px;
    }

    /* ── Signatures ───────────────────────────── */
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .sig-table td {
      border: 1px solid #000;
      padding: 4px 8px;
      vertical-align: top;
    }
    .sig-table .sig-header { font-weight: bold; padding-bottom: 30px; }
    .sig-label { font-weight: bold; }

    /* ── Approval ─────────────────────────────── */
    .approval {
      text-align: center;
      padding: 6px 0 2px;
      border: 1px solid #000;
      border-top: 0;
    }
    .approval .by { font-size: 10pt; }
    .approval .name {
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      margin-top: 4px;
    }
    .approval .position { font-size: 10pt; margin-bottom: 6px; }

    /* ── Footer logos ─────────────────────────── */
    .footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 6px 12px 8px;
      border-top: 1px solid #000;
      flex-wrap: wrap;
    }
    .footer img { height: 32px; }

    /* ── Print button ─────────────────────────── */
    .print-btn {
      display: block;
      margin: 16px auto;
      padding: 10px 32px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="page">

    <!-- ═══ HEADER ═══ -->
    <div class="header">
      <img src="${baseUrl}/assets/header.jpg" alt="CTU Argao Campus Header" onerror="this.style.display='none'" />
    </div>

    <!-- ═══ TITLE ═══ -->
    <div class="title">PURCHASE &nbsp; REQUEST</div>

    <!-- ═══ INFO GRID ═══ -->
    <table class="info-table">
      <tr>
        <td rowspan="2" style="width:50%">
          <span class="lbl">Department/ Section:</span><br/>
          ${departmentSection}
        </td>
        <td style="width:22%">
          <span class="lbl">PR No:</span><br/>
          ${request.pr_no ?? ""}
        </td>
        <td style="width:28%">
          <span class="lbl">Date:</span><br/>
          ${dateStr}
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <span style="font-size:9pt;text-decoration:underline">Responsibility</span><br/>
          <span class="lbl">Center Code:</span> ${responsibilityCenter}
        </td>
      </tr>
      <tr>
        <td>
          <span class="lbl">Fund Source:</span> ${request.fund_source ?? ""}
        </td>
        <td colspan="2">&nbsp;</td>
      </tr>
    </table>

    <!-- ═══ ITEMS TABLE ═══ -->
    <table class="items">
      <thead>
        <tr>
          <th style="width:8%">Stock #</th>
          <th style="width:9%">Quantity</th>
          <th>Item Description</th>
          <th style="width:9%">UOM</th>
          <th style="width:12%">Unit Cost</th>
          <th style="width:14%">Total Cost</th>
        </tr>
      </thead>
      <tbody>
        ${filledRows}
        ${emptyRows}
        <!-- Grand Total row -->
        <tr>
          <td colspan="4" style="border-right:none">&nbsp;</td>
          <td style="border-left:none;text-align:right;font-weight:bold">Grand Total</td>
          <td class="r" style="font-weight:bold">${total > 0 ? num(total) : "-"}</td>
        </tr>
      </tbody>
    </table>

    <!-- ═══ PURPOSE ═══ -->
    <table style="width:100%;border-collapse:collapse">
      <tr class="purpose-row">
        <td><em>Purpose:</em>&nbsp; ${request.purpose ?? ""}</td>
      </tr>
    </table>

    <!-- ═══ SIGNATURES ═══ -->
    <table class="sig-table">
      <tr>
        <td style="width:50%">
          <div class="sig-header">Requested by:</div>
        </td>
        <td>
          <div class="sig-header">Reviewed by:</div>
        </td>
      </tr>
      <tr>
        <td>
          <span class="sig-label">Signature:</span><br/><br/>
          <span class="sig-label">Printed Name:</span> ${creatorName}<br/>
          <span class="sig-label">Designation:</span> ${creatorDesignation}
        </td>
        <td>
          <span class="sig-label">Signature:</span><br/><br/>
          <span class="sig-label">Printed Name:</span><br/>
          <span class="sig-label">Designation:</span>
        </td>
      </tr>
    </table>

    <!-- ═══ APPROVAL ═══ -->
    <div class="approval">
      <div class="by">Approved by:</div>
      <div class="name">EINGILBERT C. BENOLIRAO, Dev. Ed. D.</div>
      <div class="position">Campus Director</div>
    </div>

    <!-- ═══ FOOTER LOGOS ═══ -->
    <div class="footer">
      <img src="${baseUrl}/assets/footer.jpg" alt="Accreditation logos" style="height:36px;max-width:100%" onerror="this.style.display='none'" />
    </div>

  </div><!-- .page -->
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
