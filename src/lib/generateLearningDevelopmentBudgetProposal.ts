import type { PpmpPlanRow } from "./requests";

export type LearningDevelopmentBudgetRow = {
  key?: number;
  title: string;
  frequency: string;
  category: string;
  expectedParticipants: string;
  duration: string;
  registrationFees: string;
  travellingExpenses: string;
  actualBudget: string;
  remarks: string;
};

export type LearningDevelopmentBudgetProposalContext = {
  collegeName: string;
  programName: string;
  departmentName?: string;
  preparedByName?: string;
  recommendingApprovalName?: string;
  certifiedAllotmentName?: string;
  certifiedAllotmentDesignation?: string;
  approvedName?: string;
  approvedDesignation?: string;
  rows?: LearningDevelopmentBudgetRow[];
};

const learningDevelopmentTemplateHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learning Development Budget Proposal</title>
    <style>
      :root {
        --page-width: 8.5in;
        --page-height: 11in;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
      }
      body {
        background: #2b2b2b;
        font-family: Arial, Helvetica, sans-serif;
      }
      .viewer {
        padding: 24px 0 40px;
      }
      .page {
        display: flex;
        flex-direction: column;
        position: relative;
        width: var(--page-width);
        min-height: var(--page-height);
        height: var(--page-height);
        background: #fff;
        margin: 0 auto 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }
      .header {
        flex: 0 0 auto;
        padding: 0.16in 0.34in 0 0.34in;
      }
      .header img {
        width: 100%;
        display: block;
      }
      .content {
        flex: 1 1 auto;
        min-height: 0;
        padding: 0 0.34in 0 0.34in;
      }
      .footer {
        flex: 0 0 auto;
        margin-top: auto;
        padding: 0 0.34in 0.16in 0.34in;
      }
      .footer img {
        width: 100%;
        display: block;
      }
      .doc-title {
        text-align: center;
        font-weight: 700;
        font-size: 14px;
        margin: 8px 0 2px;
      }
      .doc-subtitle {
        text-align: center;
        font-weight: 700;
        font-size: 12px;
        margin: 0 0 10px;
      }
      .ld-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 10px;
      }
      .ld-table th,
      .ld-table td {
        border: 1px solid #000;
        padding: 3px 4px;
        vertical-align: middle;
      }
      .ld-table thead th {
        text-align: center;
        font-weight: 700;
        font-size: 8px;
        line-height: 1.1;
      }
      .ld-table .cell-title {
        text-align: left;
      }
      .ld-table .cell-center {
        text-align: center;
      }
      .ld-table .cell-num {
        text-align: right;
        white-space: nowrap;
        font-size: 9px;
      }
      .ld-table .planned {
        background: #cfe7b5;
        font-weight: 700;
      }
      .ld-table .total-row td {
        font-weight: 700;
      }
      .ld-table .total-label {
        text-align: center;
      }
      .signatures {
        margin-top: 8px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        font-size: 10px;
      }
      .sig-block {
        text-align: center;
      }
      .sig-title {
        font-weight: 700;
        margin-bottom: 6px;
      }
      .sig-name {
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .sig-role {
        margin-top: 2px;
      }
      .notes {
        margin-top: 8px;
        font-size: 9px;
      }
      .notes-title {
        font-weight: 700;
        margin-bottom: 3px;
      }
      .notes-section {
        margin-top: 4px;
      }
      .notes-label {
        font-weight: 700;
        margin-bottom: 2px;
      }
      .notes-table {
        width: 45%;
        border-collapse: collapse;
        margin-top: 2px;
        margin-left: 8px;
      }
      .notes-table td {
        padding: 1px 0;
        vertical-align: top;
      }
      .notes-table td:first-child {
        padding-right: 10px;
      }
      .notes-table td:last-child {
        text-align: right;
        white-space: nowrap;
        width: 40%;
        padding-left: 6px;
      }
      .notes-indent {
        margin-left: 24px;
      }
      .notes-subline {
        margin-left: 36px;
      }
      .ld-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 10px 16px;
        background: rgba(17, 17, 17, 0.92);
        color: #fff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(4px);
      }
      .ld-toolbar__button {
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: #1f2937;
        color: #fff;
        padding: 10px 18px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        min-width: 180px;
        text-align: center;
      }
      .ld-toolbar__button:hover {
        background: #111827;
      }
      @media print {
        body {
          background: #fff;
        }
        .viewer {
          padding: 0;
        }
        .ld-toolbar {
          display: none;
        }
        .page {
          box-shadow: none;
          margin: 0;
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        @page {
          size: letter;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="ld-toolbar">
      <button class="ld-toolbar__button" type="button" onclick="window.print()">
        Print / Save PDF
      </button>
    </div>
    <div class="viewer">
      <section class="page">
        <div class="header">
          <img src="{{HEADER_SRC}}" alt="Header" />
        </div>
        <div class="content">
          <div class="doc-title">{{DEPARTMENT_NAME}}</div>
          <div class="doc-subtitle">
            BUDGET PROPOSAL FOR LEARNING AND DEVELOPMENT (L &amp; D) ACTIVITIES CY 2026
          </div>
          <table class="ld-table">
            <thead>
              <tr>
                <th rowspan="2" style="width: 19%;">TITLE OF L &amp; D</th>
                <th rowspan="2" style="width: 10%;">FREQUENCY<br />(ANNUAL, SEMI-ANNUAL, QUARTERLY)</th>
                <th rowspan="2" style="width: 11%;">CATEGORY<br />(International, National &amp; Regional/Local)</th>
                <th rowspan="2" style="width: 10%;">EXPECTED NUMBER OF PARTICIPANTS</th>
                <th rowspan="2" style="width: 8%;">DURATION</th>
                <th rowspan="2" style="width: 9%;">REGISTRATION FEES</th>
                <th rowspan="2" style="width: 10%;">TRAVELLING EXPENSES (Per Diem and Transportation)</th>
                <th colspan="2" style="width: 14%;">TOTAL L &amp; D BUDGET</th>
                <th rowspan="2" style="width: 9%;">REMARKS</th>
              </tr>
              <tr>
                <th class="planned">PLANNED</th>
                <th>ACTUAL</th>
              </tr>
            </thead>
            <tbody>
              {{ROWS_HTML}}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="total-label" colspan="5">TOTAL</td>
                <td class="cell-num">{{TOTAL_REGISTRATION}}</td>
                <td class="cell-num">{{TOTAL_TRAVELLING}}</td>
                <td class="cell-num planned">{{TOTAL_PLANNED}}</td>
                <td class="cell-num">{{TOTAL_ACTUAL}}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-title">Prepared by:</div>
              <div class="sig-name">{{PREPARED_BY}}</div>
              <div class="sig-role">End-User</div>
            </div>
            <div class="sig-block">
              <div class="sig-title">Recommending Approval:</div>
              <div class="sig-name">{{RECOMMENDING_NAME}}</div>
              <div class="sig-role">Immediate Supervisor</div>
            </div>
            <div class="sig-block">
              <div class="sig-title">Certified Allotment Availability:</div>
              <div class="sig-name">{{CERTIFIED_NAME}}</div>
              <div class="sig-role">{{CERTIFIED_ROLE}}</div>
            </div>
            <div class="sig-block">
              <div class="sig-title">APPROVED:</div>
              <div class="sig-name">{{APPROVED_NAME}}</div>
              <div class="sig-role">{{APPROVED_ROLE}}</div>
            </div>
          </div>

          <div class="notes">
            <div class="notes-title">NOTE:</div>
            <div class="notes-section">
              <div class="notes-label">Registration fee:</div>
              <table class="notes-table">
                <tr>
                  <td>Trainings/Seminars initiated by other Agencies</td>
                  <td>2,800/day/participant</td>
                </tr>
                <tr>
                  <td>Trainings/Seminars initiated by CTU</td>
                  <td>1,800/day/participant</td>
                </tr>
                <tr>
                  <td>Trainings sponsored by Govt. Agencies</td>
                  <td>no limit</td>
                </tr>
              </table>
            </div>
            <div class="notes-section">
              <div class="notes-label">Travelling expenses:</div>
              <div class="notes-indent">(1) Per diem (pls refer to E.O. 77 s. 2019)</div>
              <div class="notes-subline">(including lodging, meals and incidental expenses)</div>
              <div class="notes-indent">
                (2) Transportation: Actual rate based on customary mode of transportation
              </div>
            </div>
          </div>
        </div>
        <div class="footer">
          <img src="{{FOOTER_SRC}}" alt="Footer" />
        </div>
      </section>
    </div>
  </body>
</html>
`;

export function generateLearningDevelopmentBudgetProposalDocument(
  _plan: PpmpPlanRow,
  context: LearningDevelopmentBudgetProposalContext,
) {
  const baseUrl = window.location.origin;
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const parseAmount = (value: string | undefined) => {
    if (!value) return null;
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const formatAmount = (value: number | null, blankIfZero = false) => {
    if (value == null) return "";
    if (blankIfZero && value === 0) return "";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isRowActive = (row: LearningDevelopmentBudgetRow) =>
    [
      row.title,
      row.frequency,
      row.category,
      row.expectedParticipants,
      row.duration,
      row.registrationFees,
      row.travellingExpenses,
      row.actualBudget,
      row.remarks,
    ].some((value) => value.trim());

  const activeRows = (context.rows ?? []).filter(isRowActive);
  const minRows = 10;
  const paddedRows = [...activeRows];
  while (paddedRows.length < minRows) {
    paddedRows.push({
      title: "",
      frequency: "",
      category: "",
      expectedParticipants: "",
      duration: "",
      registrationFees: "",
      travellingExpenses: "",
      actualBudget: "",
      remarks: "",
    });
  }

  let totalRegistration = 0;
  let totalTravelling = 0;
  let totalPlanned = 0;
  let totalActual = 0;

  const rowsHtml = paddedRows
    .map((row) => {
      const reg = parseAmount(row.registrationFees);
      const travel = parseAmount(row.travellingExpenses);
      const actual = parseAmount(row.actualBudget);
      const plannedValue = (reg ?? 0) + (travel ?? 0);
      const showPlannedDash = !isRowActive(row);

      if (reg != null) totalRegistration += reg;
      if (travel != null) totalTravelling += travel;
      if (plannedValue) totalPlanned += plannedValue;
      if (actual != null) totalActual += actual;

      const plannedDisplay = showPlannedDash
        ? "-"
        : formatAmount(plannedValue, true);

      return `
              <tr>
                <td class="cell-title">${escapeHtml(row.title)}</td>
                <td class="cell-center">${escapeHtml(row.frequency)}</td>
                <td class="cell-center">${escapeHtml(row.category)}</td>
                <td class="cell-center">${escapeHtml(row.expectedParticipants)}</td>
                <td class="cell-center">${escapeHtml(row.duration)}</td>
                <td class="cell-num">${formatAmount(reg, true)}</td>
                <td class="cell-num">${formatAmount(travel, true)}</td>
                <td class="cell-num planned">${plannedDisplay}</td>
                <td class="cell-num">${formatAmount(actual, true)}</td>
                <td>${escapeHtml(row.remarks)}</td>
              </tr>`;
    })
    .join("");

  const departmentTitle =
    context.departmentName?.trim() || context.programName || "";
  const preparedBy = context.preparedByName?.trim() ?? "";
  const recommendingName =
    context.recommendingApprovalName?.trim() ?? "DR. HELMER M. BANADOS";

  const html = learningDevelopmentTemplateHtml
    .replace("{{HEADER_SRC}}", `${baseUrl}/assets/header.jpg`)
    .replace("{{FOOTER_SRC}}", `${baseUrl}/assets/footer.jpg`)
    .replace("{{DEPARTMENT_NAME}}", escapeHtml(departmentTitle.toUpperCase()))
    .replace("{{ROWS_HTML}}", rowsHtml)
    .replace("{{TOTAL_REGISTRATION}}", formatAmount(totalRegistration, true))
    .replace("{{TOTAL_TRAVELLING}}", formatAmount(totalTravelling, true))
    .replace("{{TOTAL_PLANNED}}", formatAmount(totalPlanned, true))
    .replace(
      "{{TOTAL_ACTUAL}}",
      totalActual ? formatAmount(totalActual, true) : "",
    )
    .replace("{{PREPARED_BY}}", escapeHtml(preparedBy))
    .replace("{{RECOMMENDING_NAME}}", escapeHtml(recommendingName))
    .replace(
      "{{CERTIFIED_NAME}}",
      escapeHtml(context.certifiedAllotmentName ?? ""),
    )
    .replace(
      "{{CERTIFIED_ROLE}}",
      escapeHtml(context.certifiedAllotmentDesignation ?? ""),
    )
    .replace("{{APPROVED_NAME}}", escapeHtml(context.approvedName ?? ""))
    .replace(
      "{{APPROVED_ROLE}}",
      escapeHtml(context.approvedDesignation ?? ""),
    );

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
