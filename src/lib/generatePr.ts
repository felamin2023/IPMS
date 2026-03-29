// src/lib/generatePr.ts
// Generates a printable Purchase Request document matching the
// CTU Argao Campus official PR form layout.

import type { RequestRow } from "./requests";

function peso(n: number) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MIN_ROWS = 20;

/**
 * Opens a new window with a printable Purchase Request document
 * matching the official CTU Argao Campus PR form.
 */
export function generatePrDocument(request: RequestRow) {
  console.log("PR document request data:", request);
  const programRaw = request.program as unknown;
  const program = (Array.isArray(programRaw) ? programRaw[0] : programRaw) as
    | { code?: string | null; name?: string | null }
    | null
    | undefined;
  const collegeRaw = request.college as unknown;
  const college = (Array.isArray(collegeRaw) ? collegeRaw[0] : collegeRaw) as
    | { name?: string | null }
    | null
    | undefined;
  const items = request.items ?? [];
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const category = item.category?.trim() || "Uncategorized";
    const list = grouped.get(category) ?? [];
    list.push(item);
    grouped.set(category, list);
  }

  const prNoByCategory = new Map(
    (request.pr_groups ?? []).map((group) => [group.category, group.pr_no]),
  );

  const dateStr = new Date(request.created_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const departmentSection = college?.name ?? "";
  const responsibilityCenter = program?.name ?? "";
  console.log("PR responsibility center:", responsibilityCenter);
  const requestedBy = request.requested_by ?? "";
  const reviewedBy = request.reviewed_by ?? "";
  const baseUrl = window.location.origin;

  const pages = Array.from(grouped.entries())
    .map(([category, list]) => {
      const prNo = prNoByCategory.get(category) ?? request.pr_no ?? "";
      const grandTotal = list.reduce(
        (sum, item) => sum + (Number(item.unit_cost) || 0) * (item.qty ?? 0),
        0,
      );
      const rows = list
        .map((item, idx) => {
          const stockNo = item.stock_no || String(idx + 1);
          const qty = Number(item.qty ?? 0);
          const unitCost = Number(item.unit_cost ?? 0);
          return `
            <tr class="data-row">
              <td class="c">${escapeHtml(stockNo)}</td>
              <td class="c">${qty || ""}</td>
              <td>${escapeHtml(item.item_description)}</td>
              <td class="c">${escapeHtml(item.uom)}</td>
              <td class="r">${unitCost ? peso(unitCost) : ""}</td>
              <td class="r">${unitCost && qty ? peso(unitCost * qty) : ""}</td>
            </tr>
          `;
        })
        .join("");
      const blankRows = Math.max(0, MIN_ROWS - list.length);
      const emptyRows = Array.from({ length: blankRows })
        .map(
          () => `
            <tr class="data-row">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td class="r">-</td>
              <td class="r">-</td>
            </tr>
          `,
        )
        .join("");

      const preferredRows = list
        .map((item, idx) => {
          const stockNo = item.stock_no || String(idx + 1);
          return `
            <tr class="data-row">
              <td class="c">${escapeHtml(stockNo)}</td>
              <td>${escapeHtml(item.item_description)}</td>
              <td>${escapeHtml(item.preferred_brand ?? "")}</td>
            </tr>
          `;
        })
        .join("");
      const preferredEmpty = Array.from({
        length: Math.max(0, MIN_ROWS - list.length),
      })
        .map(
          () => `
            <tr class="data-row">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
        )
        .join("");

      const commonHeader = `
        <div class="pr-header">
          <img src="${baseUrl}/assets/header.jpg" alt="Purchase request header" />
        </div>
        <div class="pr-title">PURCHASE REQUEST</div>
      `;

      const infoBlock = `
        <table class="info">
          <tr>
            <td class="label dept-row">Department/ Section:</td>
            <td class="value dept-row">${escapeHtml(departmentSection)}</td>
            <td class="label pr-box" rowspan="2">PR No:<br /><br /><br />Responsibility Center Code:</td>
            <td class="value value-strong">${escapeHtml(prNo)}</td>
            <td class="label value-inline" colspan="2">Date: <span class="value-strong">${escapeHtml(dateStr)}</span></td>
          </tr>
          <tr>
            <td class="label">Fund Source:</td>
            <td class="value">${escapeHtml(request.fund_source ?? "")}</td>
            <td class="value value-strong resp-row" colspan="3">${escapeHtml(
              responsibilityCenter,
            )}</td>
          </tr>
        </table>
      `;

      const purchasePage = `
        <div class="page">
          ${commonHeader}
          ${infoBlock}
          <div class="category">Category: ${escapeHtml(category)}</div>
          <table class="items">
            <thead>
              <tr>
                <th class="w-stock">Stock #</th>
                <th class="w-qty">Quantity</th>
                <th>Item Description</th>
                <th class="w-uom">UOM</th>
                <th class="w-unit">Unit Cost</th>
                <th class="w-total">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              ${emptyRows}
              <tr>
                <td colspan="4"></td>
                <td class="r bold">Grand Total</td>
                <td class="r bold">${grandTotal ? peso(grandTotal) : "-"}</td>
              </tr>
            </tbody>
          </table>
          <div class="purpose"><span>Purpose:</span> ${escapeHtml(
            request.purpose ?? "",
          )}</div>
          <table class="signatures">
            <tr>
              <td class="sig-label"></td>
              <td class="sig-title-cell">Requested by:</td>
              <td class="sig-title-cell">Reviewed by:</td>
            </tr>
            <tr>
              <td class="sig-label">Signature:</td>
              <td class="sig-field"></td>
              <td class="sig-field"></td>
            </tr>
            <tr>
              <td class="sig-label">Printed Name:</td>
              <td class="sig-field sig-name">${escapeHtml(requestedBy)}</td>
              <td class="sig-field sig-name">${escapeHtml(reviewedBy)}</td>
            </tr>
            <tr>
              <td class="sig-label">Designation:</td>
              <td class="sig-field"></td>
              <td class="sig-field"></td>
            </tr>
          </table>
          <div class="approval">
            <div>Approved by:</div>
            <div class="approval-name">EINGILBERT C. BENOLIRAO, Dev. Ed. D.</div>
            <div class="approval-role">Campus Director</div>
          </div>
          <div class="footer">
            <img src="${baseUrl}/assets/footer.jpg" alt="Purchase request footer" />
          </div>
        </div>
      `;

      const preferredPage = `
        <div class="page">
          ${commonHeader}
          ${infoBlock}
          <div class="category">Preferred Brand with Detailed Specification</div>
          <div class="category-sub">Category: ${escapeHtml(category)}</div>
          <table class="items">
            <thead>
              <tr>
                <th class="w-stock">Stock #</th>
                <th>Item Description</th>
                <th>Preferred Brand with Detailed Specification</th>
              </tr>
            </thead>
            <tbody>
              ${preferredRows}
              ${preferredEmpty}
            </tbody>
          </table>
          <div class="footer">
            <img src="${baseUrl}/assets/footer.jpg" alt="Purchase request footer" />
          </div>
        </div>
      `;

      return purchasePage + preferredPage;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Request</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      .no-print { display: none !important; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 10.5pt;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .toolbar {
      display: flex;
      justify-content: center;
      padding: 12px 0 4px;
      background: #f2f2f2;
    }
    .print-btn {
      padding: 8px 20px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }
    .page {
      background: #fff;
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 6mm 0 2mm;
    }
    .pr-header {
      border-bottom: 1px solid #000;
      padding: 4px 0 6px;
      display: flex;
      justify-content: center;
    }
    .pr-header img {
      width: 100%;
      max-width: 760px;
      max-height: 80px;
      height: auto;
      object-fit: contain;
    }
    .pr-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 4px;
      border-top: 1px solid #000;
      padding: 4px 0 5px;
      text-transform: uppercase;
    }
    .info {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10.5px;
    }
    .info td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .info .dept-row {
      padding-top: 8px;
      padding-bottom: 10px;
    }
    .info .resp-row {
      padding-top: 8px;
      padding-bottom: 10px;
    }
    .info .label { font-weight: 700; width: 120px; }
    .info .value { font-weight: 600; }
    .info .value-strong { font-weight: 700; }
    .info .pr-box { width: 120px; }
    .info .value-inline { width: 200px; }
    .category {
      font-weight: 700;
      margin-top: 8px;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .category-sub {
      font-weight: 700;
      margin-top: 4px;
    }
    .items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 11px;
    }
    .items th, .items td { border: 1px solid #000; padding: 4px 6px; }
    .items th { background: #fff; font-weight: 700; }
    .items .c { text-align: center; }
    .items .r { text-align: right; }
    .items .w-stock { width: 70px; }
    .items .w-qty { width: 70px; }
    .items .w-uom { width: 100px; }
    .items .w-unit { width: 120px; }
    .items .w-total { width: 130px; }
    .items .bold { font-weight: 800; }
    .data-row { height: 26px; }
    .purpose {
      border: 1px solid #000;
      border-top: none;
      padding: 6px;
      font-style: italic;
      font-size: 12px;
    }
    .purpose span { font-weight: 700; font-style: normal; }
    .signatures {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      border: 1px solid #000;
    }
    .signatures td {
      border: none;
      padding: 4px 8px;
      vertical-align: middle;
      text-align: left;
    }
    .sig-label {
      width: 140px;
      font-size: 12px;
      font-weight: 600;
      border-right: 1px solid #000;
    }
    .sig-title-cell {
      font-size: 12px;
      font-weight: 700;
      text-align: left;
    }
    .sig-title-cell + .sig-title-cell {
      border-left: 1px solid #000;
    }
    .sig-field { height: 24px; }
    .sig-field + .sig-field { border-left: 1px solid #000; }
    .signatures tr td:first-child { border-right: 1px solid #000; }
    .sig-name {
      font-weight: 700;
      text-transform: uppercase;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-thickness: 1px;
    }
    .signatures td.sig-name {
      text-align: center;
    }
    .approval {
      border: 1px solid #000;
      border-top: none;
      text-align: center;
      padding: 10px;
      font-size: 14px;
    }
    .approval-name {
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 6px;
      border-bottom: 2px solid #000;
      display: inline-block;
      padding: 0 6px 2px;
    }
    .approval-role { margin-top: 4px; font-size: 13px; }
    .footer {
      border: 1px solid #000;
      border-top: none;
      padding: 6px 10px 6px;
      display: flex;
      justify-content: center;
    }
    .footer img {
      width: 100%;
      max-width: 760px;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${pages || ""}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
