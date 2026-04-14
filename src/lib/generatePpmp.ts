// src/lib/generatePpmp.ts
import type { PpmpPlanRow } from "./requests";

function num(n: number) {
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

type PpmpPrintContext = {
  collegeName: string;
  programName: string;
  unitName?: string;
  chargedTo?: string;
  paps?: string;
  preparedBy?: string;
  preparedByTitle?: string;
  certifiedBy?: string;
  certifiedByTitle?: string;
  approvedBy?: string;
  approvedByTitle?: string;
  datePrepared?: string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "April",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

const PART_1_TITLE = "PART I. AVAILABLE AT PS-DBM (MAIN WAREHOUSE AND DEPOTS)";
const PART_2_TITLE =
  "PART II. OTHER ITEMS NOT AVAILABLE AT PS-DBM BUT ARE REGULARLY PURCHASED FROM OTHER SOURCES (Note: Please indicate price of items)";

const PART_1_CATEGORIES = new Set([
  "PESTICIDES OR PEST REPELLENTS",
  "PERFUMES OR COLOGNES OR FRAGRANCES",
  "ALCOHOL OR ACETONE BASED ANTISEPTICS",
  "COLOR COMPOUNDS AND DISPERSIONS",
  "FILMS",
  "PAPER MATERIALS AND PRODUCTS",
  "BATTERIES AND CELLS AND ACCESSORIES",
  "MANUFACTURING COMPONENTS AND SUPPLIES",
  "HEATING AND VENTILATION AND AIR CIRCULATION",
  "MEDICAL THERMOMETERS AND ACCESSORIES",
  "LIGHTING AND FIXTURES AND ACCESSORIES",
  "MEASURING AND OBSERVING AND TESTING EQUIPMENT",
  "CLEANING EQUIPMENT AND SUPPLIES",
  "INFORMATION AND COMMUNICATION TECHNOLOGY (ICT) EQUIPMENT AND DEVICES AND ACCESSORIES",
  "OFFICE EQUIPMENT AND ACCESSORIES AND SUPPLIES",
  "PRINTER OR FACSIMILE OR PHOTOCOPIER SUPPLIES",
  "AUDIO AND VISUAL EQUIPMENT AND SUPPLIES",
  "FLAG OR ACCESSORIES",
  "PRINTED PUBLICATIONS",
  "FIRE FIGHTING EQUIPMENT",
  "CONSUMER ELECTRONICS",
  "FURNITURE AND FURNISHINGS",
  "ARTS AND CRAFTS EQUIPMENT AND ACCESSORIES AND SUPPLIES",
  "FACE MASK",
  "SOFTWARE",
]);

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

function pushToMap<T>(map: Map<string, T[]>, key: string, value: T) {
  const existing = map.get(key) ?? [];
  existing.push(value);
  map.set(key, existing);
}

export function generatePpmpDocument(
  plan: PpmpPlanRow,
  context: PpmpPrintContext,
) {
  const baseUrl = window.location.origin;
  const items = plan.items ?? [];

  const part1Map = new Map<string, typeof items>();
  const part2Map = new Map<string, typeof items>();

  for (const item of items) {
    const rawCategory = (item.category || "UNCATEGORIZED").trim();
    const normalized = normalizeCategory(rawCategory);

    if (PART_1_CATEGORIES.has(normalized)) {
      pushToMap(part1Map, rawCategory, item);
    } else {
      // fallback to Part II so nothing gets lost
      pushToMap(part2Map, rawCategory, item);
    }
  }

  const renderSection = (
    title: string,
    categoryMap: Map<string, typeof items>,
  ) => {
    if (categoryMap.size === 0) return "";

    let html = `
      <tr class="section-row">
        <td colspan="17">${escapeHtml(title)}</td>
      </tr>
    `;

    for (const [category, list] of categoryMap.entries()) {
      html += `
        <tr class="category-row">
          <td colspan="17">${escapeHtml(category)}</td>
        </tr>
      `;

      html += list
        .map((item) => {
          const qty = Number(item.qty ?? 0);
          const unitPrice = Number(item.unit_price ?? 0);
          const estBudget = qty * unitPrice;

          return `
            <tr>
              <td class="item-col">${escapeHtml(item.item_description)}</td>
              <td class="qty-col">${qty ? qty.toFixed(2) : "0.00"} ${escapeHtml(item.uom ?? "")}</td>
              <td class="budget-col">${estBudget ? num(estBudget) : "-"}</td>
              <td class="mode-col"></td>
              ${MONTHS.map(() => `<td class="month-col"></td>`).join("")}
              <td class="price-col">${unitPrice ? num(unitPrice) : "-"}</td>
            </tr>
          `;
        })
        .join("");
    }

    return html;
  };

  const rows =
    renderSection(PART_1_TITLE, part1Map) +
    renderSection(PART_2_TITLE, part2Map);

  const totalBudget = items.reduce((sum, item) => {
    const qty = Number(item.qty ?? 0);
    const unitPrice = Number(item.unit_price ?? 0);
    return sum + qty * unitPrice;
  }, 0);

  const title = "PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP)";
  const year = plan.created_at
    ? new Date(plan.created_at).getFullYear()
    : new Date().getFullYear();

  const endUserUnit =
    context.unitName?.trim() ||
    context.collegeName?.trim() ||
    context.programName?.trim() ||
    "";

  const datePrepared =
    context.datePrepared ||
    new Date(plan.created_at || Date.now()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} ${year}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 4mm;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      .no-print {
        display: none !important;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #111;
      margin: 0;
      background: white;
    }

    .toolbar {
      padding: 10px 12px 0;
      display: flex;
      justify-content: center;
    }

    .print-btn {
      display: inline-block;
      padding: 8px 18px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: Arial, Helvetica, sans-serif;
    }

    .print-btn:hover {
      background: #1d4ed8;
    }

    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      min-height: 202mm;
      padding: 2px 4px;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      width: 100%;
    }

    .doc-header-image {
      border: none;
      padding: 2px 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
    }

    .doc-header-image img {
      width: 100%;
      max-width: 920px;
      max-height: 88px;
      height: auto;
      object-fit: contain;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    col.col-item   { width: 30%; }
    col.col-qty    { width: 8%; }
    col.col-budget { width: 8%; }
    col.col-mode   { width: 6%; }
    col.col-month  { width: 3.5%; }
    col.col-price  { width: 6%; }

    th, td {
      border: 1px solid #222;
      padding: 3px 4px;
      vertical-align: top;
    }

    th {
      background: #efb183;
      text-align: center;
      font-weight: 700;
    }

    .title-row th {
      background: #fff;
      font-size: 12pt;
      text-align: center;
      padding: 4px 6px;
    }

    .meta-row td {
      background: #fff;
      font-size: 8.8pt;
      line-height: 1.25;
      padding: 6px 6px 8px;
    }

    .meta-row strong {
      font-weight: 700;
    }

    .section-row td {
      background: #f7df84;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.8pt;
    }

    .category-row td {
      background: #9db8e1;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.8pt;
    }

    .item-col {
      word-break: break-word;
      white-space: normal;
    }

    .qty-col,
    .budget-col,
    .mode-col,
    .month-col,
    .price-col {
      text-align: center;
      white-space: nowrap;
      font-size: 8.2pt;
    }

    .budget-col,
    .price-col {
      text-align: right;
    }

    .total-row td {
      font-weight: 700;
      font-size: 9pt;
    }

    .note-row td {
      border: none;
      padding: 8px 2px 10px;
      font-style: italic;
      font-size: 8.5pt;
    }

    .signatures {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .signatures td {
      border: none;
      text-align: center;
      vertical-align: top;
      padding: 8px 10px 0;
    }

    .sig-label {
      font-size: 8.8pt;
      margin-bottom: 18px;
    }

    .sig-name {
      display: inline-block;
      min-width: 220px;
      border-bottom: 2px solid #111;
      padding: 0 8px 2px;
      font-weight: 700;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .sig-title {
      margin-top: 2px;
      font-size: 8.8pt;
    }

    .date-prepared {
      margin-top: 10px;
      font-size: 8.8pt;
    }

    .doc-footer-image {
      border: none;
      padding: 2px 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
      margin-top: auto;
    }

    .doc-footer-image img {
      width: 100%;
      max-width: 920px;
      max-height: 52px;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="container">
    <div class="main-content">
      <div class="doc-header-image">
        <img src="${baseUrl}/assets/header.jpg" alt="PPMP header" />
      </div>

      <table>
        <colgroup>
          <col class="col-item" />
          <col class="col-qty" />
          <col class="col-budget" />
          <col class="col-mode" />
          ${MONTHS.map(() => `<col class="col-month" />`).join("")}
          <col class="col-price" />
        </colgroup>

        <thead>
          <tr class="title-row">
            <th colspan="17">${escapeHtml(title)} ${year}</th>
          </tr>

          <tr class="meta-row">
            <td colspan="17">
              <div><strong>End-User/Unit:</strong> ${escapeHtml(endUserUnit)}</div>
              <div><strong>Charged to:</strong> ${escapeHtml(context.chargedTo ?? "")}</div>
              <div><strong>Projects, Programs and Activities (PAPs)</strong>${context.paps ? ` ${escapeHtml(context.paps)}` : ""}</div>
            </td>
          </tr>

          <tr>
            <th rowspan="2">Item &amp; Specifications</th>
            <th rowspan="2">QUANTITY &amp; UNIT</th>
            <th rowspan="2">ESTIMATED BUDGET</th>
            <th rowspan="2">MODE OF PROCUREMENT</th>
            <th colspan="12">Monthly Quantity Requirement</th>
            <th rowspan="2">Unit Price</th>
          </tr>

          <tr>
            ${MONTHS.map((label) => `<th>${label}</th>`).join("")}
          </tr>
        </thead>

        <tbody>
          ${rows || `<tr><td colspan="17">No items listed.</td></tr>`}

          <tr class="total-row">
            <td colspan="2">TOTAL BUDGET:</td>
            <td class="budget-col">${totalBudget ? num(totalBudget) : "-"}</td>
            <td colspan="14"></td>
          </tr>

          <tr class="note-row">
            <td colspan="17">
              Note: Technical specifications for each item/project being proposed shall be submitted as part of the PPMP.
            </td>
          </tr>
        </tbody>
      </table>

      <table class="signatures">
        <tr>
          <td>
            <div class="sig-label">Prepared &amp; Submitted by:</div>
            <div class="sig-name">${escapeHtml(context.preparedBy ?? "")}</div>
            <div class="sig-title">${escapeHtml(context.preparedByTitle ?? "End-User")}</div>
          </td>

          <td>
            <div class="sig-label">Certified Fund Available:</div>
            <div class="sig-name">${escapeHtml(context.certifiedBy ?? "")}</div>
            <div class="sig-title">${escapeHtml(context.certifiedByTitle ?? "")}</div>
          </td>

          <td>
            <div class="sig-label">Approved:</div>
            <div class="sig-name">${escapeHtml(context.approvedBy ?? "")}</div>
            <div class="sig-title">${escapeHtml(context.approvedByTitle ?? "")}</div>
          </td>
        </tr>
      </table>

      <div class="date-prepared">
        <strong>Date Prepared:</strong> ${escapeHtml(datePrepared)}
      </div>
    </div>

    <div class="doc-footer-image">
      <img src="${baseUrl}/assets/footer.jpg" alt="PPMP footer" />
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
