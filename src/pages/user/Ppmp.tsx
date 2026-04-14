import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Save,
  Trash2,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  PencilLine,
  Eye,
  X,
  Download,
  FileText,
  BookOpen,
  GraduationCap,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  completePpmpPlan,
  createPpmpPlan,
  deletePpmpPlan,
  fetchPrograms,
  fetchCompletedRequestsForProgram,
  fetchUserPpmpPlans,
  fetchUserProfile,
  updatePpmpPlan,
  updatePpmpPlanExpiration,
  type PpmpPlanRow,
  type RequestItemUsageRow,
} from "../../lib/requests";
import { generatePpmpDocument } from "../../lib/generatePpmp";
import { generateBudgetProposalDocument } from "../../lib/generateBudgetProposal";
import { generateLearningDevelopmentBudgetProposalDocument } from "../../lib/generateLearningDevelopmentBudgetProposal.ts";
import ppmpCatalog from "../../lib/ppmpCatalog.json";

type PpmpItemRow = {
  key: number;
  category: string;
  itemDescription: string;
  qtyInput: string;
  qty: number;
  uom: string;
  unitPriceInput: string;
  unitPrice: number;
};

type PpmpItemSummary = {
  key: string;
  category: string;
  itemDescription: string;
  uom: string;
  ppmpQty: number;
  takenQty: number;
  remainingQty: number;
};

type BudgetItem = {
  key: number;
  description: string;
  amount: string;
};

type BudgetGroup = {
  key: number;
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

type Module2FundKey =
  | "facultyStaffFund"
  | "curriculumFund"
  | "studentFund"
  | "facilitiesFund";

type Module2SubsectionKey = keyof FundSection;

type Module2ItemOption = {
  label: string;
  amount: string;
};

type Module2GroupOption = {
  title: string;
  items: Module2ItemOption[];
};

const MODULE2_GROUP_OPTIONS: Record<
  Module2SubsectionKey,
  Module2GroupOption[]
> = {
  ps: [
    {
      title: "Other Compensation",
      items: [{ label: "Honoraria", amount: "0" }],
    },
  ],
  mooe: [
    {
      title: "Traveling Expenses",
      items: [
        {
          label: "Traveling Expenses - Local (see attached L & D Plan)",
          amount: "0",
        },
        { label: "Traveling Expenses - Foreign", amount: "0" },
      ],
    },
    {
      title: "Training and Scholarship Expenses",
      items: [
        { label: "Training Expenses (see attached L & D Plan)", amount: "0" },
      ],
    },
    {
      title: "Supplies and Materials Expenses",
      items: [
        { label: "Office Supplies Expenses", amount: "0" },
        { label: "Drugs and Medicines Expenses", amount: "0" },
        { label: "Medical, Dental and Laboratory Expenses", amount: "0" },
        { label: "Fuel, Oil and Lubricants Expense", amount: "0" },
        {
          label: "Semi-Expendable Machinery & Equipment Expenses",
          amount: "0",
        },
        { label: "Semi-Expendable Furniture, Fixture & Books", amount: "0" },
        { label: "Other Supplies and Materials Expenses", amount: "0" },
      ],
    },
    {
      title: "Utility Expenses",
      items: [
        { label: "Water Expenses (Purified Water w/ PPMP)", amount: "0" },
        { label: "Electricity Expenses", amount: "0" },
      ],
    },
    {
      title: "Communication Expenses",
      items: [
        { label: "Telephone Expenses - Mobile", amount: "0" },
        { label: "Telephone Expenses - Landline", amount: "0" },
        { label: "Internet Subscription Expenses", amount: "0" },
      ],
    },
    {
      title: "Awards/Rewards, Prizes and Indemnities",
      items: [{ label: "Awards/Rewards Expenses", amount: "0" }],
    },
    {
      title: "Professional Services",
      items: [{ label: "Other Professional Services", amount: "0" }],
    },
    {
      title: "General Services",
      items: [
        { label: "Janitorial Services", amount: "0" },
        { label: "Security Services", amount: "0" },
        {
          label: "Other General Services (see attached J.O. Assessment)",
          amount: "0",
        },
      ],
    },
    {
      title: "Repairs and Maintenance",
      items: [
        {
          label: "Repairs and Maintenance - Buildings and Other Structures",
          amount: "0",
        },
        {
          label: "Repairs and Maintenance - Machinery & Equipment",
          amount: "0",
        },
        { label: "Repairs and Maintenance - Motor Vehicles", amount: "0" },
        {
          label: "Repairs and Maintenance - Furniture & Fixtures",
          amount: "0",
        },
        {
          label:
            "Repairs and Maintenance - Semi-Expendable Machinery & Equipment",
          amount: "0",
        },
        {
          label:
            "Repairs and Maintenance - Semi-Expendable Furniture, Fixtures & Books",
          amount: "0",
        },
      ],
    },
    {
      title: "Taxes, Insurance Premiums and Other Fees",
      items: [
        { label: "Taxes, Duties and Licenses", amount: "0" },
        { label: "Fidelity Bond Premiums", amount: "0" },
        { label: "Insurance Expenses", amount: "0" },
      ],
    },
    {
      title: "Other Maintenance and Operating Expenses",
      items: [
        { label: "Printing and Publication Expenses", amount: "0" },
        {
          label: "Representation Expenses (Meals/Snacks w/ ppmp)",
          amount: "0",
        },
        { label: "Transportation and Delivery Expenses", amount: "0" },
        { label: "Rent Expenses - Motor Vehicles", amount: "0" },
        { label: "Rent Expenses - Equipment", amount: "0" },
      ],
    },
    {
      title: "Membership Dues and Contributions to Organizations",
      items: [
        {
          label: "Membership Dues and Contributions to Organizations",
          amount: "0",
        },
      ],
    },
    {
      title: "Subscription Expenses",
      items: [{ label: "Subscription Expenses", amount: "0" }],
    },
    {
      title: "Other Maintenance & Operating Expenses",
      items: [{ label: "Other Maintenance & Operating Expenses", amount: "0" }],
    },
  ],
  co: [
    {
      title: "Buildings and Other Structures",
      items: [
        { label: "Buildings", amount: "0" },
        { label: "School Buildings", amount: "0" },
        { label: "Other Structures", amount: "0" },
      ],
    },
    {
      title: "Machinery and Equipment",
      items: [
        { label: "Machinery", amount: "0" },
        { label: "Office Equipment", amount: "0" },
        {
          label: "Information and Communication Technology Equipment",
          amount: "0",
        },
        { label: "Printing Equipment", amount: "0" },
        { label: "Sports Equipment", amount: "0" },
        { label: "Technical and Scientific Equipment", amount: "0" },
        { label: "Other Machinery and Equipment", amount: "0" },
      ],
    },
    {
      title: "Transportation Equipment",
      items: [{ label: "Motor Vehicles", amount: "0" }],
    },
    {
      title: "Furniture, Fixtures and Books",
      items: [
        { label: "Furniture and Fixtures", amount: "0" },
        { label: "Books", amount: "0" },
      ],
    },
    {
      title: "Other Plant, Property and Equipment",
      items: [{ label: "Other Plant, Property and Equipment", amount: "0" }],
    },
  ],
};

const MODULE2_ITEM_AMOUNT_OVERRIDES: Record<
  Module2FundKey,
  Record<string, string>
> = {
  facultyStaffFund: {
    "Office Supplies Expenses": "15069.77",
  },
  curriculumFund: {},
  studentFund: {},
  facilitiesFund: {},
};

function getModule2GroupOptions(subsectionKey: Module2SubsectionKey) {
  return MODULE2_GROUP_OPTIONS[subsectionKey] ?? [];
}

function getModule2ItemOptions(
  fundKey: Module2FundKey,
  subsectionKey: Module2SubsectionKey,
  groupTitle: string,
) {
  const group = getModule2GroupOptions(subsectionKey).find(
    (entry) => entry.title === groupTitle,
  );

  if (!group) return [];

  const overrides = MODULE2_ITEM_AMOUNT_OVERRIDES[fundKey];
  return group.items.map((item) => ({
    label: item.label,
    amount: overrides[item.label] ?? item.amount,
  }));
}

function getRemainingModule2GroupOptions(
  section: FundSection,
  subsectionKey: Module2SubsectionKey,
) {
  const usedTitles = new Set(
    section[subsectionKey].map((group) => group.title.trim()).filter(Boolean),
  );

  return getModule2GroupOptions(subsectionKey).filter(
    (option) => !usedTitles.has(option.title),
  );
}

function getModule2GroupSelectOptions(
  section: FundSection,
  subsectionKey: Module2SubsectionKey,
  currentTitle: string,
) {
  const remainingOptions = getRemainingModule2GroupOptions(
    section,
    subsectionKey,
  );

  if (!currentTitle.trim()) {
    return remainingOptions;
  }

  const currentOption = getModule2GroupOptions(subsectionKey).find(
    (option) => option.title === currentTitle,
  );

  if (!currentOption) {
    return remainingOptions;
  }

  return [
    currentOption,
    ...remainingOptions.filter((option) => option.title !== currentTitle),
  ];
}

function getFilteredModule2ItemOptions(
  fundKey: Module2FundKey,
  subsectionKey: Module2SubsectionKey,
  group: BudgetGroup,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  const options = getModule2ItemOptions(fundKey, subsectionKey, group.title);
  if (!normalized) return options;
  return options.filter((option) =>
    option.label.toLowerCase().includes(normalized),
  );
}

function parseModule2Amount(value: string) {
  return Number(String(value ?? "").replace(/,/g, "")) || 0;
}

function sanitizeIntegerInput(value: string) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\D/g, "");
}

function sanitizeDecimalInput(value: string) {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) return cleaned;
  return (
    cleaned.slice(0, dotIndex + 1) +
    cleaned.slice(dotIndex + 1).replace(/\./g, "")
  );
}

function formatNumberInput(value: string, allowDecimal = false) {
  const cleaned = allowDecimal
    ? sanitizeDecimalInput(value)
    : sanitizeIntegerInput(value);
  if (!cleaned) return "";

  if (allowDecimal) {
    const [intPart, decimalPart] = cleaned.split(".");
    const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart === undefined
      ? formattedInt
      : `${formattedInt}.${decimalPart}`;
  }

  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type Module3Row = {
  key: number;
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

type PpmpPlanLocalMeta = {
  module2Data: Module2Data;
  module3Rows: Module3Row[];
};

type DownloadDocumentType =
  | "ppmp"
  | "budget_proposal"
  | "learning_development_budget_proposal";

type PpmpWizardDraft = {
  version: 2;
  programId: string;
  items: PpmpItemRow[];
  selectedCategories: string[];
  activeModule: 1 | 2 | 3;
  moduleProgress: {
    module1: boolean;
    module2: boolean;
    module3: boolean;
  };
  module2Data: Module2Data;
  module3Rows: Module3Row[];
  updatedAt: string;
};

type PpmpSubmissionStep = "module1" | "module2" | "module3";

let nextKey = 1;

function emptyItem(): PpmpItemRow {
  return {
    key: nextKey++,
    category: "",
    itemDescription: "",
    qtyInput: "1",
    qty: 1,
    uom: "",
    unitPriceInput: "0",
    unitPrice: 0,
  };
}

function emptyItemForCategory(category: string): PpmpItemRow {
  const row = emptyItem();
  return { ...row, category };
}

let budgetLineKey = 1;

function emptyBudgetItem(): BudgetItem {
  return {
    key: budgetLineKey++,
    description: "",
    amount: "",
  };
}

function emptyBudgetGroup(): BudgetGroup {
  return {
    key: budgetLineKey++,
    title: "",
    items: [emptyBudgetItem()],
  };
}

function emptyFundSection(): FundSection {
  return {
    ps: [emptyBudgetGroup()],
    mooe: [emptyBudgetGroup()],
    co: [emptyBudgetGroup()],
  };
}

function normalizeBudgetItem(item: any): BudgetItem {
  if (item && typeof item === "object" && "description" in item) {
    return {
      key: typeof item.key === "number" ? item.key : budgetLineKey++,
      description: String(item.description ?? ""),
      amount: String(item.amount ?? ""),
    };
  }

  if (item && typeof item === "object" && "title" in item) {
    return {
      key: typeof item.key === "number" ? item.key : budgetLineKey++,
      description: String(item.title ?? ""),
      amount: String(item.amount ?? ""),
    };
  }

  return emptyBudgetItem();
}

function normalizeBudgetGroup(group: any): BudgetGroup {
  if (group && typeof group === "object" && Array.isArray(group.items)) {
    return {
      key: typeof group.key === "number" ? group.key : budgetLineKey++,
      title: String(group.title ?? ""),
      items:
        group.items.length > 0
          ? group.items.map((item: any) => normalizeBudgetItem(item))
          : [emptyBudgetItem()],
    };
  }

  if (group && typeof group === "object" && "title" in group) {
    return {
      key: typeof group.key === "number" ? group.key : budgetLineKey++,
      title: String(group.title ?? ""),
      items: [
        {
          key: budgetLineKey++,
          description: String(group.title ?? ""),
          amount: String(group.amount ?? ""),
        },
      ],
    };
  }

  return emptyBudgetGroup();
}

function normalizeFundSection(section: any): FundSection {
  if (section && typeof section === "object") {
    return {
      ps: Array.isArray(section.ps)
        ? section.ps.map((group: any) => normalizeBudgetGroup(group))
        : [emptyBudgetGroup()],
      mooe: Array.isArray(section.mooe)
        ? section.mooe.map((group: any) => normalizeBudgetGroup(group))
        : [emptyBudgetGroup()],
      co: Array.isArray(section.co)
        ? section.co.map((group: any) => normalizeBudgetGroup(group))
        : [emptyBudgetGroup()],
    };
  }

  return emptyFundSection();
}

function normalizeModule2Data(raw: any): Module2Data {
  const defaultData = emptyModule2Data();
  if (!raw || typeof raw !== "object") {
    return defaultData;
  }

  return {
    department: String(raw.department ?? ""),
    collegeOffice: String(raw.collegeOffice ?? raw.college_office ?? ""),
    papMfo: String(raw.papMfo ?? raw.pap_mfo ?? ""),
    fundCluster: String(raw.fundCluster ?? raw.fund_cluster ?? ""),
    facultyStaffAmount: String(raw.facultyStaffAmount ?? ""),
    curriculumAmount: String(raw.curriculumAmount ?? ""),
    studentAmount: String(raw.studentAmount ?? ""),
    facilitiesAmount: String(raw.facilitiesAmount ?? ""),
    facultyStaffFund: normalizeFundSection(raw.facultyStaffFund),
    curriculumFund: normalizeFundSection(raw.curriculumFund),
    studentFund: normalizeFundSection(raw.studentFund),
    facilitiesFund: normalizeFundSection(raw.facilitiesFund),
    certifiedAllotmentName: String(raw.certifiedAllotmentName ?? ""),
    certifiedAllotmentDesignation: String(
      raw.certifiedAllotmentDesignation ?? "",
    ),
    approvedName: String(raw.approvedName ?? ""),
    approvedDesignation: String(raw.approvedDesignation ?? ""),
  };
}

function emptyModule2Data(): Module2Data {
  return {
    department: "",
    collegeOffice: "",
    papMfo: "",
    fundCluster: "",
    facultyStaffAmount: "",
    curriculumAmount: "",
    studentAmount: "",
    facilitiesAmount: "",
    facultyStaffFund: emptyFundSection(),
    curriculumFund: emptyFundSection(),
    studentFund: emptyFundSection(),
    facilitiesFund: emptyFundSection(),
    certifiedAllotmentName: "",
    certifiedAllotmentDesignation: "",
    approvedName: "",
    approvedDesignation: "",
  };
}

let module3RowKey = 1;

function emptyModule3Row(): Module3Row {
  return {
    key: module3RowKey++,
    title: "",
    frequency: "",
    category: "",
    expectedParticipants: "",
    duration: "",
    registrationFees: "",
    travellingExpenses: "",
    actualBudget: "",
    remarks: "",
  };
}

function normalizeModule3Row(raw: any): Module3Row {
  return {
    key:
      typeof raw?.key === "number" && Number.isFinite(raw.key)
        ? raw.key
        : module3RowKey++,
    title: String(raw?.title ?? ""),
    frequency: String(raw?.frequency ?? ""),
    category: String(raw?.category ?? ""),
    expectedParticipants: String(raw?.expectedParticipants ?? ""),
    duration: String(raw?.duration ?? ""),
    registrationFees: String(raw?.registrationFees ?? ""),
    travellingExpenses: String(raw?.travellingExpenses ?? ""),
    actualBudget: String(raw?.actualBudget ?? ""),
    remarks: String(raw?.remarks ?? ""),
  };
}

function normalizeModule3Rows(raw: any): Module3Row[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const rows = raw.map((row: any) => normalizeModule3Row(row));
    const maxKey = rows.reduce(
      (max, row) => (row.key > max ? row.key : max),
      0,
    );
    module3RowKey = Math.max(module3RowKey, maxKey + 1);
    return rows;
  }
  return [emptyModule3Row()];
}

function isExpired(plan: PpmpPlanRow) {
  if (!plan.expires_at) return false;
  return new Date(plan.expires_at).getTime() < Date.now();
}

function getPlanStatus(plan: PpmpPlanRow) {
  if (!plan.completed_at) return "Pending";
  return isExpired(plan) ? "Expired" : "Active";
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getPreparedByName(profile: any) {
  const firstName = String(profile?.first_name ?? "").trim();
  const lastName = String(profile?.last_name ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  return String(profile?.full_name ?? "").trim();
}

function makeItemKey(params: {
  category?: string | null;
  description?: string | null;
  uom?: string | null;
}) {
  return `${normalizeKey(params.category)}||${normalizeKey(
    params.description,
  )}||${normalizeKey(params.uom)}`;
}

function makePlanLocalMetaKey(planId: string) {
  return `ppmp_plan_meta_${planId}`;
}

function savePlanLocalMeta(planId: string, meta: PpmpPlanLocalMeta) {
  try {
    localStorage.setItem(makePlanLocalMetaKey(planId), JSON.stringify(meta));
  } catch (error) {
    console.error("Failed to save local PPMP module data", error);
  }
}

function loadPlanLocalMeta(planId: string): PpmpPlanLocalMeta | null {
  try {
    const raw = localStorage.getItem(makePlanLocalMetaKey(planId));
    if (!raw) return null;
    const parsed: any = JSON.parse(raw);
    return {
      module2Data: normalizeModule2Data(parsed?.module2Data),
      module3Rows: normalizeModule3Rows(parsed?.module3Rows),
    };
  } catch (error) {
    console.error("Failed to load local PPMP module data", error);
    return null;
  }
}

function removePlanLocalMeta(planId: string) {
  try {
    localStorage.removeItem(makePlanLocalMetaKey(planId));
  } catch (error) {
    console.error("Failed to remove local PPMP module data", error);
  }
}

export default function Ppmp() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [programOptions, setProgramOptions] = useState<any[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [items, setItems] = useState<PpmpItemRow[]>([emptyItem()]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pendingCategory, setPendingCategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState<PpmpPlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [planPendingDelete, setPlanPendingDelete] =
    useState<PpmpPlanRow | null>(null);
  const [planPendingExpirationEdit, setPlanPendingExpirationEdit] =
    useState<PpmpPlanRow | null>(null);
  const [planPendingDownload, setPlanPendingDownload] =
    useState<PpmpPlanRow | null>(null);

  const [completingPlan, setCompletingPlan] = useState<PpmpPlanRow | null>(
    null,
  );
  const [expirationInput, setExpirationInput] = useState("");

  const [viewPlan, setViewPlan] = useState<PpmpPlanRow | null>(null);
  const [viewModule, setViewModule] = useState<1 | 2 | 3>(1);
  const [viewFilter, setViewFilter] = useState<"remaining" | "taken" | "all">(
    "remaining",
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRows, setViewRows] = useState<PpmpItemSummary[]>([]);

  const [activeModule, setActiveModule] = useState<1 | 2 | 3>(1);
  const [moduleProgress, setModuleProgress] = useState({
    module1: false,
    module2: false,
    module3: false,
  });
  const [module2Data, setModule2Data] =
    useState<Module2Data>(emptyModule2Data());
  const [module2ValidationAttempted, setModule2ValidationAttempted] =
    useState(false);
  const [module3Rows, setModule3Rows] = useState<Module3Row[]>([
    emptyModule3Row(),
  ]);
  const [pendingSubmissionStep, setPendingSubmissionStep] =
    useState<PpmpSubmissionStep | null>(null);
  const [openItemDropdownKey, setOpenItemDropdownKey] = useState<number | null>(
    null,
  );
  const [openModule2DropdownKey, setOpenModule2DropdownKey] = useState<
    string | null
  >(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const collegeId = profile?.college_id ?? "";
  const collegeName = profile?.college
    ? `${profile.college.code} – ${profile.college.name}`
    : "";
  const draftStorageKey = user?.id ? `ppmp_wizard_draft_${user.id}` : "";

  function clearWizardDraft() {
    if (!draftStorageKey) return;
    localStorage.removeItem(draftStorageKey);
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then((data) => {
        setProfile(data);
        if (data?.program_id) {
          setProgramId((prev) => prev || data.program_id);
        }
      })
      .catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (!draftStorageKey) {
      setDraftHydrated(true);
      return;
    }

    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) {
        setDraftHydrated(true);
        return;
      }

      const parsed: any = JSON.parse(raw);
      if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) {
        setDraftHydrated(true);
        return;
      }

      const restoredItems = Array.isArray(parsed.items)
        ? parsed.items.map((item: any) => ({
            key:
              typeof item.key === "number" && Number.isFinite(item.key)
                ? item.key
                : nextKey++,
            category: item.category ?? "",
            itemDescription: item.itemDescription ?? "",
            qtyInput: item.qtyInput ?? "1",
            qty:
              typeof item.qty === "number" && Number.isFinite(item.qty)
                ? item.qty
                : 1,
            uom: item.uom ?? "",
            unitPriceInput: item.unitPriceInput ?? "0",
            unitPrice:
              typeof item.unitPrice === "number" &&
              Number.isFinite(item.unitPrice)
                ? item.unitPrice
                : 0,
          }))
        : [];

      if (restoredItems.length > 0) {
        const maxKey = restoredItems.reduce(
          (max: number, item: { key: number }) =>
            item.key > max ? item.key : max,
          0,
        );
        nextKey = Math.max(nextKey, maxKey + 1);
      }

      setProgramId(parsed.programId ?? "");
      setItems(restoredItems.length > 0 ? restoredItems : [emptyItem()]);
      setSelectedCategories(
        Array.isArray(parsed.selectedCategories)
          ? parsed.selectedCategories
          : [],
      );
      setActiveModule(parsed.activeModule ?? 1);
      setModuleProgress(
        parsed.moduleProgress ?? {
          module1: false,
          module2: false,
          module3: false,
        },
      );
      setModule2Data(normalizeModule2Data(parsed.module2Data));
      if (Array.isArray(parsed.module3Rows)) {
        setModule3Rows(normalizeModule3Rows(parsed.module3Rows));
      } else {
        const legacyTitle = String(parsed.module3Title ?? "");
        const legacyParticipants = String(parsed.module3Participants ?? "");
        const legacyDate = String(parsed.module3TargetDate ?? "");
        if (legacyTitle || legacyParticipants || legacyDate) {
          setModule3Rows([
            {
              ...emptyModule3Row(),
              title: legacyTitle,
              expectedParticipants: legacyParticipants,
              remarks: legacyDate ? `Target Date: ${legacyDate}` : "",
            },
          ]);
        } else {
          setModule3Rows([emptyModule3Row()]);
        }
      }
    } catch (restoreError) {
      console.error("Failed to restore PPMP wizard draft", restoreError);
    } finally {
      setDraftHydrated(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey || editingPlanId) return;

    const draft: PpmpWizardDraft = {
      version: 2,
      programId,
      items,
      selectedCategories,
      activeModule,
      moduleProgress,
      module2Data,
      module3Rows,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [
    draftHydrated,
    draftStorageKey,
    editingPlanId,
    programId,
    items,
    selectedCategories,
    activeModule,
    moduleProgress,
    module2Data,
    module3Rows,
  ]);

  useEffect(() => {
    if (!collegeId) return;
    fetchPrograms(collegeId)
      .then((rows) => setProgramOptions(rows))
      .catch(console.error);
  }, [collegeId]);

  const selectedProgramLabel = useMemo(() => {
    const selected = programOptions.find((program) => program.id === programId);
    if (!selected) return "";
    return `${selected.code} – ${selected.name}`;
  }, [programOptions, programId]);

  const refreshPlans = async () => {
    if (!user?.id) return;
    setLoadingPlans(true);
    try {
      const data = await fetchUserPpmpPlans({ userId: user.id });
      setPlans(data);
    } catch (err) {
      console.error("Failed to load PPMP plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    void refreshPlans();
  }, [user?.id]);

  // Auto-populate Department and College/Office from selected Program and College
  useEffect(() => {
    setModule2Data((prev) => ({
      ...prev,
      department: selectedProgramLabel,
      collegeOffice: collegeName,
    }));
  }, [selectedProgramLabel, collegeName]);

  const categoryOptions = useMemo(() => {
    const all = ppmpCatalog.map((entry) => entry.category);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, []);

  const itemsByCategory = useMemo(() => {
    const map = new Map<
      string,
      { description: string; uom: string; unitPrice: string }[]
    >();
    for (const entry of ppmpCatalog) {
      map.set(entry.category, entry.items);
    }
    return map;
  }, []);

  function getItemOptions(category: string) {
    return itemsByCategory.get(category) ?? [];
  }

  function getFilteredItemOptions(category: string, query: string) {
    const normalized = query.trim().toLowerCase();
    const options = getItemOptions(category);
    if (!normalized) return options;
    return options.filter((option) =>
      option.description.toLowerCase().includes(normalized),
    );
  }

  const uomOptions = useMemo(() => {
    const base = [
      "piece",
      "pc",
      "unit",
      "set",
      "lot",
      "pair",
      "box",
      "pack",
      "ream",
      "roll",
      "bundle",
      "book",
      "pad",
      "notebook",
      "cartridge",
      "bottle",
      "can",
      "tube",
      "sheet",
      "liter",
      "L",
      "milliliter",
      "mL",
      "gallon",
      "container",
      "drum",
      "kilogram",
      "kg",
      "gram",
      "g",
      "ton",
      "meter",
      "m",
      "centimeter",
      "cm",
      "inch",
      "foot",
      "ft",
      "square meter",
      "sqm",
      "cubic meter",
      "cu.m",
      "bag",
      "sack",
      "pail",
      "rod",
      "bar",
      "panel",
      "length",
      "coil",
      "kilo",
      "tray",
      "dozen",
      "sachet",
      "license",
      "subscription",
    ];
    const catalogUoms = ppmpCatalog
      .flatMap((entry) => entry.items.map((item) => item.uom))
      .filter(Boolean);
    return Array.from(new Set([...base, ...catalogUoms])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, []);

  const activeCompletedByProgram = useMemo(() => {
    const map = new Map<string, PpmpPlanRow>();
    for (const plan of plans) {
      if (!plan.completed_at || isExpired(plan)) continue;
      if (!map.has(plan.program_id)) {
        map.set(plan.program_id, plan);
      }
    }
    return map;
  }, [plans]);

  const activeCompletedPlan = programId
    ? activeCompletedByProgram.get(programId)
    : null;

  const availableCategoryOptions = useMemo(
    () =>
      categoryOptions.filter((option) => !selectedCategories.includes(option)),
    [categoryOptions, selectedCategories],
  );

  function addCategory(category: string) {
    if (!category || selectedCategories.includes(category)) return;
    setSelectedCategories((prev) => [...prev, category]);
    setItems((prev) => [
      ...prev.filter((it) => it.category),
      emptyItemForCategory(category),
    ]);
    setPendingCategory("");
  }

  function removeCategory(category: string) {
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
    setItems((prev) => {
      const kept = prev.filter((it) => it.category !== category);
      return kept.length > 0 ? kept : [emptyItem()];
    });
  }

  function addItemForCategory(category: string) {
    setItems((prev) => [...prev, emptyItemForCategory(category)]);
  }

  function getProgramName(plan: PpmpPlanRow) {
    if (plan.program_id === programId) {
      return programOptions.find((p) => p.id === programId)?.name ?? "—";
    }
    return (plan as any).program?.name ?? "—";
  }

  function handleDownload(plan: PpmpPlanRow) {
    const module2ForDownload = getModule2DataForDownload(plan);

    generatePpmpDocument(plan, {
      collegeName,
      programName: getProgramName(plan),
      unitName: profile?.office_name ?? profile?.department_name ?? "",
      preparedBy: getPreparedByName(profile),
      preparedByTitle: "End-User",
      certifiedBy: module2ForDownload.certifiedAllotmentName,
      certifiedByTitle: module2ForDownload.certifiedAllotmentDesignation,
      approvedBy: module2ForDownload.approvedName,
      approvedByTitle: module2ForDownload.approvedDesignation,
    });
  }

  function getModule2DataForDownload(plan: PpmpPlanRow) {
    if (editingPlanId === plan.id) {
      return module2Data;
    }

    const module2FromDb = normalizeModule2Data(plan.module2_data);
    const hasModule2FromDb = Boolean(
      plan.module2_data &&
      JSON.stringify(module2FromDb) !== JSON.stringify(emptyModule2Data()),
    );

    if (hasModule2FromDb) {
      return module2FromDb;
    }

    const localMeta = loadPlanLocalMeta(plan.id);
    return localMeta?.module2Data ?? emptyModule2Data();
  }

  function getModule3RowsForDownload(plan: PpmpPlanRow) {
    if (editingPlanId === plan.id) {
      return module3Rows;
    }

    const rawFromDb = plan.module3_rows;
    const module3FromDb = Array.isArray(rawFromDb)
      ? normalizeModule3Rows(rawFromDb)
      : [];

    const activeFromDb = module3FromDb.filter((row) =>
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
      ].some((value) => value.trim()),
    );

    if (Array.isArray(rawFromDb) && activeFromDb.length > 0) {
      return activeFromDb;
    }

    const localMeta = loadPlanLocalMeta(plan.id);
    const localRows = localMeta?.module3Rows ?? [];
    return localRows.filter((row) =>
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
      ].some((value) => value.trim()),
    );
  }

  function handleDownloadSelection(type: DownloadDocumentType) {
    if (!planPendingDownload) return;

    if (type === "ppmp") {
      handleDownload(planPendingDownload);
    } else if (type === "budget_proposal") {
      const module2ForDownload = getModule2DataForDownload(planPendingDownload);
      generateBudgetProposalDocument(planPendingDownload, {
        collegeName,
        programName: getProgramName(planPendingDownload),
        preparedByName: getPreparedByName(profile),
        preparedByDesignation: "End-User",
        module2DataOverride: module2ForDownload,
      });
    } else if (type === "learning_development_budget_proposal") {
      const module2ForDownload = getModule2DataForDownload(planPendingDownload);
      const module3ForDownload = getModule3RowsForDownload(planPendingDownload);

      generateLearningDevelopmentBudgetProposalDocument(planPendingDownload, {
        collegeName,
        programName: getProgramName(planPendingDownload),
        departmentName: module2ForDownload.department,
        preparedByName: getPreparedByName(profile),
        certifiedAllotmentName: module2ForDownload.certifiedAllotmentName,
        certifiedAllotmentDesignation:
          module2ForDownload.certifiedAllotmentDesignation,
        approvedName: module2ForDownload.approvedName,
        approvedDesignation: module2ForDownload.approvedDesignation,
        rows: module3ForDownload,
      });
    } else {
      // Unknown/unsupported type.
    }

    setPlanPendingDownload(null);
  }

  async function openPlanView(plan: PpmpPlanRow) {
    setViewPlan(plan);
    setViewModule(1);
    setViewFilter("remaining");
    setViewLoading(true);

    try {
      const usageRows = await fetchCompletedRequestsForProgram({
        collegeId: plan.college_id,
        programId: plan.program_id,
      });
      const takenMap = new Map<string, number>();

      usageRows.forEach((row: RequestItemUsageRow) => {
        (row.items ?? []).forEach((item) => {
          const key = makeItemKey({
            category: item.category,
            description: item.item_description,
            uom: item.uom,
          });
          const current = takenMap.get(key) ?? 0;
          takenMap.set(key, current + (item.qty ?? 0));
        });
      });

      const summaries = (plan.items ?? []).map((item) => {
        const key = makeItemKey({
          category: item.category,
          description: item.item_description,
          uom: item.uom,
        });
        const takenQty = takenMap.get(key) ?? 0;
        const remainingQty = Math.max((item.qty ?? 0) - takenQty, 0);

        return {
          key: `${item.id}-${key}`,
          category: item.category,
          itemDescription: item.item_description,
          uom: item.uom,
          ppmpQty: item.qty ?? 0,
          takenQty,
          remainingQty,
        };
      });

      setViewRows(summaries);
    } catch (err) {
      console.error("Failed to load PPMP usage:", err);
      setViewRows([]);
    } finally {
      setViewLoading(false);
    }
  }

  const isBlockedByActivePlan = Boolean(
    activeCompletedPlan && activeCompletedPlan.id !== editingPlanId,
  );

  function isModuleUnlocked(module: 1 | 2 | 3) {
    if (module === 1) return true;
    if (module === 2) return moduleProgress.module1;
    return moduleProgress.module1 && moduleProgress.module2;
  }

  function selectModule(module: 1 | 2 | 3) {
    if (!isModuleUnlocked(module)) return;
    setActiveModule(module);
  }

  async function persistPpmpRequest() {
    if (!user?.id || !collegeId || !programId) return;

    const trimmed = items.filter(
      (item) => item.itemDescription.trim() && item.category.trim(),
    );
    if (trimmed.length === 0) {
      setError("Please add at least one PPMP item.");
      return;
    }

    const hasInvalidCategory = trimmed.some(
      (item) => !selectedCategories.includes(item.category),
    );
    if (hasInvalidCategory) {
      setError(
        "Each item category must be selected from your chosen categories.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      let persistedPlanId = editingPlanId;

      if (editingPlanId) {
        await updatePpmpPlan({
          planId: editingPlanId,
          module2Data,
          module3Rows,
          items: trimmed.map((item) => ({
            category: item.category,
            itemDescription: item.itemDescription,
            qty: item.qty,
            uom: item.uom,
            unitPrice: item.unitPrice || undefined,
          })),
        });
      } else {
        persistedPlanId = await createPpmpPlan({
          createdBy: user.id,
          collegeId,
          programId,
          module2Data,
          module3Rows,
          items: trimmed.map((item) => ({
            category: item.category,
            itemDescription: item.itemDescription,
            qty: item.qty,
            uom: item.uom,
            unitPrice: item.unitPrice || undefined,
          })),
        });
      }

      if (persistedPlanId) {
        savePlanLocalMeta(persistedPlanId, {
          module2Data,
          module3Rows,
        });
      }

      await refreshPlans();
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save PPMP.");
    } finally {
      setSaving(false);
    }
  }

  function validateModuleTwo() {
    const missingFields: string[] = [];
    if (!module2Data.department.trim()) {
      missingFields.push("Department");
    }
    if (!module2Data.collegeOffice.trim()) {
      missingFields.push("College/Office");
    }
    if (!module2Data.papMfo.trim()) {
      missingFields.push("PAP/MFO");
    }
    if (!module2Data.fundCluster.trim()) {
      missingFields.push("Fund Cluster");
    }

    if (missingFields.length > 0) {
      setModule2ValidationAttempted(true);
      setError(`Please complete required fields: ${missingFields.join(", ")}.`);
      return false;
    }

    return true;
  }

  function saveModuleTwoUiOnly() {
    if (!validateModuleTwo()) return;

    setModule2ValidationAttempted(false);
    setError("");
    setModuleProgress((prev) => ({ ...prev, module2: true }));
    setActiveModule(3);
  }

  function requestSaveModuleTwo() {
    if (!validateModuleTwo()) return;
    setPendingSubmissionStep("module2");
  }

  function updateModule2FundSection(
    sectionKey: Module2FundKey,
    updater: (section: FundSection) => FundSection,
  ) {
    setModule2Data((prev) => ({
      ...prev,
      [sectionKey]: updater(prev[sectionKey]),
    }));
  }

  function addModule2Group(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]: [...section[subsectionKey], emptyBudgetGroup()],
    }));
  }

  function updateModule2GroupTitle(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
    groupKey: number,
    title: string,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]: section[subsectionKey].map((group) =>
        group.key === groupKey
          ? {
              ...group,
              title,
              items: group.title === title ? group.items : [emptyBudgetItem()],
            }
          : group,
      ),
    }));
  }

  function removeModule2Group(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
    groupKey: number,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]:
        section[subsectionKey].length > 1
          ? section[subsectionKey].filter((group) => group.key !== groupKey)
          : section[subsectionKey],
    }));
  }

  function addModule2Item(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
    groupKey: number,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]: section[subsectionKey].map((group) =>
        group.key === groupKey
          ? { ...group, items: [...group.items, emptyBudgetItem()] }
          : group,
      ),
    }));
  }

  function updateModule2Item(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
    groupKey: number,
    itemKey: number,
    field: keyof BudgetItem,
    value: string,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]: section[subsectionKey].map((group) =>
        group.key === groupKey
          ? {
              ...group,
              items: group.items.map((item) =>
                item.key === itemKey ? { ...item, [field]: value } : item,
              ),
            }
          : group,
      ),
    }));
  }

  function removeModule2Item(
    sectionKey: Module2FundKey,
    subsectionKey: keyof FundSection,
    groupKey: number,
    itemKey: number,
  ) {
    updateModule2FundSection(sectionKey, (section) => ({
      ...section,
      [subsectionKey]: section[subsectionKey].map((group) =>
        group.key === groupKey
          ? {
              ...group,
              items:
                group.items.length > 1
                  ? group.items.filter((item) => item.key !== itemKey)
                  : group.items,
            }
          : group,
      ),
    }));
  }

  const module2FundConfigs = [
    {
      key: "facultyStaffFund" as const,
      title: "1.1. Faculty and Staff Development Fund (12.5%)",
      appropriation: parseModule2Amount(module2Data.facultyStaffAmount),
    },
    {
      key: "curriculumFund" as const,
      title: "1.2. Curriculum Development Fund (12.5%)",
      appropriation: parseModule2Amount(module2Data.curriculumAmount),
    },
    {
      key: "studentFund" as const,
      title: "1.3. Student Development Fund (12.5%)",
      appropriation: parseModule2Amount(module2Data.studentAmount),
    },
    {
      key: "facilitiesFund" as const,
      title: "1.4. Facilities Development Fund (12.5%)",
      appropriation: parseModule2Amount(module2Data.facilitiesAmount),
    },
  ];

  function calculateModule2GroupTotal(group: BudgetGroup) {
    return group.items.reduce(
      (sum, item) => sum + parseModule2Amount(item.amount),
      0,
    );
  }

  function calculateModule2SectionTotal(section: FundSection) {
    return (Object.keys(section) as Module2SubsectionKey[]).reduce(
      (sum, subsectionKey) =>
        sum +
        section[subsectionKey].reduce(
          (sectionSum, group) => sectionSum + calculateModule2GroupTotal(group),
          0,
        ),
      0,
    );
  }

  const module2TotalAppropriation = module2FundConfigs.reduce(
    (sum, fund) => sum + fund.appropriation,
    0,
  );

  const module2TotalExpenditures = module2FundConfigs.reduce(
    (sum, fund) => sum + calculateModule2SectionTotal(module2Data[fund.key]),
    0,
  );

  const viewedPlanLocalMeta = useMemo(
    () => (viewPlan ? loadPlanLocalMeta(viewPlan.id) : null),
    [viewPlan],
  );

  const viewedModule2Data = useMemo(() => {
    const fromDb = normalizeModule2Data(viewPlan?.module2_data);
    const hasDbData = Boolean(
      viewPlan?.module2_data &&
      JSON.stringify(fromDb) !== JSON.stringify(emptyModule2Data()),
    );
    return hasDbData
      ? fromDb
      : (viewedPlanLocalMeta?.module2Data ?? emptyModule2Data());
  }, [viewPlan, viewedPlanLocalMeta]);

  const viewedModule3Rows = useMemo(() => {
    const fromDb = Array.isArray(viewPlan?.module3_rows)
      ? normalizeModule3Rows(viewPlan?.module3_rows)
      : [];
    const hasDbData = Boolean(
      Array.isArray(viewPlan?.module3_rows) && viewPlan.module3_rows.length > 0,
    );

    const sourceRows = hasDbData
      ? fromDb
      : (viewedPlanLocalMeta?.module3Rows ?? []);

    return sourceRows.filter((row) =>
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
      ].some((value) => value.trim()),
    );
  }, [viewPlan, viewedPlanLocalMeta]);

  const module2MissingFields = {
    department: module2ValidationAttempted && !module2Data.department.trim(),
    collegeOffice:
      module2ValidationAttempted && !module2Data.collegeOffice.trim(),
    papMfo: module2ValidationAttempted && !module2Data.papMfo.trim(),
    fundCluster: module2ValidationAttempted && !module2Data.fundCluster.trim(),
  };

  const module3FrequencyOptions = ["Annual", "Semi-Annual", "Quarterly"];
  const module3CategoryOptions = [
    "International",
    "National",
    "Regional",
    "Local",
  ];

  function parseModule3Amount(value: string) {
    return parseFloat(String(value ?? "").replace(/,/g, "")) || 0;
  }

  function getModule3Planned(row: Module3Row) {
    return (
      parseModule3Amount(row.registrationFees) +
      parseModule3Amount(row.travellingExpenses)
    );
  }

  const module3TotalPlanned = module3Rows.reduce(
    (sum, row) => sum + getModule3Planned(row),
    0,
  );
  const module3TotalActual = module3Rows.reduce(
    (sum, row) => sum + parseModule3Amount(row.actualBudget),
    0,
  );

  function addModule3Row() {
    setModule3Rows((prev) => [...prev, emptyModule3Row()]);
  }

  function removeModule3Row(key: number) {
    setModule3Rows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.key !== key) : prev,
    );
  }

  function updateModule3Row(
    key: number,
    field: keyof Module3Row,
    value: string,
  ) {
    setModule3Rows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function validateModuleThree() {
    const activeRows = module3Rows.filter((row) =>
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
      ].some((value) => value.trim()),
    );

    if (activeRows.length === 0) {
      setError("Please add at least one Learning and Development entry.");
      return false;
    }

    const invalidRows = activeRows.filter(
      (row) =>
        !row.title.trim() ||
        !row.frequency.trim() ||
        !row.category.trim() ||
        !row.expectedParticipants.trim() ||
        !row.duration.trim(),
    );

    if (invalidRows.length > 0) {
      setError(
        "Please complete required columns in Module 3 rows: Title, Frequency, Category, Expected Participants, and Duration.",
      );
      return false;
    }

    return true;
  }

  function saveModuleThreeUiOnly() {
    if (!validateModuleThree()) return;
    setError("");
    setModuleProgress((prev) => ({ ...prev, module3: true }));
    void persistPpmpRequest();
  }

  function requestSaveModuleThree() {
    if (!validateModuleThree()) return;
    setPendingSubmissionStep("module3");
  }

  function updateItem(key: number, field: string, value: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        if (field === "category") {
          return { ...it, category: value, itemDescription: "", uom: "" };
        }
        if (field === "itemDescription") {
          const options = it.category
            ? (itemsByCategory.get(it.category) ?? [])
            : [];
          const match = options.find((opt) => opt.description === value);
          return {
            ...it,
            itemDescription: value,
            uom: match?.uom || it.uom,
            unitPriceInput: match?.unitPrice || it.unitPriceInput,
            unitPrice: match?.unitPrice
              ? parseFloat(match.unitPrice) || 0
              : it.unitPrice,
          };
        }
        if (field === "qtyInput") {
          const sanitized = sanitizeIntegerInput(value);
          if (!sanitized) {
            return {
              ...it,
              qtyInput: "",
            };
          }
          const parsed = parseInt(sanitized, 10);
          return {
            ...it,
            qtyInput: sanitized,
            qty: Number.isFinite(parsed) && parsed > 0 ? parsed : it.qty,
          };
        }
        if (field === "unitPriceInput") {
          const sanitized = sanitizeDecimalInput(value);
          const parsed = parseFloat(sanitized);
          return {
            ...it,
            unitPriceInput: sanitized,
            unitPrice: Number.isFinite(parsed) ? parsed : it.unitPrice,
          };
        }
        if (field === "uom") {
          return { ...it, uom: value };
        }
        return { ...it, [field]: value };
      }),
    );
  }

  function removeItem(key: number) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.key !== key) : prev,
    );
  }

  function resetForm() {
    setItems([emptyItem()]);
    setSelectedCategories([]);
    setPendingCategory("");
    setOpenModule2DropdownKey(null);
    clearWizardDraft();
    setEditingPlanId(null);
    setActiveModule(1);
    setModuleProgress({ module1: false, module2: false, module3: false });
    setModule2Data(emptyModule2Data());
    setModule3Rows([emptyModule3Row()]);
    setExpirationInput("");
    setError("");
  }

  function startEditingPlan(plan: PpmpPlanRow) {
    const uncategorizedLabel = "Uncategorized";

    const planItems = (plan.items ?? []).map((item) => {
      const normalizedCategory = (item.category ?? "").trim();
      return {
        key: nextKey++,
        category: normalizedCategory || uncategorizedLabel,
        itemDescription: item.item_description,
        qtyInput: String(item.qty ?? 1),
        qty: item.qty ?? 1,
        uom: item.uom,
        unitPriceInput: item.unit_price != null ? String(item.unit_price) : "0",
        unitPrice: item.unit_price != null ? Number(item.unit_price) : 0,
      };
    });

    const categoriesFromPlan = Array.from(
      new Set(
        planItems
          .map((item) => item.category)
          .filter((category): category is string => Boolean(category)),
      ),
    );

    clearWizardDraft();
    setError("");
    setPendingCategory("");
    setOpenItemDropdownKey(null);
    setOpenModule2DropdownKey(null);
    setModule2ValidationAttempted(false);
    setModuleProgress({ module1: true, module2: true, module3: true });
    const localMeta = loadPlanLocalMeta(plan.id);
    const module2FromDb = normalizeModule2Data(plan.module2_data);
    const module3FromDb = normalizeModule3Rows(plan.module3_rows);

    const hasModule2FromDb = Boolean(
      plan.module2_data &&
      JSON.stringify(module2FromDb) !== JSON.stringify(emptyModule2Data()),
    );
    const hasModule3FromDb = Boolean(
      Array.isArray(plan.module3_rows) && plan.module3_rows.length > 0,
    );

    setModule2Data(
      hasModule2FromDb
        ? module2FromDb
        : (localMeta?.module2Data ?? emptyModule2Data()),
    );
    setModule3Rows(
      hasModule3FromDb
        ? module3FromDb
        : (localMeta?.module3Rows ?? [emptyModule3Row()]),
    );
    setEditingPlanId(plan.id);
    setProgramId(plan.program_id);
    setSelectedCategories(categoriesFromPlan);
    setItems(planItems.length > 0 ? planItems : [emptyItem()]);
    setActiveModule(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearWizardDraft();
    if (!user?.id || !collegeId || !programId) return;

    if (isBlockedByActivePlan) {
      setError(
        "You already have an active, completed PPMP for this program. Wait until it expires before creating a new one.",
      );
      return;
    }

    if (editingPlanId) {
      setError("");
      setPendingSubmissionStep("module1");
      return;
    }

    if (selectedCategories.length === 0) {
      setError("Please select at least one category first.");
      return;
    }

    const trimmed = items.filter(
      (item) => item.itemDescription.trim() && item.category.trim(),
    );
    if (trimmed.length === 0) {
      setError("Please add at least one PPMP item.");
      return;
    }

    const hasInvalidCategory = trimmed.some(
      (item) => !selectedCategories.includes(item.category),
    );
    if (hasInvalidCategory) {
      setError(
        "Each item category must be selected from your chosen categories.",
      );
      return;
    }

    setError("");
    setPendingSubmissionStep("module1");
  }

  function confirmPendingSubmission() {
    const step = pendingSubmissionStep;
    if (!step) return;
    setPendingSubmissionStep(null);

    if (step === "module1") {
      if (editingPlanId) {
        void persistPpmpRequest();
      } else {
        setModuleProgress((prev) => ({ ...prev, module1: true }));
        setActiveModule(2);
      }
      return;
    }

    if (step === "module2") {
      saveModuleTwoUiOnly();
      return;
    }

    saveModuleThreeUiOnly();
  }

  function getSubmissionConfirmCopy(step: PpmpSubmissionStep) {
    if (step === "module1") {
      return {
        title: editingPlanId ? "Save Module 1 Changes" : "Submit Module 1",
        message: "Are you sure the entered information is correct? Submit now?",
        actionLabel: editingPlanId ? "Save Now" : "Submit Now",
      };
    }
    if (step === "module2") {
      return {
        title: "Submit Budget Proposal",
        message: "Are you sure the entered information is correct? Submit now?",
        actionLabel: "Submit Now",
      };
    }
    return {
      title: "Submit Learning and Development",
      message: "Are you sure the entered information is correct? Submit now?",
      actionLabel: "Submit Now",
    };
  }

  async function handleCompletePlan() {
    if (!user?.id || !completingPlan) return;
    if (!expirationInput) {
      setError("Please provide a PPMP expiration date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await completePpmpPlan({
        planId: completingPlan.id,
        completedBy: user.id,
        expiresAt: expirationInput,
      });
      setCompletingPlan(null);
      setExpirationInput("");
      await refreshPlans();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete PPMP.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlanConfirmed() {
    if (!planPendingDelete) return;

    setDeletingPlanId(planPendingDelete.id);
    setError("");
    try {
      await deletePpmpPlan({ planId: planPendingDelete.id });
      removePlanLocalMeta(planPendingDelete.id);
      if (editingPlanId === planPendingDelete.id) {
        resetForm();
      }
      setPlanPendingDelete(null);
      await refreshPlans();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete PPMP.");
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function handleEditExpirationDate() {
    if (!planPendingExpirationEdit) return;
    if (!expirationInput.trim()) {
      setError("Please provide a PPMP expiration date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updatePpmpPlanExpiration({
        planId: planPendingExpirationEdit.id,
        expiresAt: expirationInput,
      });
      setPlanPendingExpirationEdit(null);
      setExpirationInput("");
      await refreshPlans();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update expiration date.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            PPMP Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, complete, and realign your PPMP per program.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My PPMP Requests
            </h2>
          </div>
          {loadingPlans ? (
            <div className="px-6 py-10 text-sm text-gray-500">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500">
              No PPMP requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-5 py-4">{getProgramName(plan)}</td>
                      <td className="px-5 py-4">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">{getPlanStatus(plan)}</td>
                      <td className="px-5 py-4">
                        {plan.expires_at
                          ? new Date(plan.expires_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!plan.completed_at ? (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => openPlanView(plan)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                onClick={() => startEditingPlan(plan)}
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                onClick={() => {
                                  setCompletingPlan(plan);
                                  setExpirationInput("");
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Complete
                              </button>
                              <button
                                type="button"
                                disabled={deletingPlanId === plan.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                onClick={() => setPlanPendingDelete(plan)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingPlanId === plan.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => openPlanView(plan)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                onClick={() => startEditingPlan(plan)}
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                Realignment
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                onClick={() => {
                                  setPlanPendingExpirationEdit(plan);
                                  setExpirationInput(
                                    plan.expires_at
                                      ? String(plan.expires_at).slice(0, 10)
                                      : "",
                                  );
                                }}
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                Edit Expiration
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                onClick={() => setPlanPendingDownload(plan)}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </button>
                              <button
                                type="button"
                                disabled={deletingPlanId === plan.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                onClick={() => setPlanPendingDelete(plan)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingPlanId === plan.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    College
                  </label>
                  <div className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                    {collegeName || "—"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select program</option>
                    {programOptions.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code} – {program.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isBlockedByActivePlan && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You already have an active PPMP for this program. Wait until
                  it expires before creating another.
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  PPMP Workflow Modules
                </label>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => selectModule(1)}
                    className={`rounded-xl border p-4 text-left transition ${
                      activeModule === 1
                        ? "border-violet-300 bg-violet-50"
                        : "border-gray-200 bg-white hover:border-violet-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Project Procurement Management Plan
                          </div>
                          <div className="text-xs text-gray-500">
                            Create PPMP
                          </div>
                        </div>
                      </div>
                      {moduleProgress.module1 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : null}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectModule(2)}
                    disabled={!isModuleUnlocked(2)}
                    className={`rounded-xl border p-4 text-left transition ${
                      !isModuleUnlocked(2)
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                        : activeModule === 2
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Budget Proposal
                          </div>
                          <div className="text-xs text-gray-500">
                            {isModuleUnlocked(2) ? "Open module" : "Locked"}
                          </div>
                        </div>
                      </div>
                      {moduleProgress.module2 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : !isModuleUnlocked(2) ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : null}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectModule(3)}
                    disabled={!isModuleUnlocked(3)}
                    className={`rounded-xl border p-4 text-left transition ${
                      !isModuleUnlocked(3)
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                        : activeModule === 3
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                          <GraduationCap className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Learning and Development
                          </div>
                          <div className="text-xs text-gray-500">
                            {isModuleUnlocked(3) ? "Open module" : "Locked"}
                          </div>
                        </div>
                      </div>
                      {moduleProgress.module3 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : !isModuleUnlocked(3) ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : null}
                    </div>
                  </button>
                </div>
              </div>

              {activeModule === 1 && (
                <div>
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="min-w-[220px] flex-1">
                        <label className="text-sm font-medium text-gray-700">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={pendingCategory}
                          onChange={(e) => setPendingCategory(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select category</option>
                          {availableCategoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!pendingCategory) {
                            setError("Please select a category to add.");
                            return;
                          }
                          setError("");
                          addCategory(pendingCategory);
                        }}
                        disabled={!pendingCategory}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add category
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Add one or more categories, then input as many items as
                      you need under each category.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Module 1: PPMP Items{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="mt-3 space-y-3">
                    {selectedCategories.map((category) => {
                      const rows = items.filter(
                        (it) => it.category === category,
                      );
                      return (
                        <div
                          key={category}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-gray-700">
                              {category}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCategory(category)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Remove category
                            </button>
                          </div>

                          <div className="space-y-3">
                            {rows.map((item, idx) => (
                              <div
                                key={item.key}
                                className="rounded-lg border border-gray-200 bg-white p-3"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="text-xs font-semibold text-gray-500">
                                    Item {idx + 1}
                                  </div>
                                  {rows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.key)}
                                      className="text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                                  <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">
                                      Item{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                      <input
                                        value={item.itemDescription}
                                        onFocus={() =>
                                          setOpenItemDropdownKey(item.key)
                                        }
                                        onClick={() =>
                                          setOpenItemDropdownKey(item.key)
                                        }
                                        onBlur={() => {
                                          window.setTimeout(() => {
                                            setOpenItemDropdownKey((prev) =>
                                              prev === item.key ? null : prev,
                                            );
                                          }, 120);
                                        }}
                                        onChange={(e) => {
                                          updateItem(
                                            item.key,
                                            "itemDescription",
                                            e.target.value,
                                          );
                                          setOpenItemDropdownKey(item.key);
                                        }}
                                        autoComplete="off"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                        required
                                      />
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() =>
                                          setOpenItemDropdownKey((prev) =>
                                            prev === item.key ? null : item.key,
                                          )
                                        }
                                        className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                                        aria-label="Toggle item list"
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </button>

                                      {openItemDropdownKey === item.key && (
                                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                                          <div className="max-h-56 overflow-auto py-1">
                                            {getFilteredItemOptions(
                                              item.category,
                                              item.itemDescription,
                                            ).length === 0 ? (
                                              <div className="px-3 py-2 text-sm text-gray-500">
                                                No matching items.
                                              </div>
                                            ) : (
                                              getFilteredItemOptions(
                                                item.category,
                                                item.itemDescription,
                                              )
                                                .slice(0, 80)
                                                .map((option) => (
                                                  <button
                                                    key={option.description}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                      e.preventDefault();
                                                      updateItem(
                                                        item.key,
                                                        "itemDescription",
                                                        option.description,
                                                      );
                                                      setOpenItemDropdownKey(
                                                        null,
                                                      );
                                                    }}
                                                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                                                  >
                                                    {option.description}
                                                  </button>
                                                ))
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">
                                      Qty *
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={formatNumberInput(item.qtyInput)}
                                      onChange={(e) =>
                                        updateItem(
                                          item.key,
                                          "qtyInput",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        if (
                                          !sanitizeIntegerInput(e.target.value)
                                        ) {
                                          updateItem(item.key, "qtyInput", "1");
                                        }
                                      }}
                                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                      required
                                    />
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">
                                      UOM
                                    </label>
                                    <select
                                      value={item.uom}
                                      onChange={(e) =>
                                        updateItem(
                                          item.key,
                                          "uom",
                                          e.target.value,
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                    >
                                      <option value="">Select UOM</option>
                                      {uomOptions.map((uom) => (
                                        <option key={uom} value={uom}>
                                          {uom}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">
                                      Unit Price
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={formatNumberInput(
                                        item.unitPriceInput,
                                        true,
                                      )}
                                      onChange={(e) =>
                                        updateItem(
                                          item.key,
                                          "unitPriceInput",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        if (
                                          !sanitizeDecimalInput(e.target.value)
                                        ) {
                                          updateItem(
                                            item.key,
                                            "unitPriceInput",
                                            "0",
                                          );
                                        }
                                      }}
                                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => addItemForCategory(category)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="h-4 w-4" /> Add Item
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {selectedCategories.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                        Add a category first to start encoding items.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeModule === 2 && (
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="border-b pb-4">
                    <h3 className="mb-3 text-base font-semibold text-gray-900">
                      Module 2: Budget Proposal
                    </h3>

                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={module2Data.department}
                          disabled
                          className={`mt-1 w-full rounded bg-gray-50 px-2 py-1.5 text-sm outline-none focus:ring-1 border border-gray-200 text-gray-600 cursor-not-allowed`}
                          placeholder="Department"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Auto-populated from your profile
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          College/Office <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={module2Data.collegeOffice}
                          disabled
                          className={`mt-1 w-full rounded bg-gray-50 px-2 py-1.5 text-sm outline-none focus:ring-1 border border-gray-200 text-gray-600 cursor-not-allowed`}
                          placeholder="College/Office"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Auto-populated from the selected college
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          PAP/MFO *
                        </label>
                        <input
                          type="text"
                          value={module2Data.papMfo}
                          onChange={(e) =>
                            setModule2Data((prev) => ({
                              ...prev,
                              papMfo: e.target.value,
                            }))
                          }
                          className={`mt-1 w-full rounded bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 ${
                            module2MissingFields.papMfo
                              ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border border-gray-200 focus:border-blue-400 focus:ring-blue-200"
                          }`}
                          placeholder="PAP/MFO"
                        />
                        {module2MissingFields.papMfo && (
                          <p className="mt-1 text-xs text-red-600">
                            PAP/MFO is required.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          Fund Cluster *
                        </label>
                        <input
                          type="text"
                          value={module2Data.fundCluster}
                          onChange={(e) =>
                            setModule2Data((prev) => ({
                              ...prev,
                              fundCluster: e.target.value,
                            }))
                          }
                          className={`mt-1 w-full rounded bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 ${
                            module2MissingFields.fundCluster
                              ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border border-gray-200 focus:border-blue-400 focus:ring-blue-200"
                          }`}
                          placeholder="Fund Cluster"
                        />
                        {module2MissingFields.fundCluster && (
                          <p className="mt-1 text-xs text-red-600">
                            Fund Cluster is required.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="mb-3 text-sm font-semibold text-gray-800">
                        Appropriation (based on ceiling by
                        department/college/office)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        <div>
                          <label className="text-xs text-gray-600">
                            Faculty &amp; Staff Dev. *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberInput(
                              module2Data.facultyStaffAmount,
                              true,
                            )}
                            onChange={(e) =>
                              setModule2Data((prev) => ({
                                ...prev,
                                facultyStaffAmount: sanitizeDecimalInput(
                                  e.target.value,
                                ),
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">
                            Curriculum Dev. *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberInput(
                              module2Data.curriculumAmount,
                              true,
                            )}
                            onChange={(e) =>
                              setModule2Data((prev) => ({
                                ...prev,
                                curriculumAmount: sanitizeDecimalInput(
                                  e.target.value,
                                ),
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">
                            Student Dev. *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberInput(
                              module2Data.studentAmount,
                              true,
                            )}
                            onChange={(e) =>
                              setModule2Data((prev) => ({
                                ...prev,
                                studentAmount: sanitizeDecimalInput(
                                  e.target.value,
                                ),
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">
                            Facilities Dev. *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberInput(
                              module2Data.facilitiesAmount,
                              true,
                            )}
                            onChange={(e) =>
                              setModule2Data((prev) => ({
                                ...prev,
                                facilitiesAmount: sanitizeDecimalInput(
                                  e.target.value,
                                ),
                              }))
                            }
                            className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">
                            Total Appropriations Available
                          </label>
                          <input
                            type="text"
                            disabled
                            value={Number(
                              module2TotalAppropriation || 0,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            className="mt-1 w-full rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {module2FundConfigs.map((fund) => {
                      const fundData = module2Data[fund.key];
                      const fundTotal = calculateModule2SectionTotal(fundData);

                      return (
                        <div
                          key={fund.key}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <h4 className="mb-3 text-sm font-semibold text-gray-800">
                            {fund.title}
                          </h4>

                          <div className="space-y-4">
                            {(
                              ["ps", "mooe", "co"] as Module2SubsectionKey[]
                            ).map((subsectionKey) => {
                              const subsectionLabel =
                                subsectionKey === "ps"
                                  ? "Personnel Services (PS):"
                                  : subsectionKey === "mooe"
                                    ? "Maintenance and Other Operating Expenses (MOOE):"
                                    : "Capital Outlay (CO):";
                              const groups = fundData[subsectionKey];

                              return (
                                <div
                                  key={subsectionKey}
                                  className="rounded-lg bg-white p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {subsectionLabel}
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-4">
                                    {groups.map((group) => {
                                      const groupTotal = group.items.reduce(
                                        (sum, item) =>
                                          sum + parseModule2Amount(item.amount),
                                        0,
                                      );

                                      return (
                                        <div
                                          key={group.key}
                                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                              <label className="text-xs text-gray-500">
                                                Title
                                              </label>
                                              <select
                                                value={group.title}
                                                onChange={(e) =>
                                                  updateModule2GroupTitle(
                                                    fund.key,
                                                    subsectionKey,
                                                    group.key,
                                                    e.target.value,
                                                  )
                                                }
                                                className="mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                                              >
                                                <option value="">
                                                  Select title
                                                </option>
                                                {getModule2GroupSelectOptions(
                                                  fundData,
                                                  subsectionKey,
                                                  group.title,
                                                ).map((option) => (
                                                  <option
                                                    key={option.title}
                                                    value={option.title}
                                                  >
                                                    {option.title}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>

                                            <button
                                              type="button"
                                              onMouseDown={(e) =>
                                                e.preventDefault()
                                              }
                                              onClick={() =>
                                                removeModule2Group(
                                                  fund.key,
                                                  subsectionKey,
                                                  group.key,
                                                )
                                              }
                                              className="mt-5 rounded p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                              disabled={groups.length === 1}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>

                                          <div className="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                                            {group.items.map((item) => (
                                              <div
                                                key={item.key}
                                                className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_auto] md:items-center"
                                              >
                                                <div className="relative">
                                                  <input
                                                    value={item.description}
                                                    onFocus={() =>
                                                      setOpenModule2DropdownKey(
                                                        `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`,
                                                      )
                                                    }
                                                    onClick={() =>
                                                      setOpenModule2DropdownKey(
                                                        `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`,
                                                      )
                                                    }
                                                    onBlur={() => {
                                                      window.setTimeout(() => {
                                                        setOpenModule2DropdownKey(
                                                          (prev) =>
                                                            prev ===
                                                            `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`
                                                              ? null
                                                              : prev,
                                                        );
                                                      }, 120);
                                                    }}
                                                    onChange={(e) => {
                                                      const option =
                                                        getModule2ItemOptions(
                                                          fund.key,
                                                          subsectionKey,
                                                          group.title,
                                                        ).find(
                                                          (entry) =>
                                                            entry.label ===
                                                            e.target.value,
                                                        );
                                                      updateModule2Item(
                                                        fund.key,
                                                        subsectionKey,
                                                        group.key,
                                                        item.key,
                                                        "description",
                                                        e.target.value,
                                                      );
                                                      if (option) {
                                                        updateModule2Item(
                                                          fund.key,
                                                          subsectionKey,
                                                          group.key,
                                                          item.key,
                                                          "amount",
                                                          option.amount,
                                                        );
                                                      }
                                                      setOpenModule2DropdownKey(
                                                        `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`,
                                                      );
                                                    }}
                                                    className="w-full rounded border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                                                    placeholder="Type or select item"
                                                  />
                                                  <button
                                                    type="button"
                                                    onMouseDown={(e) =>
                                                      e.preventDefault()
                                                    }
                                                    onClick={() =>
                                                      setOpenModule2DropdownKey(
                                                        (prev) =>
                                                          prev ===
                                                          `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`
                                                            ? null
                                                            : `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}`,
                                                      )
                                                    }
                                                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                                                    aria-label="Toggle item list"
                                                  >
                                                    <ChevronDown className="h-4 w-4" />
                                                  </button>

                                                  {openModule2DropdownKey ===
                                                    `${fund.key}-${subsectionKey}-group-${group.key}-item-${item.key}` && (
                                                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                                                      <div className="max-h-56 overflow-auto py-1">
                                                        {getFilteredModule2ItemOptions(
                                                          fund.key,
                                                          subsectionKey,
                                                          group,
                                                          item.description,
                                                        ).length === 0 ? (
                                                          <div className="px-3 py-2 text-sm text-gray-500">
                                                            No matching items.
                                                          </div>
                                                        ) : (
                                                          getFilteredModule2ItemOptions(
                                                            fund.key,
                                                            subsectionKey,
                                                            group,
                                                            item.description,
                                                          )
                                                            .slice(0, 80)
                                                            .map((option) => (
                                                              <button
                                                                key={
                                                                  option.label
                                                                }
                                                                type="button"
                                                                onMouseDown={(
                                                                  e,
                                                                ) => {
                                                                  e.preventDefault();
                                                                  updateModule2Item(
                                                                    fund.key,
                                                                    subsectionKey,
                                                                    group.key,
                                                                    item.key,
                                                                    "description",
                                                                    option.label,
                                                                  );
                                                                  updateModule2Item(
                                                                    fund.key,
                                                                    subsectionKey,
                                                                    group.key,
                                                                    item.key,
                                                                    "amount",
                                                                    option.amount,
                                                                  );
                                                                  setOpenModule2DropdownKey(
                                                                    null,
                                                                  );
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                                                              >
                                                                {option.label}
                                                              </button>
                                                            ))
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                                <input
                                                  type="text"
                                                  value={item.amount}
                                                  onChange={(e) =>
                                                    updateModule2Item(
                                                      fund.key,
                                                      subsectionKey,
                                                      group.key,
                                                      item.key,
                                                      "amount",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                                                  placeholder="0.00"
                                                />
                                                <button
                                                  type="button"
                                                  onMouseDown={(e) =>
                                                    e.preventDefault()
                                                  }
                                                  onClick={() =>
                                                    removeModule2Item(
                                                      fund.key,
                                                      subsectionKey,
                                                      group.key,
                                                      item.key,
                                                    )
                                                  }
                                                  className="rounded p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                  disabled={
                                                    group.items.length === 1
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>

                                          <div className="mt-3 flex items-start justify-between border-t border-gray-200 pt-3">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                addModule2Item(
                                                  fund.key,
                                                  subsectionKey,
                                                  group.key,
                                                )
                                              }
                                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                              Add Item
                                            </button>
                                            <div className="flex flex-col items-end gap-1">
                                              <div className="text-xs font-semibold text-gray-700">
                                                Subtotal:{" "}
                                                {groupTotal.toFixed(2)}
                                              </div>
                                              {getRemainingModule2GroupOptions(
                                                fundData,
                                                subsectionKey,
                                              ).length > 0 ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    addModule2Group(
                                                      fund.key,
                                                      subsectionKey,
                                                    )
                                                  }
                                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                  <Plus className="h-3.5 w-3.5" />
                                                  Add Title
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-gray-900">
                            Total {fund.title.replace(/^\d+\.\d+\.\s*/, "")}:{" "}
                            {fundTotal.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                      <span>TOTAL PROPOSED EXPENDITURES TUITION</span>
                      <span>{module2TotalExpenditures.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-semibold text-gray-900">
                      <span>BALANCE END (Appropriation less Expenditures)</span>
                      <span>
                        {(
                          module2TotalAppropriation - module2TotalExpenditures
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                    <div>
                      <h5 className="mb-2 text-xs font-semibold text-gray-700">
                        Certified Allotment Availability
                      </h5>
                      <input
                        type="text"
                        placeholder="Name"
                        value={module2Data.certifiedAllotmentName}
                        onChange={(e) =>
                          setModule2Data((prev) => ({
                            ...prev,
                            certifiedAllotmentName: e.target.value,
                          }))
                        }
                        className="mb-2 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={module2Data.certifiedAllotmentDesignation}
                        onChange={(e) =>
                          setModule2Data((prev) => ({
                            ...prev,
                            certifiedAllotmentDesignation: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <h5 className="mb-2 text-xs font-semibold text-gray-700">
                        Approved
                      </h5>
                      <input
                        type="text"
                        placeholder="Name"
                        value={module2Data.approvedName}
                        onChange={(e) =>
                          setModule2Data((prev) => ({
                            ...prev,
                            approvedName: e.target.value,
                          }))
                        }
                        className="mb-2 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={module2Data.approvedDesignation}
                        onChange={(e) =>
                          setModule2Data((prev) => ({
                            ...prev,
                            approvedDesignation: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <button
                      type="button"
                      onClick={requestSaveModuleTwo}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Save className="h-4 w-4" />
                      Save & Continue to Module 3
                    </button>
                  </div>
                </div>
              )}

              {activeModule === 3 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">
                      Module 3: Learning and Development
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-[1560px] w-full border-collapse text-xs">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="w-[280px] min-w-[280px] border border-gray-300 px-2 py-2 text-left font-semibold">
                            TITLE OF L and D
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            FREQUENCY (ANNUAL, SEMI-ANNUAL, QUARTERLY)
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            CATEGORY (International, National, Regional, Local)
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            EXPECTED NUMBER OF PARTICIPANTS
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            DURATION
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            REGISTRATION FEES
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            TRAVELLING EXPENSES (Per Diem and Transportation)
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            TOTAL L and D BUDGET - PLANNED
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            TOTAL L and D BUDGET - ACTUAL
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                            REMARKS
                          </th>
                          <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                            ACTION
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {module3Rows.map((row) => {
                          const planned = getModule3Planned(row);
                          return (
                            <tr key={row.key} className="align-top">
                              <td className="w-[280px] min-w-[280px] border border-gray-300 p-1">
                                <input
                                  value={row.title}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  className="min-w-[260px] w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="Training title"
                                />
                              </td>
                              <td className="border border-gray-300 p-1">
                                <select
                                  value={row.frequency}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "frequency",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                >
                                  <option value="">Select</option>
                                  {module3FrequencyOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-gray-300 p-1">
                                <select
                                  value={row.category}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "category",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                >
                                  <option value="">Select</option>
                                  {module3CategoryOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatNumberInput(
                                    row.expectedParticipants,
                                  )}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "expectedParticipants",
                                      sanitizeIntegerInput(e.target.value),
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="0"
                                />
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  value={row.duration}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "duration",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="e.g. 2 days"
                                />
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formatNumberInput(
                                    row.registrationFees,
                                    true,
                                  )}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "registrationFees",
                                      sanitizeDecimalInput(e.target.value),
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formatNumberInput(
                                    row.travellingExpenses,
                                    true,
                                  )}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "travellingExpenses",
                                      sanitizeDecimalInput(e.target.value),
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right font-semibold text-green-900">
                                {planned.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formatNumberInput(
                                    row.actualBudget,
                                    true,
                                  )}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "actualBudget",
                                      sanitizeDecimalInput(e.target.value),
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="border border-gray-300 p-1">
                                <input
                                  value={row.remarks}
                                  onChange={(e) =>
                                    updateModule3Row(
                                      row.key,
                                      "remarks",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs"
                                  placeholder="Remarks"
                                />
                              </td>
                              <td className="border border-gray-300 p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeModule3Row(row.key)}
                                  className="inline-flex rounded p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  disabled={module3Rows.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex justify-start">
                    <button
                      type="button"
                      onClick={addModule3Row}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add L and D Row
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
                      Total Planned Budget: {module3TotalPlanned.toFixed(2)}
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
                      Total Actual Budget: {module3TotalActual.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={requestSaveModuleThree}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      Save Module
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeModule === 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
              {editingPlanId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving || isBlockedByActivePlan}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Saving…"
                  : editingPlanId
                    ? "Save Module 1 Changes"
                    : "Next: Module 2"}
              </button>
            </div>
          )}
        </form>
      </div>

      {pendingSubmissionStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getSubmissionConfirmCopy(pendingSubmissionStep).title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {getSubmissionConfirmCopy(pendingSubmissionStep).message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingSubmissionStep(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingSubmission}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                {getSubmissionConfirmCopy(pendingSubmissionStep).actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {completingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete PPMP
              </h3>
              <button
                onClick={() => setCompletingPlan(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Please set the expiration date for this PPMP.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationInput}
                onChange={(e) => setExpirationInput(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompletingPlan(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCompletePlan}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Complete PPMP
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl h-[520px] rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    PPMP Items Usage
                  </div>
                  <div className="text-sm text-gray-500">
                    {viewPlan ? getProgramName(viewPlan) : "—"}
                  </div>
                </div>
                <button
                  onClick={() => setViewPlan(null)}
                  className="rounded-lg p-1 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 flex flex-col min-h-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  {[1, 2, 3].map((module) => (
                    <button
                      key={module}
                      type="button"
                      onClick={() => setViewModule(module as 1 | 2 | 3)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        viewModule === module
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Module {module}
                    </button>
                  ))}
                </div>

                {viewModule === 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold uppercase text-gray-500">
                      Filter
                    </label>
                    <select
                      value={viewFilter}
                      onChange={(e) =>
                        setViewFilter(
                          e.target.value as "remaining" | "taken" | "all",
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="remaining">Remaining</option>
                      <option value="taken">Requested</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                )}
              </div>

              {viewLoading ? (
                <div className="py-10 text-sm text-gray-500">Loading...</div>
              ) : viewModule === 1 ? (
                viewRows.length === 0 ? (
                  <div className="py-10 text-sm text-gray-500">
                    No Module 1 items available for this PPMP.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 flex-1 min-h-0">
                    <div className="overflow-y-auto max-h-full">
                      <table className="w-full min-w-[720px]">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">UOM</th>
                            <th className="px-4 py-3 text-right">PPMP Qty</th>
                            <th className="px-4 py-3 text-right">Requested</th>
                            <th className="px-4 py-3 text-right">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {viewRows
                            .filter((row) => {
                              if (viewFilter === "all") return true;
                              if (viewFilter === "taken")
                                return row.takenQty > 0;
                              return row.remainingQty > 0;
                            })
                            .map((row) => (
                              <tr key={row.key}>
                                <td className="px-4 py-3">{row.category}</td>
                                <td className="px-4 py-3">
                                  {row.itemDescription}
                                </td>
                                <td className="px-4 py-3">{row.uom || "—"}</td>
                                <td className="px-4 py-3 text-right">
                                  {row.ppmpQty}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {row.takenQty}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {row.remainingQty}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : viewModule === 2 ? (
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-500">
                          Department
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {viewedModule2Data.department || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-500">
                          College/Office
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {viewedModule2Data.collegeOffice || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-500">
                          PAP/MFO
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {viewedModule2Data.papMfo || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase text-gray-500">
                          Fund Cluster
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {viewedModule2Data.fundCluster || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 text-sm font-semibold text-gray-900">
                      Appropriations
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        {
                          label: "Faculty and Staff Development",
                          amount: viewedModule2Data.facultyStaffAmount,
                        },
                        {
                          label: "Curriculum Development",
                          amount: viewedModule2Data.curriculumAmount,
                        },
                        {
                          label: "Student Development",
                          amount: viewedModule2Data.studentAmount,
                        },
                        {
                          label: "Facilities Development",
                          amount: viewedModule2Data.facilitiesAmount,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                        >
                          <span className="text-gray-700">{item.label}</span>
                          <span className="font-semibold text-gray-900">
                            {parseModule2Amount(item.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 text-sm font-semibold text-gray-900">
                      Module 2 Titles and Amounts
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          key: "facultyStaffFund" as const,
                          title: "Faculty and Staff Development Fund",
                        },
                        {
                          key: "curriculumFund" as const,
                          title: "Curriculum Development Fund",
                        },
                        {
                          key: "studentFund" as const,
                          title: "Student Development Fund",
                        },
                        {
                          key: "facilitiesFund" as const,
                          title: "Facilities Development Fund",
                        },
                      ].map((fund) => {
                        const section = viewedModule2Data[fund.key];
                        const groupsBySubsection = (
                          ["ps", "mooe", "co"] as Module2SubsectionKey[]
                        ).map((subsectionKey) => {
                          const groups = section[subsectionKey].filter(
                            (group) =>
                              group.title.trim() ||
                              group.items.some(
                                (item) =>
                                  item.description.trim() ||
                                  parseModule2Amount(item.amount) > 0,
                              ),
                          );
                          return { subsectionKey, groups };
                        });
                        const hasEntries = groupsBySubsection.some(
                          (entry) => entry.groups.length > 0,
                        );

                        return (
                          <div
                            key={fund.key}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {fund.title}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {calculateModule2SectionTotal(section).toFixed(
                                  2,
                                )}
                              </span>
                            </div>

                            {hasEntries ? (
                              <div className="space-y-2">
                                {groupsBySubsection.map(
                                  ({ subsectionKey, groups }) => {
                                    if (groups.length === 0) return null;
                                    const subsectionLabel =
                                      subsectionKey === "ps"
                                        ? "PS"
                                        : subsectionKey === "mooe"
                                          ? "MOOE"
                                          : "CO";

                                    return (
                                      <div key={subsectionKey}>
                                        <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                                          {subsectionLabel}
                                        </div>
                                        <div className="space-y-1">
                                          {groups.map((group) => (
                                            <div
                                              key={group.key}
                                              className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm"
                                            >
                                              <span className="text-gray-700">
                                                {group.title.trim() ||
                                                  "Untitled"}
                                              </span>
                                              <span className="font-semibold text-gray-900">
                                                {calculateModule2GroupTotal(
                                                  group,
                                                ).toFixed(2)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No title entries saved.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                      <span>Total Proposed Expenditures Tuition</span>
                      <span>
                        {[
                          viewedModule2Data.facultyStaffFund,
                          viewedModule2Data.curriculumFund,
                          viewedModule2Data.studentFund,
                          viewedModule2Data.facilitiesFund,
                        ]
                          .reduce(
                            (sum, section) =>
                              sum + calculateModule2SectionTotal(section),
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : viewedModule3Rows.length === 0 ? (
                <div className="py-10 text-sm text-gray-500">
                  No Module 3 data saved for this PPMP.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 flex-1 min-h-0">
                  <div className="overflow-y-auto max-h-full">
                    <table className="w-full min-w-[1200px]">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="px-3 py-3">Title of L and D</th>
                          <th className="px-3 py-3">Frequency</th>
                          <th className="px-3 py-3">Category</th>
                          <th className="px-3 py-3 text-right">
                            Expected Participants
                          </th>
                          <th className="px-3 py-3">Duration</th>
                          <th className="px-3 py-3 text-right">
                            Registration Fees
                          </th>
                          <th className="px-3 py-3 text-right">
                            Travelling Expenses
                          </th>
                          <th className="px-3 py-3 text-right">Planned</th>
                          <th className="px-3 py-3 text-right">Actual</th>
                          <th className="px-3 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {viewedModule3Rows.map((row) => {
                          const planned =
                            (parseFloat(row.registrationFees) || 0) +
                            (parseFloat(row.travellingExpenses) || 0);
                          return (
                            <tr key={row.key}>
                              <td className="px-3 py-3">{row.title || "—"}</td>
                              <td className="px-3 py-3">
                                {row.frequency || "—"}
                              </td>
                              <td className="px-3 py-3">
                                {row.category || "—"}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {row.expectedParticipants || "—"}
                              </td>
                              <td className="px-3 py-3">
                                {row.duration || "—"}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {(
                                  parseFloat(row.registrationFees) || 0
                                ).toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {(
                                  parseFloat(row.travellingExpenses) || 0
                                ).toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-green-700">
                                {planned.toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {(parseFloat(row.actualBudget) || 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-3">
                                {row.remarks || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {planPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete PPMP Request
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This action cannot be undone. All items under this PPMP
                  request will be permanently removed.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Program: {getProgramName(planPendingDelete)}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlanPendingDelete(null)}
                disabled={deletingPlanId === planPendingDelete.id}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlanConfirmed}
                disabled={deletingPlanId === planPendingDelete.id}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deletingPlanId === planPendingDelete.id
                  ? "Deleting..."
                  : "Delete PPMP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {planPendingDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Download Document
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose which file to download for this plan.
                </p>
              </div>
              <button
                onClick={() => setPlanPendingDownload(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDownloadSelection("ppmp")}
                className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-800 hover:bg-blue-100"
              >
                PPMP
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSelection("budget_proposal")}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                Budget Proposal (Temporary File)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownloadSelection(
                    "learning_development_budget_proposal",
                  )
                }
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Learning Development Budget Proposal (Temporary File)
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setPlanPendingDownload(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {planPendingExpirationEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Expiration Date
              </h3>
              <button
                onClick={() => setPlanPendingExpirationEdit(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="mb-3 text-sm text-gray-500">
              Update the expiration date for this PPMP.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationInput}
                onChange={(e) => setExpirationInput(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlanPendingExpirationEdit(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleEditExpirationDate}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Expiration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
