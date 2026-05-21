import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  PiggyBank,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { fetchAdminSavingsPlans, fetchAdminPlanEntries } from "../../../redux/slices/savingsSlice";
import { fetchCustomerById, clearCustomerState } from "../../../redux/slices/customersSlice";

const HISTORY_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "fees", label: "Fees" },
  { value: "other", label: "Other" },
];

const CATEGORY_STYLES = {
  deposit: { badge: "bg-emerald-100 text-emerald-700", amount: "text-emerald-600" },
  withdrawal: { badge: "bg-rose-100 text-rose-700", amount: "text-rose-600" },
  fees: { badge: "bg-amber-100 text-amber-700", amount: "text-amber-600" },
  other: { badge: "bg-slate-200 text-slate-600", amount: "text-slate-600" },
};

const LOAN_PAYMENT_TYPES = new Set([
  "deposit",
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "repayment",
]);

const LOAN_CARD_SLOT_COUNT = 32;

const LOAN_SLOT_STYLES = {
  paid: {
    background: "bg-gradient-to-br from-blue-500/20 via-slate-900 to-slate-950 text-blue-100",
    border: "border-blue-500",
    ring: "ring-blue-400",
    dot: "bg-blue-400",
    label: "text-blue-200",
  },
  missed: {
    background: "bg-gradient-to-br from-rose-500/25 via-slate-900 to-slate-950 text-rose-100",
    border: "border-rose-500",
    ring: "ring-rose-400",
    dot: "bg-rose-400",
    label: "text-rose-200",
  },
  upcoming: {
    background: "bg-slate-900 text-slate-400",
    border: "border-slate-700",
    ring: "ring-slate-600",
    dot: "bg-slate-600",
    label: "text-slate-300",
  },
};

const CONTRIBUTION_PALETTE = [
  {
    container: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "text-emerald-700",
    slotBg: "bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 text-emerald-100",
    slotBorder: "border-emerald-500",
    slotRing: "ring-emerald-400",
    slotDot: "bg-emerald-400",
    slotText: "text-emerald-200",
  },
  {
    container: "bg-indigo-50 border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    accent: "text-indigo-700",
    slotBg: "bg-gradient-to-br from-indigo-500/20 via-slate-900 to-slate-950 text-indigo-100",
    slotBorder: "border-indigo-500",
    slotRing: "ring-indigo-400",
    slotDot: "bg-indigo-400",
    slotText: "text-indigo-200",
  },
  {
    container: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    accent: "text-amber-700",
    slotBg: "bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 text-amber-100",
    slotBorder: "border-amber-500",
    slotRing: "ring-amber-400",
    slotDot: "bg-amber-400",
    slotText: "text-amber-200",
  },
  {
    container: "bg-rose-50 border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    accent: "text-rose-700",
    slotBg: "bg-gradient-to-br from-rose-500/20 via-slate-900 to-slate-950 text-rose-100",
    slotBorder: "border-rose-500",
    slotRing: "ring-rose-400",
    slotDot: "bg-rose-400",
    slotText: "text-rose-200",
  },
  {
    container: "bg-sky-50 border-sky-200",
    badge: "bg-sky-100 text-sky-700",
    accent: "text-sky-700",
    slotBg: "bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 text-sky-100",
    slotBorder: "border-sky-500",
    slotRing: "ring-sky-400",
    slotDot: "bg-sky-400",
    slotText: "text-sky-200",
  },
  {
    container: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    accent: "text-purple-700",
    slotBg: "bg-gradient-to-br from-purple-500/20 via-slate-900 to-slate-950 text-purple-100",
    slotBorder: "border-purple-500",
    slotRing: "ring-purple-400",
    slotDot: "bg-purple-400",
    slotText: "text-purple-200",
  },
];


const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const toTitleCase = (value) => {
  if (!value) return "—";
  const text = value.toString();
  if (!text.length) return "—";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const getLocalDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

const getMonthKey = (value) => {
  const date = getLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 7);
};

const formatMonthLabel = (key) => {
  if (!key || typeof key !== "string") return "All months";
  const [year, month] = key.split("-").map((token) => Number.parseInt(token, 10));
  if (!year || !month) return key;
  return monthFormatter.format(new Date(year, month - 1, 1));
};

const formatDateLabel = (value) => {
  if (!value) return "—";
  const dateObject = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObject.getTime())) {
    return "—";
  }
  return dateObject.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const normalizeEntryCategory = (entry) => {
  const rawType = (entry?.type || entry?.entryType || entry?.category || entry?.kind || "").toLowerCase();
  if (!rawType) return "other";
  if (rawType.includes("withdraw")) return "withdrawal";
  if (rawType.includes("fee") || rawType.includes("charge") || rawType.includes("maintenance")) return "fees";
  if (rawType.includes("deposit") || rawType.includes("payment") || rawType.includes("repay") || rawType.includes("remittance")) return "deposit";
  return "other";
};

const resolveEntryAmount = (entry) => {
  const candidates = [entry?.amount, entry?.value, entry?.remittanceAmount, entry?.fee, entry?.total, entry?.maintenanceFee];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const numeric = Number(candidate);
    if (!Number.isNaN(numeric)) {
      return Math.abs(numeric);
    }
  }
  return 0;
};

const formatLoanSlotLabel = (scheduledDate, paymentDate, status) => {
  const schedule = formatDateLabel(scheduledDate);
  if (status === "paid" && paymentDate) {
    const actual = formatDateLabel(paymentDate);
    if (actual && actual !== schedule) {
      return `${schedule} → ${actual}`;
    }
  }
  if (status === "missed") {
    return `${schedule} • missed`;
  }
  if (status === "paid") {
    return `${schedule} • paid`;
  }
  return `${schedule} • pending`;
};

function Modal({ open, title, onClose, children, widthClass = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className={`relative w-full ${widthClass} rounded-3xl bg-white shadow-2xl`}>
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminCustomerPlanDetail() {
  const { customerId, planId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedCustomer, mutationStatus, mutationError } = useSelector((state) => state.customers);
  const { adminPlans, adminPlansStatus, adminPlansError, entriesByPlan } = useSelector((state) => state.savings);

  const [historyCategory, setHistoryCategory] = useState("all");
  const [selectedMonths, setSelectedMonths] = useState(["all"]);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const monthDropdownRef = useRef(null);
  const [isLoanCardModalOpen, setIsLoanCardModalOpen] = useState(false);
  const [loanSlotSelection, setLoanSlotSelection] = useState(null);
  const [isLoanSlotDetailOpen, setIsLoanSlotDetailOpen] = useState(false);
  const [isContributionCardOpen, setIsContributionCardOpen] = useState(false);
  const [selectedWardCell, setSelectedWardCell] = useState(null);
  const [isWardSlotDetailOpen, setIsWardSlotDetailOpen] = useState(false);
  const [contributionMonth, setContributionMonth] = useState("all");

  useEffect(() => {
    if (!customerId) return;
    dispatch(fetchCustomerById({ customerId, admin: true }));
    dispatch(fetchAdminSavingsPlans());
    return () => {
      dispatch(clearCustomerState());
    };
  }, [customerId, dispatch]);

  useEffect(() => {
    if (!customerId || !planId) return;
    if (entriesByPlan?.[planId]?.items) return;
    dispatch(fetchAdminPlanEntries({ customerId, planId, page: 1, limit: 500 }));
  }, [customerId, dispatch, entriesByPlan, planId]);

  const plan = useMemo(() => {
    if (!planId) return null;
    return adminPlans.find((item) => item?._id?.toString() === planId) || entriesByPlan?.[planId]?.plan || null;
  }, [adminPlans, entriesByPlan, planId]);

  const decoratedPlan = useMemo(() => {
    if (!plan) return null;
    const isLoanPlan = Boolean(plan.loanDetails || plan.planType === "loan");
    const status = (plan.status || plan.state || plan.loanDetails?.status || "active").toLowerCase();
    const deposits = Number(plan.totalDeposited || plan.totalPaid || 0);
    const maintenance = Number(plan.totalFees || plan.maintenanceFee || 0);
    const balance = Number(plan.availableBalance || plan.balance || 0);
    const loanBalance = Number(plan.loanDetails?.balance || plan.loanDetails?.outstanding || 0);
    const withdrawn = Number(plan.totalWithdrawn || plan.withdrawnAmount || 0);
    const startDate = plan.startDate || plan.createdAt;

    return {
      ...plan,
      isLoanPlan,
      status,
      deposits,
      maintenance,
      balance,
      loanBalance,
      withdrawn,
      startDate,
      loanDetails: plan.loanDetails || null,
    };
  }, [plan]);

  const rawEntries = entriesByPlan?.[planId]?.items || [];

  const entriesWithMeta = useMemo(() => {
    return rawEntries
      .map((entry) => {
        const recordedAt = getLocalDate(entry?.recordedAt || entry?.createdAt || entry?.updatedAt || entry?.date);
        const monthKey = recordedAt ? getMonthKey(recordedAt) : null;
        const category = normalizeEntryCategory(entry);
        const amount = resolveEntryAmount(entry);
        const description = entry?.narration || entry?.description || entry?.remark || entry?.note || "—";
        const reference = entry?.reference || entry?.receiptNumber || entry?.transactionId || entry?.id || "—";
        const narration = entry?.narration || entry?.note || "";
        const matchesSearch = !searchTerm.trim() || narration.toLowerCase().includes(searchTerm.trim().toLowerCase());

        return {
          id: entry?._id || `${planId}-${entry?.recordedAt || entry?.createdAt || Math.random().toString(36).slice(2)}`,
          recordedAt,
          monthKey,
          category,
          amount,
          description,
          reference,
          matchesSearch,
        };
      })
      .sort((a, b) => {
        if (!a.recordedAt || !b.recordedAt) return 0;
        return b.recordedAt - a.recordedAt;
      });
  }, [rawEntries, searchTerm, planId]);

  const historyMonthOptions = useMemo(() => {
    if (!entriesWithMeta.length) return [];
    const unique = new Set();
    entriesWithMeta.forEach((item) => {
      if (item.monthKey) unique.add(item.monthKey);
    });
    const sorted = Array.from(unique).sort((a, b) => b.localeCompare(a));
    return sorted;
  }, [entriesWithMeta]);

  const contributionMonthOptions = useMemo(() => {
    if (!rawEntries.length) return [];
    const unique = new Set();
    rawEntries.forEach((entry) => {
      if ((entry?.type || "").toLowerCase() !== "deposit") return;
      const timestamp = entry?.recordedAt || entry?.createdAt || entry?.updatedAt;
      const key = getMonthKey(timestamp);
      if (key) unique.add(key);
    });
    return Array.from(unique).sort((a, b) => b.localeCompare(a));
  }, [rawEntries]);

  useEffect(() => {
    if (contributionMonth === "all" && contributionMonthOptions.length > 0) {
      setContributionMonth(contributionMonthOptions[0]);
    }
  }, [contributionMonthOptions, contributionMonth]);

  const filteredHistoryEntries = useMemo(() => {
    const isAllMonthsSelected = selectedMonths.includes("all") || !selectedMonths.length;
    return entriesWithMeta.filter((entry) => {
      if (historyCategory !== "all" && entry.category !== historyCategory) return false;
      if (!isAllMonthsSelected) {
        if (!entry.monthKey) return false;
        if (!selectedMonths.includes(entry.monthKey)) return false;
      }
      if (!entry.matchesSearch) return false;
      return true;
    });
  }, [entriesWithMeta, historyCategory, selectedMonths]);

  const historyTotals = useMemo(() => {
    return filteredHistoryEntries.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      },
      { deposit: 0, withdrawal: 0, fees: 0, other: 0 },
    );
  }, [filteredHistoryEntries]);

  const historySummaryCards = useMemo(() => {
    if (!decoratedPlan) {
      return [];
    }

    if (decoratedPlan.isLoanPlan) {
      const amountPaidFromFilter = historyTotals.deposit;
      const amountPaidFallback = decoratedPlan.deposits || decoratedPlan.totalPaid || 0;
      const totalMaintenanceFromFilter = historyTotals.fees;
      const totalMaintenanceFallback = decoratedPlan.maintenance || decoratedPlan.totalFees || 0;

      const amountPaidRaw = selectedMonths.includes("all")
        ? amountPaidFromFilter || amountPaidFallback
        : amountPaidFromFilter;
      const maintenancePaid = selectedMonths.includes("all")
        ? totalMaintenanceFromFilter || totalMaintenanceFallback
        : totalMaintenanceFromFilter;

      const amountPaid = Math.max(amountPaidRaw, 0);
      const netPaid = Math.max(amountPaid - maintenancePaid, 0);

      const loanAmount =
        decoratedPlan.loanDetails?.amount ||
        decoratedPlan.loanAmount ||
        decoratedPlan.principal ||
        0;
      const computedLoanBalance = Math.max(loanAmount - netPaid, 0);

      return [
        {
          key: "loanAmount",
          label: "Loan amount",
          value: loanAmount,
          amountClass: "text-slate-900",
        },
        {
          key: "amountPaid",
          label: "Amount Deposited",
          value: amountPaid,
          amountClass: CATEGORY_STYLES.deposit?.amount || "text-emerald-600",
        },
        {
          key: "maintenance",
          label: "Maintenance fees",
          value: maintenancePaid,
          amountClass: CATEGORY_STYLES.fees?.amount || "text-amber-600",
        },
        {
          key: "netPaid",
          label: "Paid so far",
          value: netPaid,
          amountClass: "text-emerald-700",
        },
        {
          key: "loanBalance",
          label: "Loan balance",
          value: computedLoanBalance,
          amountClass: "text-amber-600",
        },
      ];
    }

    return [
      {
        key: "deposit",
        label: "Total deposits",
        value: historyTotals.deposit,
        amountClass: CATEGORY_STYLES.deposit?.amount,
      },
      {
        key: "withdrawal",
        label: "Total withdrawals",
        value: historyTotals.withdrawal,
        amountClass: CATEGORY_STYLES.withdrawal?.amount,
      },
      {
        key: "fees",
        label: "Total fees",
        value: historyTotals.fees,
        amountClass: CATEGORY_STYLES.fees?.amount,
      },
      {
        key: "balance",
        label: "Available balance",
        value: decoratedPlan.balance ?? 0,
        amountClass: "text-emerald-600",
      },
    ];
  }, [decoratedPlan, historyTotals, selectedMonths]);

  const toggleMonthSelection = (month) => {
    setSelectedMonths((current) => {
      if (month === "all") {
        return ["all"];
      }

      const withoutAll = current.filter((value) => value !== "all");
      if (withoutAll.includes(month)) {
        const updated = withoutAll.filter((value) => value !== month);
        return updated.length ? updated : ["all"];
      }

      const next = [...withoutAll, month];
      next.sort((a, b) => b.localeCompare(a));
      return next;
    });
  };

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = value.toString().replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const handleDownloadHistory = () => {
    if (!filteredHistoryEntries.length) {
      window.alert("No transactions match the current filters to download.");
      return;
    }

    const header = ["Recorded", "Category", "Description", "Reference", "Amount (NGN)"];
    const rows = filteredHistoryEntries.map((entry) => [
      formatDateTime(entry.recordedAt),
      toTitleCase(entry.category),
      entry.description,
      entry.reference,
      entry.amount,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const monthsLabel = selectedMonths.includes("all") || !selectedMonths.length
      ? "all-months"
      : selectedMonths.join("_");
    link.href = url;
    link.download = `plan-${planId || "history"}-${monthsLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isLoadingPlan = (adminPlansStatus === "loading" || mutationStatus === "loading") && !decoratedPlan;
  const isLoadingEntries = Boolean(planId && !entriesByPlan?.[planId]?.items);

  useEffect(() => {
    setSelectedMonths((current) => {
      if (!historyMonthOptions.length) {
        return ["all"];
      }

      const withoutAll = current.filter((value) => value !== "all");
      const valid = withoutAll.filter((value) => historyMonthOptions.includes(value));
      return valid.length ? valid.sort((a, b) => b.localeCompare(a)) : ["all"];
    });
  }, [historyMonthOptions]);

  useEffect(() => {
    if (!isMonthDropdownOpen) return undefined;

    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMonthDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMonthDropdownOpen]);

  useEffect(() => {
    if (!decoratedPlan?.isLoanPlan) {
      setIsLoanCardModalOpen(false);
      setLoanSlotSelection(null);
      setIsLoanSlotDetailOpen(false);
    }
  }, [decoratedPlan?.isLoanPlan]);

  useEffect(() => {
    if (!decoratedPlan || decoratedPlan.isLoanPlan) {
      setIsContributionCardOpen(false);
      setSelectedWardCell(null);
      setIsWardSlotDetailOpen(false);
    }
  }, [decoratedPlan]);

  useEffect(() => {
    if (!isLoanCardModalOpen) {
      setLoanSlotSelection(null);
      setIsLoanSlotDetailOpen(false);
    }
  }, [isLoanCardModalOpen]);

  useEffect(() => {
    if (!isContributionCardOpen) {
      setSelectedWardCell(null);
      setIsWardSlotDetailOpen(false);
    }
  }, [isContributionCardOpen]);

  useEffect(() => {
    if (!loanSlotSelection) {
      setIsLoanSlotDetailOpen(false);
    }
  }, [loanSlotSelection]);

  useEffect(() => {
    if (!selectedWardCell) {
      setIsWardSlotDetailOpen(false);
    }
  }, [selectedWardCell]);

  const monthFilterLabel = useMemo(() => {
    if (selectedMonths.includes("all") || !selectedMonths.length) return "All months";
    if (selectedMonths.length === 1) {
      return formatMonthLabel(selectedMonths[0]);
    }
    return `${selectedMonths.length} months selected`;
  }, [selectedMonths]);

  const loanDailyRepayment = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) {
      return 0;
    }

    const candidates = [
      decoratedPlan.loanDetails?.dailyRepaymentAmount,
      decoratedPlan.loanDetails?.dailyAmount,
      decoratedPlan.dailyContribution,
    ];

    for (const candidate of candidates) {
      const numeric = Number(candidate || 0);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }

    return 0;
  }, [decoratedPlan]);

  const contributionUnit = useMemo(() => {
    const baseContribution = Number(decoratedPlan?.dailyContribution || 0);
    if (Number.isFinite(baseContribution) && baseContribution > 0) {
      return baseContribution;
    }
    if (loanDailyRepayment > 0) {
      return loanDailyRepayment;
    }
    return 1;
  }, [decoratedPlan?.dailyContribution, loanDailyRepayment]);

  const loanPayments = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) {
      return [];
    }

    const unit = loanDailyRepayment > 0 ? loanDailyRepayment : contributionUnit;
    const fallbackUnit = unit > 0 ? unit : 1;

    return rawEntries
      .filter((entry) => LOAN_PAYMENT_TYPES.has((entry?.type || "").toString().toLowerCase()))
      .flatMap((entry) => {
        const amount = Number(entry?.amount || entry?.value || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return [];
        }

        const recorded = entry?.recordedAt || entry?.createdAt || entry?.updatedAt;
        const actualDate = recorded ? new Date(recorded) : null;
        if (!actualDate || Number.isNaN(actualDate.getTime())) {
          return [];
        }

        const normalizedDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate());

        const chunks = [];
        let remaining = amount;
        const chunkSize = fallbackUnit;
        while (remaining > 0) {
          const portion = Math.min(chunkSize, remaining);
          chunks.push({
            entry,
            actualDate,
            normalizedDate,
            portionAmount: portion,
          });
          remaining -= portion;
        }

        if (!chunks.length) {
          chunks.push({ entry, actualDate, normalizedDate, portionAmount: fallbackUnit });
        }

        return chunks;
      })
      .sort((a, b) => a.actualDate - b.actualDate);
  }, [decoratedPlan?.isLoanPlan, rawEntries, loanDailyRepayment, contributionUnit]);

  const loanCardSlots = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!loanPayments.length) {
      const baseDate = decoratedPlan.loanDetails?.startDate
        ? new Date(decoratedPlan.loanDetails.startDate)
        : new Date(decoratedPlan.startDate || Date.now());
      baseDate.setHours(0, 0, 0, 0);

      return Array.from({ length: LOAN_CARD_SLOT_COUNT }, (_, index) => {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(baseDate.getDate() + index);
        const status = scheduledDate <= today ? "missed" : "upcoming";
        return {
          slot: index + 1,
          scheduledDate,
          payment: null,
          paymentDate: null,
          paymentEntry: null,
          portionAmount: null,
          status,
        };
      });
    }

    const firstPaymentDate = new Date(loanPayments[0].normalizedDate);
    firstPaymentDate.setHours(0, 0, 0, 0);

    const slots = Array.from({ length: LOAN_CARD_SLOT_COUNT }, (_, index) => {
      const scheduledDate = new Date(firstPaymentDate);
      scheduledDate.setDate(firstPaymentDate.getDate() + index);
      return {
        slot: index + 1,
        scheduledDate,
        payment: null,
        paymentDate: null,
        paymentEntry: null,
        portionAmount: null,
        status: "upcoming",
      };
    });

    loanPayments.forEach((payment) => {
      let targetIndex = slots.findIndex(
        (slot) => !slot.payment && slot.scheduledDate <= payment.normalizedDate,
      );

      if (targetIndex === -1) {
        targetIndex = slots.findIndex((slot) => !slot.payment);
      }

      if (targetIndex !== -1) {
        slots[targetIndex] = {
          ...slots[targetIndex],
          payment,
          paymentDate: payment.actualDate,
          paymentEntry: payment.entry,
          portionAmount: payment.portionAmount,
          status: "paid",
        };
      }
    });

    return slots.map((slot) => {
      if (slot.status === "paid") {
        return slot;
      }
      const status = slot.scheduledDate <= today ? "missed" : "upcoming";
      return {
        ...slot,
        status,
      };
    });
  }, [decoratedPlan, loanPayments]);

  const loanCardSummary = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) {
      return { paid: 0, missed: 0, upcoming: 0 };
    }

    return loanCardSlots.reduce(
      (acc, slot) => {
        acc[slot.status] = (acc[slot.status] || 0) + 1;
        return acc;
      },
      { paid: 0, missed: 0, upcoming: 0 },
    );
  }, [decoratedPlan?.isLoanPlan, loanCardSlots]);

  const loanExpectedUnit = useMemo(
    () => Number(loanDailyRepayment || contributionUnit || 0),
    [loanDailyRepayment, contributionUnit],
  );

  const selectedLoanSlotDetail = useMemo(() => {
    if (!loanSlotSelection) {
      return null;
    }
    return loanCardSlots.find((slot) => slot.slot === loanSlotSelection) || null;
  }, [loanSlotSelection, loanCardSlots]);

  const selectedLoanSlotAmount = selectedLoanSlotDetail?.portionAmount ?? loanExpectedUnit;

  const depositDays = useMemo(() => {
    if (!decoratedPlan || decoratedPlan.isLoanPlan) {
      return [];
    }

    const grouped = new Map();

    rawEntries.forEach((entry) => {
      if ((entry?.type || "").toLowerCase() !== "deposit") {
        return;
      }

      const timestamp = entry?.recordedAt || entry?.createdAt || entry?.updatedAt;
      const date = timestamp ? new Date(timestamp) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return;
      }

      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const key = normalized.getTime();
      if (!grouped.has(key)) {
        grouped.set(key, { date: normalized, entries: [], total: 0 });
      }
      const bucket = grouped.get(key);
      bucket.entries.push(entry);
      bucket.total += Number(entry.amount || 0);
    });

    return Array.from(grouped.values())
      .filter((day) => {
        if (contributionMonth === "all") return true;
        return getMonthKey(day.date) === contributionMonth;
      })
      .sort((a, b) => a.date - b.date);
  }, [decoratedPlan, rawEntries, contributionMonth]);

  const wardCells = useMemo(() => {
    if (!decoratedPlan || decoratedPlan.isLoanPlan) {
      return [];
    }

    const slots = [];
    const paletteSize = CONTRIBUTION_PALETTE.length;
    let paletteIndex = 0;

    depositDays.forEach((day) => {
      const palette = CONTRIBUTION_PALETTE[paletteIndex % paletteSize];
      paletteIndex += 1;
      const blocks = Math.max(1, Math.ceil(Math.max(day.total, 0) / contributionUnit));

      for (let i = 0; i < blocks; i += 1) {
        slots.push({
          slot: slots.length + 1,
          filled: true,
          palette,
          day,
        });
      }
    });

    const minSlots = 30;
    while (slots.length < minSlots) {
      slots.push({
        slot: slots.length + 1,
        filled: false,
      });
    }

    return slots;
  }, [decoratedPlan, depositDays, contributionUnit]);

  const selectedWardSlot = selectedWardCell?.slot ?? null;
  const selectedWardDay = selectedWardCell?.filled ? selectedWardCell.day : null;

  if (!planId) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">Missing plan id.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/customers/${customerId}/plans`)}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </button>
          <h1 className="text-3xl font-semibold text-slate-900">Plan details</h1>
          <p className="text-sm text-slate-500">Detailed view of customer plan history and performance.</p>
        </div>
        <div className="grid gap-2 text-right text-xs uppercase tracking-wide text-slate-500">
          <span>Customer ID</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
            {selectedCustomer?._id || customerId}
          </span>
        </div>
      </div>

      {adminPlansError || mutationError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {adminPlansError || mutationError}
        </div>
      ) : null}

      {isLoadingPlan ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading plan…
        </div>
      ) : !decoratedPlan ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Plan could not be found.
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan type</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold">
                {decoratedPlan.isLoanPlan ? (
                  <span className="bg-amber-100 px-3 py-1 text-amber-700">
                    <TrendingDown className="mr-1 inline h-4 w-4" /> Loan plan
                  </span>
                ) : (
                  <span className="bg-emerald-100 px-3 py-1 text-emerald-700">
                    <TrendingUp className="mr-1 inline h-4 w-4" /> Savings plan
                  </span>
                )}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{toTitleCase(decoratedPlan.status)}</p>
              <p className="text-xs text-slate-500">Current lifecycle stage</p>
            </article>
            {decoratedPlan.isLoanPlan ? (
              <>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan amount</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(
                      decoratedPlan.loanDetails?.amount ||
                        decoratedPlan.loanAmount ||
                        decoratedPlan.principal ||
                        0,
                    )}
                  </p>
                  <p className="text-xs text-slate-500">Principal approved for this loan</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan balance</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">
                    {formatCurrency(
                      Math.max(
                        (decoratedPlan.loanDetails?.amount ||
                          decoratedPlan.loanAmount ||
                          decoratedPlan.principal ||
                          0) -
                          Math.max((decoratedPlan.deposits || decoratedPlan.totalPaid || 0) - (decoratedPlan.maintenance || decoratedPlan.totalFees || 0), 0),
                        0,
                      ),
                    )}
                  </p>
                  <p className="text-xs text-slate-500">Outstanding balance based on repayments</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Repayment card</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!decoratedPlan.isLoanPlan) return;
                      setIsLoanCardModalOpen(true);
                      setLoanSlotSelection(null);
                      setIsLoanSlotDetailOpen(false);
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    <CalendarDays className="h-4 w-4" /> View card
                  </button>
                  <p className="mt-2 text-xs text-slate-500">Inspect repayment slots, missed days, and pending entries.</p>
                </article>
              </>
            ) : (
              <>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(decoratedPlan.deposits)}</p>
                  <p className="text-xs text-slate-500">Combined contributions recorded</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available balance</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">
                    {formatCurrency(decoratedPlan.balance)}
                  </p>
                  <p className="text-xs text-slate-500">Balance after fees and withdrawals</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contribution card</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (decoratedPlan.isLoanPlan) return;
                      setIsContributionCardOpen(true);
                      setSelectedWardCell(null);
                      setIsWardSlotDetailOpen(false);
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <PiggyBank className="h-4 w-4" /> View card
                  </button>
                  <p className="mt-2 text-xs text-slate-500">Visualise daily contributions across the plan timeline.</p>
                </article>
              </>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan name</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {decoratedPlan.planName || "Untitled plan"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Start date</dt>
                  <dd className="mt-1 text-sm text-slate-700">{formatDate(decoratedPlan.startDate)}</dd>
                </div>
                {decoratedPlan.isLoanPlan ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guarantor</dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {decoratedPlan.loanDetails?.guarantor?.name || decoratedPlan.loanDetails?.guarantor?.fullName || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guarantor phone</dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {decoratedPlan.loanDetails?.guarantor?.phone || decoratedPlan.loanDetails?.guarantor?.phoneNumber || "—"}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Daily contribution</dt>
                      <dd className="mt-1 text-sm text-slate-700">{formatCurrency(decoratedPlan.dailyContribution)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maintenance fees</dt>
                      <dd className="mt-1 text-sm text-slate-700">{formatCurrency(decoratedPlan.maintenance)}</dd>
                    </div>
                  </>
                )}
              </dl>

              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan ID</dt>
                  <dd className="mt-1 text-xs font-mono text-slate-500">{decoratedPlan._id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last updated</dt>
                  <dd className="mt-1 text-sm text-slate-700">{formatDate(decoratedPlan.updatedAt || decoratedPlan.endDate)}</dd>
                </div>
                {decoratedPlan.isLoanPlan ? (
                  <>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guarantor address</dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {decoratedPlan.loanDetails?.guarantor?.address || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signature status</dt>
                      <dd className="mt-1 text-sm text-slate-700">
                        {decoratedPlan.loanDetails?.customerSignature ? "Signed" : "Pending"}
                      </dd>
                    </div>
                  </>
                ) : (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total withdrawn</dt>
                    <dd className="mt-1 text-sm text-slate-700">{formatCurrency(decoratedPlan.withdrawn)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {HISTORY_CATEGORIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setHistoryCategory(item.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      historyCategory === item.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:justify-end">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Filter className="h-4 w-4" />
                  <div ref={monthDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMonthDropdownOpen((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary"
                      disabled={!historyMonthOptions.length}
                    >
                      <span>{monthFilterLabel}</span>
                      <ChevronDown className={`h-4 w-4 transition ${isMonthDropdownOpen ? "rotate-180" : "rotate-0"}`} />
                    </button>
                    {isMonthDropdownOpen ? (
                      <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="max-h-60 overflow-y-auto py-2">
                          <label className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/40"
                              checked={selectedMonths.includes("all")}
                              onChange={() => toggleMonthSelection("all")}
                            />
                            All months
                          </label>
                          <div className="my-1 border-t border-slate-100" />
                          {historyMonthOptions.map((option) => {
                            const isChecked = selectedMonths.includes(option) && !selectedMonths.includes("all");
                            return (
                              <label
                                key={option}
                                className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/40"
                                  checked={isChecked}
                                  onChange={() => toggleMonthSelection(option)}
                                />
                                {formatMonthLabel(option)}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search narration"
                      className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadHistory}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    <Download className="h-4 w-4" /> Download CSV
                  </button>
                </div>
              </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {historySummaryCards.map(({ key, label, value, amountClass }) => (
                <article key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className={`mt-2 text-sm font-semibold ${amountClass || CATEGORY_STYLES[key]?.amount || "text-slate-600"}`}>
                    {formatCurrency(value || 0)}
                  </p>
                </article>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              {isLoadingEntries ? (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading history…
                </div>
              ) : !entriesWithMeta.length ? (
                <div className="px-6 py-16 text-center text-sm text-slate-400">No transactions recorded for this plan yet.</div>
              ) : !filteredHistoryEntries.length ? (
                <div className="px-6 py-16 text-center text-sm text-slate-400">No entries match the selected filters.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Recorded</th>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-left font-semibold">Reference</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryEntries.map((entry) => {
                      const styles = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.other;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {formatDateTime(entry.recordedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${styles.badge}`}>
                              {toTitleCase(entry.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{entry.description}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{entry.reference}</td>
                          <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${styles.amount}`}>
                            {formatCurrency(entry.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {decoratedPlan.isLoanPlan ? (
            <Modal
              open={isLoanCardModalOpen}
              title="Loan repayment card"
              onClose={() => {
                setIsLoanCardModalOpen(false);
                setLoanSlotSelection(null);
                setIsLoanSlotDetailOpen(false);
              }}
              widthClass="max-w-5xl"
            >
              {!loanCardSlots.length ? (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-10 text-center text-sm text-indigo-600">
                  No repayment data available yet.
                </div>
              ) : (
                <div className="relative">
                  <div className="rounded-3xl bg-slate-950 p-6 shadow-inner">
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-200">
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Paid {loanCardSummary.paid}</span>
                      <span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-200">Missed {loanCardSummary.missed}</span>
                      <span className="rounded-full bg-slate-500/20 px-3 py-1 text-slate-200">Upcoming {loanCardSummary.upcoming}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                      {loanCardSlots.map((slot) => {
                        const style = LOAN_SLOT_STYLES[slot.status] || LOAN_SLOT_STYLES.upcoming;
                        const isSelected = loanSlotSelection === slot.slot;
                        const ringClass = isSelected
                          ? "ring-2 ring-primary scale-[1.05]"
                          : slot.status !== "upcoming"
                            ? `ring-1 ${style.ring}`
                            : "ring-0";
                        return (
                          <button
                            key={slot.slot}
                            type="button"
                            onClick={() => {
                              setLoanSlotSelection(slot.slot);
                              setIsLoanSlotDetailOpen(true);
                            }}
                            className={`rounded-xl border px-3 py-3 text-left text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary ${style.background} ${style.border} ${ringClass} hover:brightness-110`}
                            title={formatLoanSlotLabel(slot.scheduledDate, slot.paymentDate, slot.status)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wide">Slot {slot.slot}</span>
                              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                            </div>
                            <p className={`mt-2 text-sm font-semibold ${style.label}`}>
                              {slot.status === "paid" ? "Paid" : slot.status === "missed" ? "Missed" : "Pending"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-300">{formatDateLabel(slot.scheduledDate)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isLoanSlotDetailOpen && loanSlotSelection && selectedLoanSlotDetail ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-sm shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot</p>
                            <p className="text-lg font-semibold text-slate-900">Slot {selectedLoanSlotDetail.slot}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLoanSlotSelection(null);
                              setIsLoanSlotDetailOpen(false);
                            }}
                            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                            aria-label="Close slot details"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            <p className="font-semibold text-slate-700">
                              {formatLoanSlotLabel(
                                selectedLoanSlotDetail.scheduledDate,
                                selectedLoanSlotDetail.paymentDate,
                                selectedLoanSlotDetail.status,
                              )}
                            </p>
                            <p className="text-slate-500">
                              Expected amount: <span className="font-semibold text-slate-900">{formatCurrency(selectedLoanSlotAmount)}</span>
                            </p>
                          </div>

                          {selectedLoanSlotDetail.status === "paid" ? (
                            <div className="space-y-2 rounded-xl bg-emerald-50/70 p-3 text-xs text-emerald-700">
                              <p className="font-semibold text-emerald-800">Payment recorded</p>
                              <p>
                                Amount received: <span className="font-semibold text-emerald-900">
                                  {formatCurrency(selectedLoanSlotDetail.paymentEntry?.amount || selectedLoanSlotAmount)}
                                </span>
                              </p>
                              <p>
                                Recorded on {formatDate(selectedLoanSlotDetail.paymentDate)} at {formatTime(selectedLoanSlotDetail.paymentDate)}
                              </p>
                              {selectedLoanSlotDetail.paymentEntry?.narration ? (
                                <p className="text-emerald-700/80">{selectedLoanSlotDetail.paymentEntry.narration}</p>
                              ) : null}
                            </div>
                          ) : selectedLoanSlotDetail.status === "missed" ? (
                            <div className="space-y-2 rounded-xl bg-rose-50/80 p-3 text-xs text-rose-600">
                              <p className="font-semibold text-rose-700">Missed repayment</p>
                              <p>No repayment was received for this slot. Follow up with the customer.</p>
                            </div>
                          ) : (
                            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                              <p className="font-semibold text-slate-700">Upcoming repayment</p>
                              <p>Payment is scheduled for {formatDate(selectedLoanSlotDetail.scheduledDate)}.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Modal>
          ) : (
            <Modal
              open={isContributionCardOpen}
              title="Contribution card"
              onClose={() => {
                setIsContributionCardOpen(false);
                setSelectedWardCell(null);
                setIsWardSlotDetailOpen(false);
              }}
              widthClass="max-w-5xl"
            >
              {!wardCells.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <label htmlFor="card-month-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Select Month:
                    </label>
                    <select
                      id="card-month-select"
                      value={contributionMonth}
                      onChange={(e) => setContributionMonth(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {contributionMonthOptions.map((m) => (
                        <option key={m} value={m}>{formatMonthLabel(m)}</option>
                      ))}
                    </select>
                  </div>
                  No contribution entries for {formatMonthLabel(contributionMonth)}.
                </div>
              ) : (
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                      <label htmlFor="card-month-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Select Month:
                      </label>
                      <select
                        id="card-month-select"
                        value={contributionMonth}
                        onChange={(e) => setContributionMonth(e.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {contributionMonthOptions.map((m) => (
                          <option key={m} value={m}>{formatMonthLabel(m)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total for {formatMonthLabel(contributionMonth)}</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(depositDays.reduce((sum, d) => sum + d.total, 0))}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-950 p-6 shadow-inner">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                      {wardCells.map((cell) => {
                        const palette = cell.palette;
                        const isFilled = cell.filled;
                        const isSelected = selectedWardSlot === cell.slot && isWardSlotDetailOpen;

                        const slotBgClass = isFilled
                          ? palette?.slotBg || "bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 text-emerald-100"
                          : "bg-slate-900 text-slate-500";
                        const slotBorderClass = isFilled ? palette?.slotBorder || "border-emerald-500" : "border-slate-800";
                        const slotRingClass = isSelected
                          ? `ring-2 ${palette?.slotRing || "ring-primary"}`
                          : isFilled
                            ? `ring-1 ${palette?.slotRing || "ring-emerald-400"}`
                            : "ring-0";
                        const slotDotClass = isFilled ? palette?.slotDot || "bg-emerald-400" : "bg-slate-700";
                        const slotTextClass = isFilled ? palette?.slotText || "text-emerald-200" : "text-slate-500";

                        return (
                          <button
                            key={cell.slot}
                            type="button"
                            onClick={() => {
                              setSelectedWardCell(cell);
                              setIsWardSlotDetailOpen(true);
                            }}
                            className={`rounded-xl border px-3 py-3 text-left text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary ${slotBgClass} ${slotBorderClass} ${slotRingClass} ${
                              isSelected ? "scale-[1.05]" : "hover:brightness-110"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wide">Slot {cell.slot}</span>
                              <span className={`h-2 w-2 rounded-full ${slotDotClass}`} />
                            </div>
                            <p className={`mt-3 text-sm font-semibold ${slotTextClass}`}>
                              {isFilled ? formatCurrency(contributionUnit) : "Empty"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isWardSlotDetailOpen && selectedWardCell ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-sm shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot</p>
                            <p className="text-lg font-semibold text-slate-900">Slot {selectedWardSlot ?? "—"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsWardSlotDetailOpen(false)}
                            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                            aria-label="Close slot details"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {selectedWardDay ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                                <p className="text-sm font-semibold text-slate-900">{formatDateLabel(selectedWardDay.date)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total deposited</p>
                                <p className="text-base font-bold text-primary">{formatCurrency(selectedWardDay.total)}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              {selectedWardDay.entries.map((entry) => (
                                <div key={entry._id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-600">
                                      {formatTime(entry.recordedAt || entry.createdAt)}
                                    </p>
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                      {formatCurrency(entry.amount)}
                                    </span>
                                  </div>
                                  {entry.narration ? (
                                    <p className="mt-1 text-[11px] text-slate-500">{entry.narration}</p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            No deposits recorded for this slot yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
