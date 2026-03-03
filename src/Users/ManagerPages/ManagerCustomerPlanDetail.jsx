// Nudge for Vite reload
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
  PieChart,
} from "lucide-react";
import { fetchManagerPlanEntries, fetchManagerCustomerDetail } from "../../redux/slices/managerDataSlice.jsx";

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
    background: "bg-blue-50 text-blue-700",
    border: "border-blue-200",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    label: "text-blue-500",
  },
  missed: {
    background: "bg-rose-50 text-rose-700",
    border: "border-rose-200",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
    label: "text-rose-500",
  },
  upcoming: {
    background: "bg-slate-50 text-slate-600",
    border: "border-slate-200",
    ring: "ring-slate-200",
    dot: "bg-slate-300",
    label: "text-slate-400",
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

const formatTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

export default function ManagerCustomerPlanDetail() {
  const { customerId, planId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { planEntries, selectedCustomer } = useSelector((state) => state.managerData);

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

  useEffect(() => {
    if (customerId && planId) {
      dispatch(fetchManagerPlanEntries({ customerId, planId, page: 1, limit: 500 }));
      if (!selectedCustomer.data || selectedCustomer.data._id !== customerId) {
        dispatch(fetchManagerCustomerDetail(customerId));
      }
    }
  }, [customerId, dispatch, planId]);

  const plan = planEntries.data?.plan;
  const rawEntries = planEntries.data?.items || [];
  const status = planEntries.status;
  const error = planEntries.error;

  const decoratedPlan = useMemo(() => {
    if (!plan) return null;
    const isLoanPlan = Boolean(plan.loanDetails || plan.planType === "loan");
    const statusText = (plan.status || plan.state || plan.loanDetails?.status || "active").toLowerCase();
    const deposits = Number(plan.totalDeposited || plan.totalPaid || 0);
    const maintenance = Number(plan.totalFees || plan.maintenanceFee || 0);
    const balance = Number(plan.availableBalance || plan.balance || 0);
    const loanBalance = Number(plan.loanDetails?.balance || plan.loanDetails?.outstanding || 0);
    const withdrawn = Number(plan.totalWithdrawn || plan.withdrawnAmount || 0);
    const startDate = plan.startDate || plan.createdAt;

    return {
      ...plan,
      isLoanPlan,
      statusText,
      deposits,
      maintenance,
      balance,
      loanBalance,
      withdrawn,
      startDate,
    };
  }, [plan]);

  const entriesWithMeta = useMemo(() => {
    return rawEntries
      .map((entry) => {
        const recordedAt = getLocalDate(entry?.recordedAt || entry?.createdAt || entry?.updatedAt || entry?.date);
        const monthKey = recordedAt ? getMonthKey(recordedAt) : null;
        const category = normalizeEntryCategory(entry);
        const amount = resolveEntryAmount(entry);
        const narration = entry?.narration || entry?.note || entry?.description || "—";
        const reference = entry?.reference || entry?.receiptNumber || entry?.transactionId || entry?.id || "—";
        const matchesSearch = !searchTerm.trim() || narration.toLowerCase().includes(searchTerm.trim().toLowerCase());

        return {
          id: entry?._id || `${planId}-${entry?.recordedAt || entry?.createdAt || Math.random().toString(36).slice(2)}`,
          recordedAt,
          monthKey,
          category,
          amount,
          description: narration,
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
      const loanAmount = decoratedPlan.loanDetails?.amount || decoratedPlan.loanAmount || 0;
      const amountPaid = historyTotals.deposit;
      const fees = historyTotals.fees;
      const netPaid = Math.max(amountPaid - fees, 0);
      const computedBalance = Math.max(loanAmount - netPaid, 0);

      return [
        { key: "loanAmount", label: "Loan amount", value: loanAmount, amountClass: "text-slate-900" },
        { key: "amountPaid", label: "Amount Deposited", value: amountPaid, amountClass: "text-emerald-600" },
        { key: "maintenance", label: "Maintenance fees", value: fees, amountClass: "text-amber-600" },
        { key: "netPaid", label: "Paid so far", value: netPaid, amountClass: "text-emerald-700" },
        { key: "loanBalance", label: "Loan balance", value: computedBalance, amountClass: "text-amber-600" },
      ];
    }

    return [
      { key: "deposit", label: "Total deposits", value: historyTotals.deposit, amountClass: "text-emerald-600" },
      { key: "withdrawal", label: "Total withdrawals", value: historyTotals.withdrawal, amountClass: "text-rose-600" },
      { key: "fees", label: "Total fees", value: historyTotals.fees, amountClass: "text-amber-600" },
      { key: "balance", label: "Available balance", value: decoratedPlan.balance, amountClass: "text-emerald-600" },
    ];
  }, [decoratedPlan, historyTotals]);

  const toggleMonthSelection = (month) => {
    setSelectedMonths((current) => {
      if (month === "all") return ["all"];
      const withoutAll = current.filter((v) => v !== "all");
      if (withoutAll.includes(month)) {
        const updated = withoutAll.filter((v) => v !== month);
        return updated.length ? updated : ["all"];
      }
      const next = [...withoutAll, month].sort((a, b) => b.localeCompare(a));
      return next;
    });
  };

  const handleDownloadHistory = () => {
    if (!filteredHistoryEntries.length) {
      window.alert("No transactions match the current filters to download.");
      return;
    }

    const header = ["Recorded", "Category", "Description", "Reference", "Amount (NGN)"];
    const escapeCsv = (val) => `"${(val || "").toString().replace(/"/g, '""')}"`;
    const rows = filteredHistoryEntries.map((entry) => [
      formatDateTime(entry.recordedAt),
      toTitleCase(entry.category),
      entry.description,
      entry.reference,
      entry.amount,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plan-${planId || "history"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loanDailyRepayment = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) return 0;
    return Number(decoratedPlan.loanDetails?.dailyRepaymentAmount || decoratedPlan.dailyContribution || 0);
  }, [decoratedPlan]);

  const contributionUnit = useMemo(() => {
    const unit = Number(decoratedPlan?.dailyContribution || loanDailyRepayment || 0);
    return unit > 0 ? unit : 1;
  }, [decoratedPlan?.dailyContribution, loanDailyRepayment]);

  const loanPayments = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) return [];
    return rawEntries
      .filter((entry) => LOAN_PAYMENT_TYPES.has((entry?.type || "").toString().toLowerCase()))
      .flatMap((entry) => {
        const amount = Number(entry?.amount || entry?.value || 0);
        if (amount <= 0) return [];
        const recorded = entry?.recordedAt || entry?.createdAt;
        const actualDate = recorded ? new Date(recorded) : new Date();
        const normalizedDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate());
        
        const chunks = [];
        let remaining = amount;
        while (remaining > 0) {
          const portion = Math.min(contributionUnit, remaining);
          chunks.push({ entry, actualDate, normalizedDate, portionAmount: portion });
          remaining -= portion;
        }
        return chunks;
      })
      .sort((a, b) => a.actualDate - b.actualDate);
  }, [decoratedPlan?.isLoanPlan, rawEntries, contributionUnit]);

  const loanCardSlots = useMemo(() => {
    if (!decoratedPlan?.isLoanPlan) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseDate = decoratedPlan.loanDetails?.startDate ? new Date(decoratedPlan.loanDetails.startDate) : new Date(decoratedPlan.startDate);
    baseDate.setHours(0, 0, 0, 0);

    const slots = Array.from({ length: LOAN_CARD_SLOT_COUNT }, (_, i) => {
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(baseDate.getDate() + i);
      return { slot: i + 1, scheduledDate, status: "upcoming", paymentEntry: null, paymentDate: null };
    });

    loanPayments.forEach((payment, i) => {
      if (slots[i]) {
        slots[i] = { ...slots[i], status: "paid", paymentEntry: payment.entry, paymentDate: payment.actualDate, portionAmount: payment.portionAmount };
      }
    });

    return slots.map(s => {
      if (s.status === "paid") return s;
      return { ...s, status: s.scheduledDate <= today ? "missed" : "upcoming" };
    });
  }, [decoratedPlan, loanPayments]);

  const loanCardSummary = useMemo(() => {
    return loanCardSlots.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, { paid: 0, missed: 0, upcoming: 0 });
  }, [loanCardSlots]);

  const depositDays = useMemo(() => {
    if (!decoratedPlan || decoratedPlan.isLoanPlan) return [];
    const grouped = new Map();
    rawEntries.forEach(entry => {
      if ((entry?.type || "").toLowerCase() !== "deposit") return;
      const date = new Date(entry.recordedAt || entry.createdAt);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      if (!grouped.has(key)) grouped.set(key, { date: new Date(key), entries: [], total: 0 });
      const bucket = grouped.get(key);
      bucket.entries.push(entry);
      bucket.total += Number(entry.amount || 0);
    });
    return Array.from(grouped.values()).sort((a, b) => a.date - b.date);
  }, [decoratedPlan, rawEntries]);

  const wardCells = useMemo(() => {
    if (!decoratedPlan || decoratedPlan.isLoanPlan) return [];
    const slots = [];
    depositDays.forEach((day, dayIdx) => {
      const palette = CONTRIBUTION_PALETTE[dayIdx % CONTRIBUTION_PALETTE.length];
      const blocks = Math.max(1, Math.ceil(day.total / contributionUnit));
      for (let i = 0; i < blocks; i++) {
        slots.push({ slot: slots.length + 1, filled: true, palette, day });
      }
    });
    while (slots.length < 30) slots.push({ slot: slots.length + 1, filled: false });
    return slots;
  }, [decoratedPlan, depositDays, contributionUnit]);

  if (status === "loading" && !plan) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-primary hover:underline">GO BACK</button>
        </div>
      </div>
    );
  }

  if (!decoratedPlan) return null;

  return (
    <div className="space-y-6 p-6 font-sans">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate(`/manager/customers/${customerId}/plans`)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to customer plans
          </button>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{decoratedPlan.planName || "Plan Details"}</h1>
          <p className="text-sm text-slate-500 font-medium">Detailed view of performance and transaction history.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer ID</span>
          <span className="rounded-full bg-slate-100 px-4 py-1 text-sm font-mono font-medium text-slate-600">{selectedCustomer.data?._id || customerId}</span>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan type</p>
          <div className="mt-3">
            {decoratedPlan.isLoanPlan ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-100">
                <TrendingDown className="h-3.5 w-3.5" /> Loan Product
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                <TrendingUp className="h-3.5 w-3.5" /> Savings Product
              </span>
            )}
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Status</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{toTitleCase(decoratedPlan.statusText)}</p>
        </article>
        {decoratedPlan.isLoanPlan ? (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loan Amount</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(decoratedPlan.loanDetails?.amount || decoratedPlan.loanAmount || 0)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Repayment Card</p>
              <button
                onClick={() => setIsLoanCardModalOpen(true)}
                className="mt-2 flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <CalendarDays className="h-4 w-4" /> Open Card
              </button>
            </article>
          </>
        ) : (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Deposits</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(decoratedPlan.deposits)}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contribution Grid</p>
              <button
                onClick={() => setIsContributionCardOpen(true)}
                className="mt-2 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                <PiggyBank className="h-4 w-4" /> View Card
              </button>
            </article>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Core Information</h3>
            <div className="grid gap-6">
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-400">Plan Description</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{decoratedPlan.planName || "—"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] font-bold uppercase text-slate-400">Start Date</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-700">{formatDate(decoratedPlan.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase text-slate-400">Daily Amount</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(decoratedPlan.isLoanPlan ? loanDailyRepayment : decoratedPlan.dailyContribution)}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Metrics & Metadata</h3>
            <div className="grid gap-6">
              {decoratedPlan.isLoanPlan ? (
                <>
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-slate-400">Guarantor</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{decoratedPlan.loanDetails?.guarantor?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-slate-400">Guarantor Phone</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700 font-mono">{decoratedPlan.loanDetails?.guarantor?.phone || "—"}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-slate-400">Maintenance Fees</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(decoratedPlan.maintenance)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-slate-400">Total Withdrawn</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(decoratedPlan.withdrawn)}</dd>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-2">
            {HISTORY_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setHistoryCategory(cat.value)}
                className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  historyCategory === cat.value ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-primary/40 shadow-sm"
              >
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {selectedMonths.includes("all") ? "All Time" : `${selectedMonths.length} Months`}
                <ChevronDown className={`h-4 w-4 transition-transform ${isMonthDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isMonthDropdownOpen && (
                <div className="absolute right-0 mt-2 z-20 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5">
                  <button
                    onClick={() => toggleMonthSelection("all")}
                    className={`block w-full rounded-xl px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider ${selectedMonths.includes("all") ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-600"}`}
                  >
                    All Months
                  </button>
                  <div className="mt-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {historyMonthOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => toggleMonthSelection(m)}
                        className={`block w-full rounded-xl px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider ${selectedMonths.includes(m) ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-600"}`}
                      >
                        {formatMonthLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleDownloadHistory}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-primary/40 shadow-sm transition-all"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50 p-6 md:grid-cols-4 lg:grid-cols-5">
           {historySummaryCards.map((card) => (
            <div key={card.key} className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className={`text-base font-bold ${card.amountClass}`}>{formatCurrency(card.value)}</p>
            </div>
          ))}
        </section>

        <div className="overflow-x-auto">
          {!filteredHistoryEntries.length ? (
            <div className="py-24 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <PieChart className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-400">No transactions recorded for this criteria.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left">Recorded</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistoryEntries.map((entry) => (
                  <tr key={entry.id} className="group transition-colors hover:bg-slate-50/40">
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-slate-500">
                      {formatDateTime(entry.recordedAt)}
                    </td>
                    <td className="px-6 py-4 text-[11px]">
                      <span className={`inline-block rounded-full px-3 py-1 font-bold uppercase tracking-wider ${CATEGORY_STYLES[entry.category]?.badge}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate font-medium">{entry.description}</td>
                    <td className={`px-6 py-4 text-right font-bold tabular-nums ${CATEGORY_STYLES[entry.category]?.amount}`}>
                      {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={isLoanCardModalOpen} title="Loan Repayment Card" onClose={() => setIsLoanCardModalOpen(false)} widthClass="max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-6 rounded-2xl bg-slate-900 p-4 text-[10px] font-bold uppercase text-slate-400">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" /> Paid: {loanCardSummary.paid}</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> Missed: {loanCardSummary.missed}</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-600" /> Pending: {loanCardSummary.upcoming}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {loanCardSlots.map((slot) => {
              const style = LOAN_SLOT_STYLES[slot.status] || LOAN_SLOT_STYLES.upcoming;
              return (
                <button
                  key={slot.slot}
                  onClick={() => { setLoanSlotSelection(slot.slot); setIsLoanSlotDetailOpen(true); }}
                  className={`relative rounded-2xl border px-3 py-4 text-left transition hover:scale-[1.02] active:scale-[0.98] ${style.background} ${style.border} group`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase flex-1">Slot {slot.slot}</span>
                    <div className={`h-2 w-2 rounded-full ${style.dot} shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                  </div>
                  <p className="text-xs font-bold">{slot.status === "paid" ? "Paid" : slot.status === "missed" ? "Missed" : "Pending"}</p>
                  <p className="mt-1 text-[9px] opacity-60 font-medium">{formatDateLabel(slot.scheduledDate)}</p>
                </button>
              );
            })}
          </div>
        </div>
        
        {isLoanSlotDetailOpen && loanSlotSelection && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4">
             <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl relative">
                <button onClick={() => setIsLoanSlotDetailOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
                <div className="text-center space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Slot {loanSlotSelection} Details</h4>
                  
                  {(() => {
                    const slot = loanCardSlots.find(s => s.slot === loanSlotSelection);
                    if (!slot) return null;
                    return (
                      <div className="space-y-4 pt-2">
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                           <p className="text-[10px] font-bold uppercase text-slate-400">Scheduled For</p>
                           <p className="text-sm font-bold text-slate-700 mt-0.5">{formatDateLabel(slot.scheduledDate)}</p>
                        </div>
                        {slot.status === "paid" ? (
                          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-left">
                             <p className="text-[10px] font-bold uppercase text-emerald-600">Payment Info</p>
                             <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(slot.portionAmount || contributionUnit)}</p>
                             <p className="text-[10px] text-emerald-600/80 mt-1">Received on {formatDate(slot.paymentDate)}</p>
                          </div>
                        ) : (
                           <div className={`rounded-2xl p-4 border text-left ${slot.status === "missed" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
                             <p className="text-[10px] font-bold uppercase opacity-60">{slot.status === "missed" ? "Status: Missed" : "Status: Pending"}</p>
                             <p className="text-sm font-bold mt-1">{slot.status === "missed" ? "This repayment was skipped." : "Payment not yet due."}</p>
                           </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
             </div>
          </div>
        )}
      </Modal>

      <Modal open={isContributionCardOpen} title="Contribution History Grid" onClose={() => setIsContributionCardOpen(false)} widthClass="max-w-6xl">
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-8 shadow-inner overflow-hidden relative">
             <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {wardCells.map((cell) => {
                  const palette = cell.palette;
                  const isSelected = selectedWardCell?.slot === cell.slot;
                  return (
                    <button
                      key={cell.slot}
                      onClick={() => { setSelectedWardCell(cell); setIsWardSlotDetailOpen(true); }}
                      className={`relative aspect-square rounded-2xl border transition-all duration-300 ${cell.filled ? `${palette.slotBg} ${palette.slotBorder}` : "bg-slate-900/50 border-slate-800 text-slate-700"} ${isSelected ? "ring-2 ring-white scale-110 z-10" : "hover:brightness-125"}`}
                    >
                      <div className="absolute top-2 left-2 text-[8px] font-black uppercase opacity-60">Slot {cell.slot}</div>
                      {cell.filled && (
                        <div className="flex flex-col items-center justify-center h-full pt-1">
                           <span className="text-[10px] font-bold tabular-nums">{formatCurrency(contributionUnit)}</span>
                           <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${palette.slotDot} shadow-sm`} />
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>
        </div>

        {isWardSlotDetailOpen && selectedWardCell && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4">
             <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl relative">
                <button onClick={() => setIsWardSlotDetailOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
                <div className="text-center space-y-6">
                   <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary rotate-3">
                     <PiggyBank className="h-7 w-7" />
                   </div>
                   <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Slot {selectedWardCell.slot} Detail</h4>
                   
                   {selectedWardCell.day ? (
                     <div className="space-y-4 text-left">
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Date Collected</p>
                            <p className="text-sm font-bold text-slate-700">{formatDateLabel(selectedWardCell.day.date)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Daily Total</p>
                            <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(selectedWardCell.day.total)}</p>
                         </div>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-bold uppercase text-slate-400 px-1">Included Transactions</p>
                         <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                           {selectedWardCell.day.entries.map((tx) => (
                             <div key={tx._id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                               <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-[11px] font-semibold text-slate-600 truncate">{tx.narration || "General Deposit"}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{formatTime(tx.recordedAt || tx.createdAt)}</p>
                               </div>
                               <span className="text-[11px] font-black text-emerald-600 tabular-nums">{formatCurrency(tx.amount)}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-sm font-semibold text-slate-400">No deposit linked to this slot.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
