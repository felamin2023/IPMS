import React from "react";

type BudgetRow = {
  title: string;
  frequency: string;
  category: string;
  participants: number | string;
  duration: string;
  registrationFee: number;
  travellingExpenses: number;
  remarks?: string;
};

const TEMP_HEADER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="220" viewBox="0 0 1400 220">
      <rect width="100%" height="100%" fill="#ffffff" />
      <rect x="18" y="18" width="1364" height="184" rx="14" fill="#eef4ff" stroke="#bcd2ff" />
      <text x="700" y="92" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#111827">
        TEMPORARY HEADER IMAGE
      </text>
      <text x="700" y="142" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#475569">
        Replace this with your actual header image later
      </text>
    </svg>
  `);

const TEMP_FOOTER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="90" viewBox="0 0 1400 90">
      <rect width="100%" height="100%" fill="#ffffff" />
      <rect x="18" y="12" width="1364" height="66" rx="12" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="700" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111827">
        TEMPORARY FOOTER IMAGE
      </text>
    </svg>
  `);

const sampleRows: BudgetRow[] = [
  {
    title: "PIIE Convention",
    frequency: "Annual",
    category: "National",
    participants: 4,
    duration: "2 days",
    registrationFee: 40000,
    travellingExpenses: 30000,
    remarks: "70,000.00",
  },
  {
    title: "NRCP Convention",
    frequency: "Annual",
    category: "National",
    participants: 1,
    duration: "2 days",
    registrationFee: 5000,
    travellingExpenses: 10000,
    remarks: "15,000.00",
  },
  {
    title: "Departmental Trainings and WS",
    frequency: "Quarterly",
    category: "Local",
    participants: 10,
    duration: "3 days",
    registrationFee: 20000,
    travellingExpenses: 0,
    remarks: "20,000.00",
  },
];

const BLANK_ROW_COUNT = 7;

const currency = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => currency.format(value);

const totalRegistration = sampleRows.reduce(
  (sum, row) => sum + row.registrationFee,
  0,
);
const totalTravel = sampleRows.reduce(
  (sum, row) => sum + row.travellingExpenses,
  0,
);
const grandTotal = totalRegistration + totalTravel;

const pageStyles = `
  * {
    box-sizing: border-box;
  }

  .ld-budget-screen {
    min-height: 100vh;
    background: #e5e7eb;
    padding: 32px 16px;
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
  }

  .ld-budget-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 12px 35px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
  }

  .ld-budget-header img,
  .ld-budget-footer img {
    width: 100%;
    display: block;
  }

  .ld-budget-body {
    flex: 1;
    padding: 14mm 14mm 10mm;
  }

  .ld-budget-title-top {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.2px;
    margin: 4px 0 2px;
  }

  .ld-budget-title-main {
    text-align: center;
    font-size: 17px;
    font-weight: 700;
    margin: 0;
  }

  .ld-budget-title-bottom {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 10px;
  }

  .ld-budget-total-budget {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    margin: 8px 0 10px;
  }

  .ld-budget-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 11px;
  }

  .ld-budget-table th,
  .ld-budget-table td {
    border: 1px solid #111827;
    padding: 6px 5px;
    vertical-align: middle;
  }

  .ld-budget-table th {
    text-align: center;
    font-weight: 700;
  }

  .ld-budget-table td {
    line-height: 1.25;
  }

  .left {
    text-align: left;
  }

  .center {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .nowrap {
    white-space: nowrap;
  }

  .blank-row td {
    height: 26px;
  }

  .ld-budget-notes {
    margin-top: 10px;
    font-size: 10px;
    line-height: 1.35;
  }

  .ld-budget-notes-title {
    font-weight: 700;
    margin-bottom: 4px;
  }

  .ld-budget-signatories {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    align-items: end;
  }

  .ld-budget-signatory-label {
    font-size: 10px;
    margin-bottom: 18px;
  }

  .ld-budget-signatory-name {
    border-top: none;
    border-bottom: 1px solid #111827;
    padding-top: 0;
    padding-bottom: 2px;
    text-align: center;
    font-size: 11px;
    line-height: 1.15;
    font-weight: 700;
    text-transform: uppercase;
    min-height: 0;
  }

  .ld-budget-signatory-role {
    text-align: center;
    font-size: 10px;
    margin-top: 2px;
  }

  @media (max-width: 900px) {
    .ld-budget-screen {
      padding: 16px 8px;
      overflow-x: auto;
    }

    .ld-budget-page {
      width: 1200px;
      min-width: 1200px;
    }
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }

    .ld-budget-screen {
      background: #ffffff;
      padding: 0;
    }

    .ld-budget-page {
      box-shadow: none;
      margin: 0;
    }
  }
`;

export default function LearningDevelopmentBudgetTemplate() {
  return (
    <>
      <style>{pageStyles}</style>

      <div className="ld-budget-screen">
        <div className="ld-budget-page">
          <div className="ld-budget-header">
            <img src={TEMP_HEADER_IMAGE} alt="Temporary header" />
          </div>

          <div className="ld-budget-body">
            <h2 className="ld-budget-title-top">
              INDUSTRIAL ENGINEERING DEPARTMENT
            </h2>
            <h1 className="ld-budget-title-main">
              BUDGET PROPOSAL FOR LEARNING AND DEVELOPMENT (L &amp; D)
              ACTIVITIES CY 2026
            </h1>
            <div className="ld-budget-total-budget">TOTAL L &amp; D BUDGET</div>

            <table className="ld-budget-table">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>TITLE OF L &amp; D</th>
                  <th>
                    FREQUENCY
                    <br />
                    (ANNUAL, SEMI-ANNUAL, QUARTERLY)
                  </th>
                  <th>
                    CATEGORY
                    <br />
                    (International, National &amp; Regional/Local)
                  </th>
                  <th>
                    EXPECTED
                    <br />
                    NUMBER OF
                    <br />
                    PARTICIPANTS
                  </th>
                  <th>DURATION</th>
                  <th>
                    REGISTRATION
                    <br />
                    FEES
                  </th>
                  <th>
                    TRAVELLING
                    <br />
                    EXPENSES
                    <br />
                    (Per Diem and Transportation)
                  </th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, index) => (
                  <tr key={`${row.title}-${index}`}>
                    <td className="left">{row.title}</td>
                    <td className="center">{row.frequency}</td>
                    <td className="center">{row.category}</td>
                    <td className="center">{row.participants}</td>
                    <td className="center nowrap">{row.duration}</td>
                    <td className="right">
                      {formatMoney(row.registrationFee)}
                    </td>
                    <td className="right">
                      {row.travellingExpenses === 0
                        ? "-"
                        : formatMoney(row.travellingExpenses)}
                    </td>
                    <td className="right">{row.remarks ?? "-"}</td>
                  </tr>
                ))}

                {Array.from({ length: BLANK_ROW_COUNT }).map((_, index) => (
                  <tr className="blank-row" key={`blank-${index}`}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}

                <tr>
                  <td className="right" colSpan={5}>
                    <strong>TOTAL</strong>
                  </td>
                  <td className="right">
                    <strong>{formatMoney(totalRegistration)}</strong>
                  </td>
                  <td className="right">
                    <strong>{formatMoney(totalTravel)}</strong>
                  </td>
                  <td className="right">
                    <strong>{formatMoney(grandTotal)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="ld-budget-signatories">
              <div>
                <div className="ld-budget-signatory-label">Prepared by:</div>
                <div className="ld-budget-signatory-name">
                  Mary Ellen C. Camarillo
                </div>
                <div className="ld-budget-signatory-role">End-User</div>
              </div>

              <div>
                <div className="ld-budget-signatory-label">
                  Recommending Approval:
                </div>
                <div className="ld-budget-signatory-name">
                  Dr. Helmer M. Banados
                </div>
                <div className="ld-budget-signatory-role">
                  Immediate Supervisor
                </div>
              </div>

              <div>
                <div className="ld-budget-signatory-label">
                  Certified Allotment Availability:
                </div>
                <div className="ld-budget-signatory-name">Bethany B. Uraca</div>
                <div className="ld-budget-signatory-role">
                  Admin. Officer IV (Budget Officer II)
                </div>
              </div>

              <div>
                <div className="ld-budget-signatory-label">APPROVED:</div>
                <div className="ld-budget-signatory-name">
                  Eingilbert C. Benolirao, Dev.Ed.D.
                </div>
                <div className="ld-budget-signatory-role">Campus Director</div>
              </div>
            </div>

            <div className="ld-budget-notes">
              <div className="ld-budget-notes-title">NOTE:</div>
              <div>Registration fee:</div>
              <div>
                Trainings/Seminars initiated by other Agencies
                2,800/day/participant
              </div>
              <div>
                Trainings/Seminars initiated by CTU 1,800/day/participant
              </div>
              <div>Trainings sponsored by Govt. Agencies no limit</div>
              <div style={{ marginTop: 6 }}>Travelling expenses:</div>
              <div>
                (1) Per diem (pls refer to E.O. 77 s. 2019) including lodging,
                meals and incidental expenses
              </div>
              <div>
                (2) Transportation: Actual rate based on customary mode of
                transportation
              </div>
            </div>
          </div>

          <div className="ld-budget-footer">
            <img src={TEMP_FOOTER_IMAGE} alt="Temporary footer" />
          </div>
        </div>
      </div>
    </>
  );
}
