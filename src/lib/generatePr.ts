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

const MIN_ROWS = 13;

/**
 * Opens a new window with a printable Purchase Request document
 * matching the official CTU Argao Campus PR form.
 */
export function generatePrDocument(request: RequestRow) {
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
  const departmentSection = request.college?.name ?? "";
  const responsibilityCenter = request.college?.code ?? "";
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
          <div class="logo left">
            <img src="${baseUrl}/assets/pr-logo-left.svg" alt="Left logo" />
          </div>
          <div class="header-text">
            <div class="tiny">Republic of the Philippines</div>
            <div class="school">CEBU TECHNOLOGICAL UNIVERSITY</div>
            <div class="campus">ARGAO CAMPUS</div>
            <div class="tiny">Ed Kintanar Street, Lamacan, Argao, Cebu</div>
            <div class="tiny">Website: http://www.argao.ctu.edu.ph &nbsp; E-mail: ctuargao@ctu.edu.ph</div>
            <div class="tiny">Phone No.: (032) 401-0737 local 1700</div>
          </div>
          <div class="logo right">
            <img src="${baseUrl}/assets/pr-logo-right.svg" alt="Right logo" />
          </div>
        </div>
        <div class="pr-title">PURCHASE REQUEST</div>
      `;

      const infoBlock = `
        <table class="info">
          <tr>
            <td class="label">Department/ Section:</td>
            <td class="value">${escapeHtml(departmentSection)}</td>
            <td class="label">PR No:</td>
            <td class="value handwriting">${escapeHtml(prNo)}</td>
            <td class="label">Date:</td>
            <td class="value handwriting">${escapeHtml(dateStr)}</td>
          </tr>
          <tr>
            <td class="label">Fund Source:</td>
            <td class="value">${escapeHtml(request.fund_source ?? "")}</td>
            <td class="label" colspan="2">Responsibility Center Code:</td>
            <td class="value" colspan="2">${escapeHtml(
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
              <td>
                <div class="sig-title">Requested by:</div>
                <div class="sig-line">${escapeHtml(requestedBy)}</div>
                <div class="sig-role">Signature / Printed Name / Designation</div>
              </td>
              <td>
                <div class="sig-title">Reviewed by:</div>
                <div class="sig-line">${escapeHtml(reviewedBy)}</div>
                <div class="sig-role">Signature / Printed Name / Designation</div>
              </td>
            </tr>
          </table>
          <div class="approval">
            <div>Approved by:</div>
            <div class="approval-name">EINGILBERT C. BENOLIRAO, Dev. Ed. D.</div>
            <div class="approval-role">Campus Director</div>
          </div>
          <div class="footer">
            <img src="${baseUrl}/assets/pr-footer-logos.svg" alt="Accreditation logos" />
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
            <img src="${baseUrl}/assets/pr-footer-logos.svg" alt="Accreditation logos" />
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
      margin: 12mm 10mm;
    }
    @media print {
      .no-print { display: none !important; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
      background: #f2f2f2;
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
      width: 100%;
      max-width: 850px;
      margin: 0 auto 16px;
      padding: 12px 14px 18px;
      border: 2px solid #000;
    }
    .pr-header {
      display: grid;
      grid-template-columns: 90px 1fr 90px;
      gap: 12px;
      align-items: center;
      border-bottom: 2px solid #000;
      padding: 8px 0;
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 64px;
      width: 64px;
      margin: 0 auto;
    }
    .logo img {
      height: 64px;
      width: 64px;
      object-fit: contain;
    }
    .header-text { text-align: center; line-height: 1.1; }
    .header-text .tiny { font-size: 10px; }
    .header-text .school { font-size: 18px; font-weight: 800; }
    .header-text .campus { font-size: 12px; font-weight: 700; }
    .pr-title {
      text-align: center;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 4px;
      border-bottom: 2px solid #000;
      padding: 6px 0;
      text-transform: uppercase;
    }
    .info {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 11px;
    }
    .info td {
      border: 1px solid #000;
      padding: 4px 6px;
    }
    .info .label { font-weight: 700; width: 120px; }
    .info .value { font-weight: 600; }
    .info .handwriting { font-family: "Segoe Script", cursive; font-size: 14px; }
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
      font-size: 12px;
    }
    .items th, .items td { border: 1px solid #000; padding: 4px 6px; }
    .items th { background: #f5f5f5; font-weight: 700; }
    .items .c { text-align: center; }
    .items .r { text-align: right; }
    .items .w-stock { width: 70px; }
    .items .w-qty { width: 70px; }
    .items .w-uom { width: 100px; }
    .items .w-unit { width: 120px; }
    .items .w-total { width: 130px; }
    .items .bold { font-weight: 800; }
    .data-row { height: 32px; }
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
    }
    .signatures td {
      border: 1px solid #000;
      padding: 10px;
      vertical-align: top;
      text-align: center;
    }
    .sig-title { font-size: 14px; margin-bottom: 14px; }
    .sig-line {
      border-bottom: 2px solid #000;
      min-height: 24px;
      margin: 0 auto 6px;
      width: 70%;
      font-weight: 700;
      text-transform: uppercase;
    }
    .sig-role { font-size: 12px; }
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
      padding: 10px 12px 12px;
      display: flex;
      justify-content: center;
    }
    .footer img {
      width: 100%;
      max-width: 720px;
      height: auto;
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
