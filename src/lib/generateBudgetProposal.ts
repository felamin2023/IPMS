const budgetProposalTemplateHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Budget Proposal PDF Design Template</title>
    <style>
      :root {
        --page-width: 8.5in;
        --page-height: 11in;
        --text: #111;
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
        color: var(--text);
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
        padding: 0.03in 0.4in 0.12in 0.4in;
        font-size: 9.8pt;
        line-height: 1.15;
      }
      .title {
        text-align: center;
        font-weight: 700;
        font-size: 16pt;
        margin: 0.03in 0 0.18in;
        letter-spacing: 0.2px;
      }
      .meta {
        margin: 0 0 0.24in 0;
      }
      .meta-row {
        display: flex;
        gap: 0.12in;
        margin: 0 0 0.04in 0;
        align-items: flex-start;
      }
      .meta-label {
        width: 1.28in;
        flex: 0 0 1.28in;
        font-size: 10.2pt;
      }
      .meta-value {
        font-size: 10.2pt;
        font-weight: 700;
      }
      .section-label {
        font-size: 10pt;
        margin: 0.12in 0 0.04in 0;
      }
      .section-head {
        font-size: 10pt;
        margin: 0.04in 0 0.06in 0;
        font-weight: 700;
      }
      .fund-head {
        font-size: 9.8pt;
        font-weight: 700;
        margin: 0.08in 0 0.03in 0.22in;
      }
      .subhead {
        font-size: 9.8pt;
        font-weight: 700;
        margin: 0.06in 0 0.03in 0.22in;
      }
      .row.indent-1 .label {
        font-weight: 700;
      }
      .appropriation-block .row.indent-1 .label {
        font-weight: 400;
      }
      .table-block {
        margin: 0 0 0.03in 0;
      }
      .appropriation-block .row {
        justify-content: flex-start;
      }
      .appropriation-block .row .label {
        flex: 0 0 4.9in;
      }
      .appropriation-block .row .amt {
        margin-left: 0.18in;
      }
      .appropriation-block .total-line .label {
        padding-left: 0.56in;
      }
      .appropriation-block .total-line .amt {
        border-top: none;
        padding-top: 0;
      }
      .row,
      .subtotal,
      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 0.12in;
        margin: 0 0 0.03in 0;
      }
      .row .label,
      .subtotal .label,
      .total-line .label {
        flex: 1;
        min-width: 0;
      }
      .row .amt,
      .subtotal .amt,
      .total-line .amt {
        width: 1.55in;
        flex: 0 0 1.55in;
        text-align: right;
        white-space: nowrap;
      }
      .indent-1 .label {
        padding-left: 0.34in;
      }
      .indent-2 .label {
        padding-left: 0.64in;
      }
      .indent-3 .label {
        padding-left: 0.95in;
      }
      .subtotal .label {
        padding-left: 0.95in;
      }
      .subtotal .amt,
      .total-line .amt {
        border-top: 1.8px solid #111;
        padding-top: 0.03in;
      }
      .subtotal .amt {
        border-bottom: 1.8px solid #111;
        padding-bottom: 0.03in;
      }
      .subtotal.subtotal-single-divider .amt {
        border-bottom: none;
      }
      .total-line {
        margin-top: 0.06in;
      }
      .total-line .label {
        padding-left: 0.3in;
      }
      em {
        font-style: italic;
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
      .row,
      .subtotal,
      .total-line,
      .table-block,
      .sign-block,
      .sign-panel {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .top-gap {
        margin-top: 0.16in;
      }
      .top-gap-sm {
        margin-top: 0.06in;
      }

      .sign-block {
        margin-top: 0.46in;
      }
      .sign-label {
        margin-bottom: 0.4in;
        font-size: 9.8pt;
      }
      .sign-name {
        width: 3.55in;
        text-align: center;
        font-weight: 700;
        text-transform: uppercase;
        border-top: none;
        border-bottom: 1.8px solid #111;
        padding-top: 0;
        padding-bottom: 0.04in;
        margin-left: 0.24in;
      }
      .sign-role {
        width: 3.55in;
        text-align: center;
        font-size: 9.2pt;
        margin-left: 0.24in;
      }
      .prepared-by {
        margin-top: 0.36in;
      }

      .page9-wrap {
        padding-top: 2in;
      }
      .sign-panel {
        margin-bottom: 0.95in;
      }
      .approved-space {
        margin-top: 0.65in;
      }

      @media print {
        body {
          background: #fff;
        }
        .viewer {
          padding: 0;
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
    <div class="viewer">
      <section class="page">
        <div class="header">
          <img
            src="/assets/header.jpg"
            alt="Header"
          />
        </div>
        <div class="content">
          <div class="title">BUDGET PROPOSAL FY 2026</div>

          <div class="meta">
            <div class="meta-row">
              <span class="meta-label">Department:</span
              ><span class="meta-value"
                >Bachelor of Science in Industrial Engineering</span
              >
            </div>
            <div class="meta-row">
              <span class="meta-label">College/Office:</span
              ><span class="meta-value"
                >College of Technology &amp; Engineering</span
              >
            </div>
            <div class="meta-row">
              <span class="meta-label">PAP/MFO:</span
              ><span class="meta-value">Operations</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Fund Cluster:</span
              ><span class="meta-value">Fund 164 (STF) -Tuition</span>
            </div>
          </div>

          <div class="section-label">
            Appropriation (based on ceiling by department/college/office)
          </div>
          <div class="table-block appropriation-block">
            <div class="row indent-1">
              <div class="label">Faculty and Staff Development</div>
              <div class="amt">120,069.77</div>
            </div>
            <div class="row indent-1">
              <div class="label">Curriculum Development</div>
              <div class="amt">-</div>
            </div>
            <div class="row indent-1">
              <div class="label">Student Development</div>
              <div class="amt">127,668.62</div>
            </div>
            <div class="row indent-1">
              <div class="label">Facilities Development</div>
              <div class="amt">100,000.00</div>
            </div>
            <div class="total-line">
              <div class="label">Total Appropriations Available</div>
              <div class="amt">347,738.39</div>
            </div>
          </div>

          <div class="section-label">Items of Expenditures</div>
          <div class="section-head">I. INSTRUCTION</div>

          <div class="fund-head">
            1.1. Faculty and Staff Development Fund (12.5%)
          </div>
          <div class="subhead">Personnel Services (PS):</div>
          <div class="subhead">
            Maintenance and Other Operating Expenses (MOOE):
          </div>
          <div class="subhead">Capital Outlay (CO):</div>
          <div class="total-line">
            <div class="label">Total Faculty and Staff Development Fund</div>
            <div class="amt"></div>
          </div>
          
        </div>
        <div class="footer">
          <img
            src="/assets/footer.jpg"
            alt="Footer"
          />
        </div>
      </section>

      <section class="page">
        <div class="header">
          <img
            src="/assets/header.jpg"
            alt="Header"
          />
        </div>
        <div class="content">
          

          <div class="fund-head top-gap">
            1.2. Curriculum Development Fund (12.5%)
          </div>
          <div class="subhead">Personnel Services (PS):</div>
          <div class="subhead">
            Maintenance and Other Operating Expenses (MOOE):
          </div>
          <div class="subhead">Capital Outlay (CO):</div>
          <div class="total-line">
            <div class="label">Total Curriculum Development Fund</div>
            <div class="amt"></div>
          </div>
          
        </div>
        <div class="footer">
          <img
            src="/assets/footer.jpg"
            alt="Footer"
          />
        </div>
      </section>

      <section class="page">
        <div class="header">
          <img
            src="/assets/header.jpg"
            alt="Header"
          />
        </div>
        <div class="content">
          

          <div class="fund-head top-gap">
            1.3. Student Development Fund (12.5%)
          </div>
          <div class="subhead">Personnel Services (PS):</div>
          <div class="subhead">
            Maintenance and Other Operating Expenses (MOOE):
          </div>
          <div class="subhead">Capital Outlay (CO):</div>
          <div class="total-line">
            <div class="label">Total Student Development Fund</div>
            <div class="amt"></div>
          </div>
          

          <div class="fund-head top-gap">
            1.4. Facilities Development Fund (12.5%)
          </div>
          <div class="subhead">Personnel Services (PS):</div>
          <div class="subhead">
            Maintenance and Other Operating Expenses (MOOE):
          </div>
          <div class="subhead">Capital Outlay (CO):</div>
          <div class="total-line">
            <div class="label">Total Facilities Development Fund</div>
            <div class="amt"></div>
          </div>

          <div class="total-line">
            <div class="label">TOTAL PROPOSED EXPENDITURES TUITION</div>
            <div class="amt">347,738.39</div>
          </div>
          <div class="total-line">
            <div class="label">BALANCE END (Appropriation less Expenditures)</div>
            <div class="amt">-</div>
          </div>
          

        </div>
        <div class="footer">
          <img
            src="/assets/footer.jpg"
            alt="Footer"
          />
        </div>
      </section>

      <section class="page">
        <div class="header">
          <img
            src="/assets/header.jpg"
            alt="Header"
          />
        </div>
        <div class="content">
          <div class="page9-wrap">
            <div class="sign-block prepared-by">
              <div class="sign-label">Prepared By:</div>
              <div class="sign-name"></div>
              <div class="sign-role"></div>
            </div>

            <div class="sign-panel">
              <div class="sign-label">Certified Allotment Availability:</div>
              <div class="sign-name"></div>
              <div class="sign-role"></div>
            </div>

            <div class="sign-panel approved-space">
              <div class="sign-label">APPROVED:</div>
              <div class="sign-name"></div>
              <div class="sign-role"></div>
            </div>
          </div>
        </div>
        <div class="footer">
          <img
            src="/assets/footer.jpg"
            alt="Footer"
          />
        </div>
      </section>
    </div>
  </body>
</html>
`;

import type { PpmpPlanRow } from "./requests";

type BudgetProposalContext = {
  collegeName: string;
  programName: string;
  preparedByName?: string;
  preparedByDesignation?: string;
  module2DataOverride?: unknown;
};

type BudgetItem = {
  description: string;
  amount: string;
};

type BudgetGroup = {
  title: string;
  items: BudgetItem[];
};

type FundSection = {
  ps: BudgetGroup[];
  mooe: BudgetGroup[];
  co: BudgetGroup[];
};

type Module2Data = {
  department: string;
  collegeOffice: string;
  papMfo: string;
  fundCluster: string;
  facultyStaffAmount: string;
  curriculumAmount: string;
  studentAmount: string;
  facilitiesAmount: string;
  facultyStaffFund: FundSection;
  curriculumFund: FundSection;
  studentFund: FundSection;
  facilitiesFund: FundSection;
  certifiedAllotmentName: string;
  certifiedAllotmentDesignation: string;
  approvedName: string;
  approvedDesignation: string;
};

type RuntimePayload = {
  meta: Record<string, string>;
  labelSeries: Record<string, string[]>;
  fundBlocks: Array<{
    totalLabel: string;
    totalAmount: string;
    sections: Array<{
      sectionLabel: string;
      subtotalLabel: string;
      subtotalAmount: string;
      rows: Array<{
        label: string;
        amount: string;
        indentClass: "indent-1" | "indent-2";
      }>;
    }>;
  }>;
};

const amountFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9&\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatAmount(value: number) {
  return value > 0 ? amountFormatter.format(value) : "-";
}

function emptyFundSection(): FundSection {
  return { ps: [], mooe: [], co: [] };
}

function toItem(raw: any): BudgetItem {
  return {
    description: String(raw?.description ?? raw?.title ?? "").trim(),
    amount: String(raw?.amount ?? "").trim(),
  };
}

function toGroup(raw: any): BudgetGroup {
  const items = Array.isArray(raw?.items) ? raw.items.map(toItem) : [];
  return {
    title: String(raw?.title ?? "").trim(),
    items,
  };
}

function toFundSection(raw: any): FundSection {
  return {
    ps: Array.isArray(raw?.ps) ? raw.ps.map(toGroup) : [],
    mooe: Array.isArray(raw?.mooe) ? raw.mooe.map(toGroup) : [],
    co: Array.isArray(raw?.co) ? raw.co.map(toGroup) : [],
  };
}

function normalizeModule2Data(raw: any): Module2Data {
  return {
    department: String(raw?.department ?? "").trim(),
    collegeOffice: String(
      raw?.collegeOffice ?? raw?.college_office ?? "",
    ).trim(),
    papMfo: String(raw?.papMfo ?? raw?.pap_mfo ?? "").trim(),
    fundCluster: String(raw?.fundCluster ?? raw?.fund_cluster ?? "").trim(),
    facultyStaffAmount: String(
      raw?.facultyStaffAmount ?? raw?.faculty_staff_amount ?? "",
    ).trim(),
    curriculumAmount: String(
      raw?.curriculumAmount ?? raw?.curriculum_amount ?? "",
    ).trim(),
    studentAmount: String(
      raw?.studentAmount ?? raw?.student_amount ?? "",
    ).trim(),
    facilitiesAmount: String(
      raw?.facilitiesAmount ?? raw?.facilities_amount ?? "",
    ).trim(),
    facultyStaffFund: toFundSection(
      raw?.facultyStaffFund ?? raw?.faculty_staff_fund,
    ),
    curriculumFund: toFundSection(raw?.curriculumFund ?? raw?.curriculum_fund),
    studentFund: toFundSection(raw?.studentFund ?? raw?.student_fund),
    facilitiesFund: toFundSection(raw?.facilitiesFund ?? raw?.facilities_fund),
    certifiedAllotmentName: String(
      raw?.certifiedAllotmentName ?? raw?.certified_allotment_name ?? "",
    ).trim(),
    certifiedAllotmentDesignation: String(
      raw?.certifiedAllotmentDesignation ??
        raw?.certified_allotment_designation ??
        "",
    ).trim(),
    approvedName: String(raw?.approvedName ?? raw?.approved_name ?? "").trim(),
    approvedDesignation: String(
      raw?.approvedDesignation ?? raw?.approved_designation ?? "",
    ).trim(),
  };
}

function sumGroup(group: BudgetGroup) {
  return group.items.reduce((sum, item) => sum + parseAmount(item.amount), 0);
}

function sumSection(section: FundSection["ps"]) {
  return section.reduce((sum, group) => sum + sumGroup(group), 0);
}

function buildFundMap(fund: FundSection) {
  const map = new Map<string, number>();

  const addValue = (label: string, amount: number) => {
    const key = normalizeLabel(label);
    map.set(key, (map.get(key) ?? 0) + amount);
  };

  const addGroupAndItems = (groups: BudgetGroup[]) => {
    groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.description) {
          addValue(item.description, parseAmount(item.amount));
        }
      });
    });
  };

  addGroupAndItems(fund.ps);
  addGroupAndItems(fund.mooe);
  addGroupAndItems(fund.co);

  return {
    rowMap: map,
    subPs: sumSection(fund.ps),
    subMooe: sumSection(fund.mooe),
    subCo: sumSection(fund.co),
    total: sumSection(fund.ps) + sumSection(fund.mooe) + sumSection(fund.co),
  };
}

function setSeriesValue(
  labelSeries: Record<string, string[]>,
  label: string,
  index: number,
  value: string,
) {
  const key = normalizeLabel(label);
  if (!labelSeries[key]) {
    labelSeries[key] = ["", "", "", ""];
  }
  labelSeries[key][index] = value;
}

function buildSectionRows(groups: BudgetGroup[], subtotalLabel: string) {
  const rows: Array<{
    label: string;
    amount: string;
    indentClass: "indent-1" | "indent-2";
  }> = [];

  groups.forEach((group) => {
    if (group.title) {
      rows.push({
        label: group.title,
        amount: "",
        indentClass: "indent-1",
      });
    }

    group.items.forEach((item) => {
      if (!item.description) return;
      rows.push({
        label: item.description,
        amount: formatAmount(parseAmount(item.amount)),
        indentClass: "indent-2",
      });
    });
  });

  return {
    sectionLabel: subtotalLabel.replace("sub-total ", ""),
    subtotalLabel,
    subtotalAmount: formatAmount(sumSection(groups)),
    rows,
  };
}

function buildRuntimePayload(
  plan: PpmpPlanRow,
  context: BudgetProposalContext,
): RuntimePayload {
  const module2 = normalizeModule2Data(
    context.module2DataOverride ?? plan.module2_data ?? {},
  );

  const fundDefs = [
    {
      fund: module2.facultyStaffFund || emptyFundSection(),
      totalLabel: "Total Faculty and Staff Development Fund",
    },
    {
      fund: module2.curriculumFund || emptyFundSection(),
      totalLabel: "Total Curriculum Development Fund",
    },
    {
      fund: module2.studentFund || emptyFundSection(),
      totalLabel: "Total Student Development Fund",
    },
    {
      fund: module2.facilitiesFund || emptyFundSection(),
      totalLabel: "Total Facilities Development Fund",
    },
  ];

  const labelSeries: Record<string, string[]> = {};
  fundDefs.forEach((def, idx) => {
    const computed = buildFundMap(def.fund);

    computed.rowMap.forEach((amount, label) => {
      setSeriesValue(labelSeries, label, idx, formatAmount(amount));
    });

    setSeriesValue(
      labelSeries,
      "sub-total PS",
      idx,
      formatAmount(computed.subPs),
    );
    setSeriesValue(
      labelSeries,
      "sub-total MOOE",
      idx,
      formatAmount(computed.subMooe),
    );
    setSeriesValue(
      labelSeries,
      "sub-total CO",
      idx,
      formatAmount(computed.subCo),
    );
    setSeriesValue(
      labelSeries,
      def.totalLabel,
      idx,
      formatAmount(computed.total),
    );
  });

  const fundComputed = fundDefs.map((def) => buildFundMap(def.fund));
  const fundBlocks = fundDefs.map((def, idx) => {
    const computed = fundComputed[idx];
    return {
      totalLabel: def.totalLabel,
      totalAmount: formatAmount(computed.total),
      sections: [
        buildSectionRows(def.fund.ps, "sub-total PS"),
        buildSectionRows(def.fund.mooe, "sub-total MOOE"),
        buildSectionRows(def.fund.co, "sub-total CO"),
      ],
    };
  });

  const totalAppropriations =
    parseAmount(module2.facultyStaffAmount) +
    parseAmount(module2.curriculumAmount) +
    parseAmount(module2.studentAmount) +
    parseAmount(module2.facilitiesAmount);

  const totalExpenditures = fundComputed.reduce(
    (sum, fund) => sum + fund.total,
    0,
  );

  const balanceEnd = totalAppropriations - totalExpenditures;

  return {
    meta: {
      department: module2.department,
      collegeOffice: module2.collegeOffice || context.collegeName,
      papMfo: module2.papMfo,
      fundCluster: module2.fundCluster,
      facultyStaffAmount: formatAmount(parseAmount(module2.facultyStaffAmount)),
      curriculumAmount: formatAmount(parseAmount(module2.curriculumAmount)),
      studentAmount: formatAmount(parseAmount(module2.studentAmount)),
      facilitiesAmount: formatAmount(parseAmount(module2.facilitiesAmount)),
      totalAppropriations: formatAmount(totalAppropriations),
      totalExpenditures: formatAmount(totalExpenditures),
      balanceEnd: formatAmount(balanceEnd),
      preparedByName: context.preparedByName ?? "",
      preparedByDesignation: context.preparedByDesignation ?? "",
      certifiedAllotmentName: module2.certifiedAllotmentName,
      certifiedAllotmentDesignation: module2.certifiedAllotmentDesignation,
      approvedName: module2.approvedName,
      approvedDesignation: module2.approvedDesignation,
      programName: context.programName,
    },
    labelSeries,
    fundBlocks,
  };
}

export function generateBudgetProposalDocument(
  plan: PpmpPlanRow,
  context: BudgetProposalContext,
) {
  const win = window.open("", "_blank");
  if (!win) return;

  const payload = buildRuntimePayload(plan, context);
  const payloadJson = JSON.stringify(payload).replace(/</g, "\\u003c");

  const runtimeOverrides = `
<style id="budget-proposal-runtime-overrides">
    body {
      padding-top: 56px;
    }

    .bp-toolbar {
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

    .bp-toolbar__actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .bp-toolbar__button {
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

    .bp-toolbar__button:hover {
      background: #111827;
    }

  .page {
    height: var(--page-height) !important;
    min-height: var(--page-height) !important;
    overflow: hidden !important;
  }

  .header img {
    margin-bottom: 0.12in !important;
  }

  @media print {
    body {
      padding-top: 0;
    }

    .bp-toolbar {
      display: none;
    }
  }
</style>
`;

  const rebalanceScript = `
<script>
  (function () {
    const payload = ${payloadJson};

    function injectToolbar() {
      if (document.querySelector('.bp-toolbar')) return;

      const toolbar = document.createElement('div');
      toolbar.className = 'bp-toolbar';

      const actions = document.createElement('div');
      actions.className = 'bp-toolbar__actions';

      const printBtn = document.createElement('button');
      printBtn.className = 'bp-toolbar__button';
      printBtn.type = 'button';
      printBtn.textContent = 'Print / Save PDF';
      printBtn.addEventListener('click', function () {
        window.print();
      });

      actions.appendChild(printBtn);
      toolbar.appendChild(actions);

      document.body.insertBefore(toolbar, document.body.firstChild);
    }

    function normalizeLabel(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9&\\- ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function applyMetaData() {
      const setMeta = function (label, value) {
        if (!value) return;
        const rows = Array.from(document.querySelectorAll('.meta-row'));
        const row = rows.find(function (item) {
          const metaLabel = item.querySelector('.meta-label');
          return metaLabel && normalizeLabel(metaLabel.textContent) === normalizeLabel(label);
        });
        if (!row) return;
        const metaValue = row.querySelector('.meta-value');
        if (metaValue) {
          metaValue.textContent = value;
        }
      };

      setMeta('Department', payload.meta.department);
      setMeta('College/Office', payload.meta.collegeOffice);
      setMeta('PAP/MFO', payload.meta.papMfo);
      setMeta('Fund Cluster', payload.meta.fundCluster);
    }

    function renderFundBlocks() {
      const createAmountRow = function (className, label, amount) {
        const row = document.createElement('div');
        row.className = className;

        const labelEl = document.createElement('div');
        labelEl.className = 'label';
        labelEl.textContent = label;

        const amtEl = document.createElement('div');
        amtEl.className = 'amt';
        amtEl.textContent = amount;

        row.appendChild(labelEl);
        row.appendChild(amtEl);
        return row;
      };

      const sectionLabels = {
        PS: 'Personnel Services (PS):',
        MOOE: 'Maintenance and Other Operating Expenses (MOOE):',
        CO: 'Capital Outlay (CO):',
      };

      const heads = Array.from(document.querySelectorAll('.fund-head'));
      if (!heads.length || !Array.isArray(payload.fundBlocks)) return;

      heads.forEach(function (head, fundIndex) {
        const block = payload.fundBlocks[fundIndex];
        if (!block) return;

        const parent = head.parentElement;
        if (!parent) return;

        const toRemove = [];
        let cursor = head.nextElementSibling;
        while (cursor) {
          if (
            cursor.classList.contains('fund-head') ||
            cursor.classList.contains('section-head') ||
            cursor.classList.contains('section-label') ||
            cursor.classList.contains('sign-block')
          ) {
            break;
          }
          toRemove.push(cursor);
          cursor = cursor.nextElementSibling;
        }

        toRemove.forEach(function (el) {
          parent.removeChild(el);
        });

        let insertBefore = cursor || null;
        block.sections.forEach(function (section) {
          const label = sectionLabels[section.sectionLabel] || section.sectionLabel + ':';
          const subhead = document.createElement('div');
          subhead.className = 'subhead';
          subhead.textContent = label;
          parent.insertBefore(subhead, insertBefore);

          (section.rows || []).forEach(function (row) {
            const className = 'row ' + row.indentClass;
            parent.insertBefore(createAmountRow(className, row.label, row.amount), insertBefore);
          });

          parent.insertBefore(
            createAmountRow('subtotal', section.subtotalLabel, section.subtotalAmount),
            insertBefore,
          );
        });

        parent.insertBefore(
          createAmountRow('total-line', block.totalLabel, block.totalAmount),
          insertBefore,
        );

        if (fundIndex === heads.length - 1) {
          parent.insertBefore(
            createAmountRow(
              'total-line',
              'TOTAL PROPOSED EXPENDITURES TUITION',
              payload.meta.totalExpenditures || '',
            ),
            insertBefore,
          );
          parent.insertBefore(
            createAmountRow(
              'total-line',
              'BALANCE END (Appropriation less Expenditures)',
              payload.meta.balanceEnd || '',
            ),
            insertBefore,
          );
        }
      });
    }

    function applyAmountRows() {
      const amountRows = Array.from(document.querySelectorAll('.row, .subtotal, .total-line'));
      const groupedByLabel = {};

      amountRows.forEach(function (row) {
        const labelEl = row.querySelector('.label');
        const amtEl = row.querySelector('.amt');
        if (!labelEl || !amtEl) return;

        const key = normalizeLabel(labelEl.textContent);
        if (!groupedByLabel[key]) {
          groupedByLabel[key] = [];
        }
        groupedByLabel[key].push(amtEl);
      });

      Object.keys(payload.labelSeries).forEach(function (labelKey) {
        const targets = groupedByLabel[labelKey];
        const series = payload.labelSeries[labelKey] || [];
        if (!targets || targets.length === 0) return;

        targets.forEach(function (amtEl, idx) {
          const value = series[idx];
          if (typeof value === 'string' && value.trim()) {
            amtEl.textContent = value;
          }
        });
      });

      const applySingle = function (label, value) {
        if (!value) return;
        const targets = groupedByLabel[normalizeLabel(label)] || [];
        if (targets[0]) {
          targets[0].textContent = value;
        }
      };

      applySingle('Faculty and Staff Development', payload.meta.facultyStaffAmount);
      applySingle('Curriculum Development', payload.meta.curriculumAmount);
      applySingle('Student Development', payload.meta.studentAmount);
      applySingle('Facilities Development', payload.meta.facilitiesAmount);
      applySingle('Total Appropriations Available', payload.meta.totalAppropriations);
    }

    function applySubtotalDividerRules() {
      const subtotals = Array.from(document.querySelectorAll('.subtotal'));

      subtotals.forEach(function (subtotal) {
        subtotal.classList.remove('subtotal-single-divider');

        const nextEl = subtotal.nextElementSibling;
        if (!nextEl || !nextEl.classList.contains('total-line')) return;

        const nextLabel = nextEl.querySelector('.label');
        const labelText = normalizeLabel(nextLabel ? nextLabel.textContent : '');
        if (labelText.indexOf('total') !== -1) {
          subtotal.classList.add('subtotal-single-divider');
        }
      });
    }

    function applySignatories() {
      const preparedBlock = document.querySelector('.page9-wrap .sign-block.prepared-by');
      const certifiedPanel = document.querySelector(
        '.page9-wrap .sign-panel:not(.approved-space)',
      );
      const approvedPanel = document.querySelector(
        '.page9-wrap .sign-panel.approved-space',
      );

      const preparedName = preparedBlock
        ? preparedBlock.querySelector('.sign-name')
        : null;
      const preparedRole = preparedBlock
        ? preparedBlock.querySelector('.sign-role')
        : null;
      const certifiedName = certifiedPanel
        ? certifiedPanel.querySelector('.sign-name')
        : null;
      const certifiedRole = certifiedPanel
        ? certifiedPanel.querySelector('.sign-role')
        : null;
      const approvedName = approvedPanel
        ? approvedPanel.querySelector('.sign-name')
        : null;
      const approvedRole = approvedPanel
        ? approvedPanel.querySelector('.sign-role')
        : null;

      if (preparedName && payload.meta.preparedByName) {
        preparedName.textContent = payload.meta.preparedByName;
      }
      if (preparedRole && payload.meta.preparedByDesignation) {
        preparedRole.textContent = payload.meta.preparedByDesignation;
      }

      if (certifiedName && payload.meta.certifiedAllotmentName) {
        certifiedName.textContent = payload.meta.certifiedAllotmentName;
      }
      if (certifiedRole && payload.meta.certifiedAllotmentDesignation) {
        certifiedRole.textContent = payload.meta.certifiedAllotmentDesignation;
      }

      if (approvedName && payload.meta.approvedName) {
        approvedName.textContent = payload.meta.approvedName;
      }
      if (approvedRole && payload.meta.approvedDesignation) {
        approvedRole.textContent = payload.meta.approvedDesignation;
      }
    }

    function paginateOverflow() {
      const pages = Array.from(document.querySelectorAll('.page'));
      if (pages.length < 2) return;

      const contents = pages
        .map(function (page) {
          return page.querySelector('.content');
        })
        .filter(Boolean);

      if (contents.length < 2) return;

      contents.forEach(function (content) {
        const wrappers = Array.from(content.children).filter(function (child) {
          return child.classList && child.classList.contains('page9-wrap');
        });

        wrappers.forEach(function (wrap) {
          while (wrap.firstElementChild) {
            content.insertBefore(wrap.firstElementChild, wrap);
          }
          content.removeChild(wrap);
        });
      });

      const getInsertAnchor = function (content) {
        return content.querySelector('.sign-block, .sign-panel');
      };

      const hasOverflow = function (content) {
        if (!content) return false;
        return content.scrollHeight - content.clientHeight > 1;
      };

      const isMovable = function (child) {
        return !!child;
      };

      const moveOverflowToNext = function (source, target) {
        let guard = 0;
        while (hasOverflow(source) && guard < 500) {
          const movableChildren = Array.from(source.children).filter(isMovable);

          const nodeToMove = movableChildren[movableChildren.length - 1];
          if (!nodeToMove) break;

          const anchor = getInsertAnchor(target);
          target.insertBefore(nodeToMove, anchor || null);
          guard += 1;
        }
      };

      const pullUpFromNext = function (target, source) {
        let guard = 0;
        while (guard < 500) {
          const firstMovable = Array.from(source.children).find(isMovable);
          if (!firstMovable) break;

          const originalNextSibling = firstMovable.nextSibling;
          const anchor = getInsertAnchor(target);
          target.insertBefore(firstMovable, anchor || null);

          if (hasOverflow(target)) {
            source.insertBefore(firstMovable, originalNextSibling);
            break;
          }

          guard += 1;
        }
      };

      for (let pass = 0; pass < contents.length; pass += 1) {
        for (let i = 0; i < contents.length - 1; i += 1) {
          pullUpFromNext(contents[i], contents[i + 1]);
        }

        for (let i = 0; i < contents.length - 1; i += 1) {
          moveOverflowToNext(contents[i], contents[i + 1]);
        }
      }

      const allPages = Array.from(document.querySelectorAll('.page'));
      allPages.forEach(function (page, idx) {
        if (idx === 0) return;
        const content = page.querySelector('.content');
        if (!content) return;
        const hasRealContent = Array.from(content.children).some(function (child) {
          return !(child.classList && child.classList.contains('page9-wrap'));
        });
        if (!hasRealContent) {
          page.parentNode && page.parentNode.removeChild(page);
        }
      });
    }

    function waitForImages() {
      const images = Array.from(document.images || []);
      if (!images.length) return Promise.resolve();

      return Promise.all(
        images.map(function (img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function (resolve) {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          });
        }),
      );
    }

    function runPagination() {
      waitForImages().then(function () {
        paginateOverflow();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        injectToolbar();
        applyMetaData();
        renderFundBlocks();
        applyAmountRows();
        applySubtotalDividerRules();
        applySignatories();
        runPagination();
      });
    } else {
      injectToolbar();
      applyMetaData();
      renderFundBlocks();
      applyAmountRows();
      applySubtotalDividerRules();
      applySignatories();
      runPagination();
    }
  })();
</script>
`;

  const htmlWithOverrides = budgetProposalTemplateHtml
    .replace("</head>", runtimeOverrides + "\n</head>")
    .replace("</body>", rebalanceScript + "\n</body>");

  win.document.open();
  win.document.write(htmlWithOverrides);
  win.document.close();
}
