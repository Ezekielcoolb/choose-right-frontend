import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchCsoById,
  fetchAdminCsoDetail,
  setSelectedCso,
  resetCsoStatus,
  updateCsoStatus,
  recordCsoRemittance,
  transferCustomers,
} from "../../../redux/slices/csoSlice";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  UserCircle,
  Users,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ArrowUpRight,
  ClipboardList,
  X,
} from "lucide-react";

const tabConfig = [
  { key: "details", label: "Details" },
  { key: "customers", label: "Customers" },
  { key: "remittance", label: "Remittance" },
  { key: "dashboard", label: "Dashboard" },
  { key: "collections", label: "Collections" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const humanizeType = (type) => {
  if (!type) return "Payment";
  return type
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getLocalDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthKey = (value) => {
  const dateKey = getLocalDateKey(value);
  return dateKey ? dateKey.slice(0, 7) : null;
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey || typeof monthKey !== "string") {
    return "All months";
  }
  const [year, month] = monthKey.split("-");
  const numericYear = Number(year);
  const numericMonth = Number(month) - 1;
  const date = new Date(numericYear, numericMonth >= 0 ? numericMonth : 0, 1);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getEntryAmount = (entry = {}) => {
  const candidates = [
    entry.amount,
    entry.amountPaid,
    entry.amountCollected,
    entry.amountRemitted,
    entry.fee,
    entry.withdrawalAmount,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric !== 0) {
      return numeric;
    }
  }
  const fallback = Number(entry.amount || entry.amountPaid || entry.amountCollected || 0);
  return Number.isFinite(fallback) ? fallback : 0;
};

const extractEntryMonthKey = (entry) => getMonthKey(entry?.recordedAt || entry?.createdAt || entry?.updatedAt);

const getUniqueMonthsForEntries = (entriesList = []) => {
  const monthSet = new Set();
  entriesList.forEach((entry) => {
    const monthKey = extractEntryMonthKey(entry);
    if (monthKey) {
      monthSet.add(monthKey);
    }
  });
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
};

const filterEntriesByMonth = (entriesList = [], monthKey) => {
  if (!monthKey || monthKey === "all") {
    return entriesList;
  }
  return entriesList.filter((entry) => extractEntryMonthKey(entry) === monthKey);
};

const createDefaultPlanFilter = () => ({
  paymentsMonth: "all",
  transactionsMonth: "all",
  showTransactions: false,
});

const PAYMENT_TYPES = new Set([
  "deposit",
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "repayment",
]);

const LOAN_PAYMENT_TYPES = new Set([
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "loan repayment",
  "loanpayment",
  "loan",
  "repayment",
  "loanpayment",
  "loan-pay",
]);

const infoItems = (cso) => [
  {
    label: "Contact",
    icon: Phone,
    value: cso?.phone,
    helper: cso?.email,
  },
  {
    label: "Branch",
    icon: MapPin,
    value: cso?.branchName,
    helper: cso?.branchId,
  },
  {
    label: "Work ID",
    icon: BadgeCheck,
    value: cso?.workId,
    helper: cso?.isActive ? "Active" : "Suspended",
    helperClass: cso?.isActive ? "text-emerald-600" : "text-amber-600",
  },
  {
    label: "Guarantor",
    icon: UserCircle,
    value: cso?.guaratorName,
    helper: cso?.guaratorPhone,
  },
];


function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {active ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function TabBar({ activeTab, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
      {tabConfig.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab.key)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            tab.key === activeTab
              ? "bg-primary text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DetailsTab({ cso }) {
  const dob = useMemo(() => {
    if (!cso?.dateOfBirth) return null;
    return new Date(cso.dateOfBirth).toLocaleDateString();
  }, [cso?.dateOfBirth]);

  const guarantor = {
    name: cso?.guaratorName,
    phone: cso?.guaratorPhone,
    email: cso?.guaratorEmail,
    address: cso?.guaratorAddress,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Full name</p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {cso?.firstName} {cso?.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Date of birth</p>
              <p className="mt-1 text-base text-slate-700">{dob || "Not provided"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
              <p className="mt-1 text-base text-slate-700">{cso?.address || "Not provided"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Guarantor</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{guarantor.name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
              <p className="mt-1 text-base text-slate-700">{guarantor.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
              <p className="mt-1 text-base text-slate-700">{guarantor.email || "Not provided"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
              <p className="mt-1 text-base text-slate-700">{guarantor.address || "Not provided"}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        {infoItems(cso).map(({ label, icon: Icon, value, helper, helperClass }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Icon className="h-4 w-4" />
              {label}
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">{value || "Not provided"}</p>
            {helper ? <p className={`mt-1 text-sm ${helperClass || "text-slate-500"}`}>{helper}</p> : null}
          </div>
        ))}
      </section>
    </div>
  );
}

function EmptyTab({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function CsoDetailPage() {
  const { csoId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    selectedCso,
    mutationStatus,
    mutationError,
    detailStatus,
    detailError,
    selectedCsoCustomers,
    selectedCsoPlans,
    selectedCsoEntries,
    remittanceStatus,
    remittanceError,
  } = useSelector((state) => state.csos);
  const [activeTab, setActiveTab] = useState("details");
  const [dashboardMonth, setDashboardMonth] = useState("all");
  const [planModalCustomerId, setPlanModalCustomerId] = useState(null);

  const [planFilters, setPlanFilters] = useState({});
  const [isResolveRemittanceOpen, setIsResolveRemittanceOpen] = useState(false);
  const [resolveDate, setResolveDate] = useState(" ");
  const [resolveNote, setResolveNote] = useState("");
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    if (!csoId) return;
    dispatch(fetchCsoById(csoId))
      .unwrap()
      .then((cso) => dispatch(setSelectedCso(cso)))
      .catch(() => {});
    dispatch(fetchAdminCsoDetail(csoId));

    return () => {
      dispatch(resetCsoStatus());
    };
  }, [csoId, dispatch]);

  const isLoading = !selectedCso && mutationStatus === "loading";
  const cso = selectedCso;

  const customers = selectedCsoCustomers || [];
  const plans = selectedCsoPlans || [];
  const entries = selectedCsoEntries || [];

  const plansById = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => {
      if (plan?._id) {
        map.set(plan._id.toString(), plan);
      }
    });
    return map;
  }, [plans]);

  const modalCustomer = useMemo(
    () => customers.find((customer) => customer._id === planModalCustomerId),
    [customers, planModalCustomerId],
  );

  const modalCustomerPlans = useMemo(() => {
    if (!planModalCustomerId) return [];
    return plans.filter((plan) => {
      const planCustomerId = plan.customerId;
      if (!planCustomerId) return false;
      if (typeof planCustomerId === "string") {
        return planCustomerId === planModalCustomerId;
      }
      if (planCustomerId?._id) {
        return planCustomerId._id === planModalCustomerId;
      }
      return false;
    });
  }, [plans, planModalCustomerId]);

  const remittanceHistory = useMemo(() => {
    if (!Array.isArray(cso?.remittance)) {
      return [];
    }
    return [...cso.remittance].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cso?.remittance]);

  const dashboardStats = useMemo(() => {

    const isLoan = (p) => {
      const status = (p.loanStatus || "").toLowerCase();
      return ["approved", "active", "completed"].includes(status);
    };

    const stats = {
      savings: { deposited: 0, withdrawn: 0, fees: 0, balance: 0, count: 0 },
      loans: { disbursed: 0, paidBack: 0, fees: 0, balance: 0, count: 0 },
      totalCustomers: customers.length,
      totalRemitted: remittanceHistory.length 
        ? remittanceHistory.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)
        : 0,
    };

    // Filter entries by selected month if not "all"
    const filteredEntries = dashboardMonth === "all" 
      ? entries 
      : entries.filter((e) => getMonthKey(e.recordedAt || e.createdAt) === dashboardMonth);

    // Calculate metrics from entries for the selected period
    filteredEntries.forEach((entry) => {
      const planId = entry.planId?._id || entry.planId;
      const plan = planId ? plansById.get(planId.toString()) : null;
      if (!plan) return;

      const type = (entry.type || "").toLowerCase();
      const amount = Number(entry.amount || entry.amountPaid || entry.amountCollected || entry.withdrawalAmount || 0);
      const fee = Number(entry.fee || 0);

      if (isLoan(plan)) {
        if (type.includes("repayment") || type === "deposit") {
          stats.loans.paidBack += amount;
        }
        // If the entry itself is a fee entry, use amount. Otherwise use embedded fee.
        if (type === "fee") {
          stats.loans.fees += amount;
        } else {
          stats.loans.fees += fee;
        }
      } else {
        if (type === "deposit") {
          stats.savings.deposited += amount;
        } else if (type.includes("withdraw")) {
          stats.savings.withdrawn += amount;
        }
        
        // If the entry itself is a fee entry (maintenance etc), use amount.
        // Also capture any embedded fee property.
        if (type === "fee") {
          stats.savings.fees += amount;
        } else {
          stats.savings.fees += fee;
        }
      }

    });

    // Calculate balances and counts from plans (cumulative/current state)
    plans.forEach((plan) => {
      if (isLoan(plan)) {
        stats.loans.count += 1;
        const loanAmount = Number(plan.loanDetails?.amount || plan.loanAmount || 0);
        const netPaid = Number(plan.availableBalance || 0);
        stats.loans.balance += Math.max(0, loanAmount - netPaid);
        
        // Calculate disbursed amount for the selected period
        const planMonth = getMonthKey(plan.startDate || plan.createdAt);
        if (dashboardMonth === "all" || planMonth === dashboardMonth) {
          stats.loans.disbursed += Number(plan.loanDetails?.amount || plan.loanAmount || 0);
        }
      } else {
        stats.savings.count += 1;
        stats.savings.balance += Number(plan.availableBalance || 0);
      }
    });


    return stats;
  }, [customers, entries, plans, plansById, remittanceHistory, dashboardMonth]);






  const [selectedCollectionDate, setSelectedCollectionDate] = useState(() => getLocalDateKey(new Date()));
  const collectPaymentsByDate = useCallback(
    (targetDateKey) => {
      if (!entries.length || !targetDateKey) return [];
      const rows = [];
      entries.forEach((entry, index) => {
        const entryType = (entry.type || "").toLowerCase();
        if (!PAYMENT_TYPES.has(entryType)) {
          return;
        }

        const recordedTimestamp = entry.recordedAt;
        const createdTimestamp = entry.createdAt;
        const entryDateKey = getLocalDateKey(recordedTimestamp || createdTimestamp);
        if (!entryDateKey || entryDateKey !== targetDateKey) {
          return;
        }

        const amountValue = Number(entry.amount || 0);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
          return;
        }

        const planIdValue = entry.planId?._id || entry.planId;
        const plan = planIdValue ? plansById.get(planIdValue.toString()) : null;
        const customerIdValue = entry.customerId?._id || entry.customerId;
        const customer = customerIdValue
          ? customers.find((cust) => cust._id?.toString() === customerIdValue?.toString())
          : null;

        const setTimeIfApplicable = (timestamp) => {
          if (!timestamp) return null;

          const parseDate = new Date(timestamp);
          if (Number.isNaN(parseDate.getTime())) {
            return null;
          }

          if (typeof timestamp === "string") {
            if (!timestamp.includes("T")) {
              return null;
            }

            const timePortion = timestamp.split("T")[1] || "";
            if (timePortion.startsWith("00:00")) {
              return null;
            }
          }

          const hours = parseDate.getHours();
          const minutes = parseDate.getMinutes();
          if (hours === 0 && minutes === 0) {
            return null;
          }

          return parseDate;
        };

        const recordedTime = setTimeIfApplicable(recordedTimestamp);
        const createdTime = setTimeIfApplicable(createdTimestamp);
        const updatedTime = setTimeIfApplicable(entry.updatedAt);
        const timeValue = recordedTime || createdTime || updatedTime;

        rows.push({
          id: String(entry._id || entry.id || `${entryDateKey}-${index}`),
          time: timeValue,
          amount: amountValue,
          planName: plan?.planName || "Unknown plan",
          customerName: customer
            ? `${customer.firstName} ${customer.lastName}`
            : typeof entry.customerName === "string"
              ? entry.customerName
              : "Unknown customer",
          narration: entry.narration || "",
          type: entry.type || "payment",
        });
      });

      return rows.sort((a, b) => {
        const timeA = a.time instanceof Date ? a.time.getTime() : -Infinity;
        const timeB = b.time instanceof Date ? b.time.getTime() : -Infinity;
        return timeB - timeA;
      });
    },
    [customers, entries, getLocalDateKey, plansById, PAYMENT_TYPES],
  );

  const paymentsForSelectedDate = useMemo(
    () => collectPaymentsByDate(selectedCollectionDate),
    [collectPaymentsByDate, selectedCollectionDate],
  );

  const paymentsForResolveDate = useMemo(
    () => (resolveDate ? collectPaymentsByDate(resolveDate) : []),
    [collectPaymentsByDate, resolveDate],
  );

  const resolveSummary = useMemo(
    () => ({
      total: paymentsForResolveDate.reduce((sum, payment) => sum + payment.amount, 0),
      count: paymentsForResolveDate.length,
    }),
    [paymentsForResolveDate],
  );

  const isResolvingRemittance = remittanceStatus === "loading";

  const handleOpenResolveRemittance = useCallback(() => {
    setResolveDate(getLocalDateKey(new Date()));
    setResolveNote("");
    setResolveError("");
    setIsResolveRemittanceOpen(true);
  }, [getLocalDateKey]);

  const handleCloseResolveRemittance = useCallback(() => {
    if (isResolvingRemittance) return;
    setIsResolveRemittanceOpen(false);
  }, [isResolvingRemittance]);

  const handleResolveRemittanceSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setResolveError("");

      if (!resolveDate) {
        setResolveError("Select a collection date to resolve.");
        return;
      }

      const totalCollected = resolveSummary.total;
      const normalizedNote = resolveNote.trim();
      const fallbackNote = totalCollected ? "" : "No collections recorded on the selected date";
      const finalNote = normalizedNote || fallbackNote;

      if (!cso?._id) {
        setResolveError("CSO details are unavailable. Please try again later.");
        return;
      }

      const formattedDate = new Date(resolveDate).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const remarkSuffix = totalCollected ? "" : " (no collections recorded)";

      try {
        await dispatch(
          recordCsoRemittance({
            csoId: cso._id,
            amountCollected: totalCollected,
            remark: `Resolved by admin for ${formattedDate}${remarkSuffix}`,
            resolvedIssue: finalNote,
            
            resolutionDate: resolveDate,
          }),
        ).unwrap();

        setIsResolveRemittanceOpen(false);
        setResolveNote(" ");
        setResolveError("");
        setResolveDate(getLocalDateKey(new Date()));
        dispatch(fetchAdminCsoDetail(cso._id)).catch(() => {});
      } catch (error) {
        setResolveError(error?.message || String(error) || "Failed to resolve remittance.");
      }
    },
    [
      cso,
      dispatch,
      getLocalDateKey,
      recordCsoRemittance,
      fetchAdminCsoDetail,
      resolveDate,
      resolveNote,
      resolveSummary.total,
    ],
  );

  const renderCollectionsTab = () => {
    const totals = paymentsForSelectedDate.reduce(
      (acc, payment) => {
        acc.total += payment.amount;
        acc.count += 1;
        if (payment.planName) {
          acc.planSet.add(payment.planName);
        }
        return acc;
      },
      { total: 0, count: 0, planSet: new Set() },
    );

    const formattedDate = selectedCollectionDate
      ? new Date(selectedCollectionDate).toLocaleDateString(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not selected";

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Daily collections</h3>
            <p className="text-sm text-slate-500">
              Review payments recorded under this CSO for a specific date.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              <input
                type="date"
                value={selectedCollectionDate || ""}
                onChange={(event) => setSelectedCollectionDate(event.target.value)}
                className="rounded-full border border-slate-100 px-3 py-1 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedCollectionDate(getLocalDateKey(new Date()))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              Reset to today
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{formattedDate}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total collected</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.total)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Plans</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.planSet.size}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          {paymentsForSelectedDate.length ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Narration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-600">
                {paymentsForSelectedDate.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatTime(payment.time)}
                    </td>
                    <td className="px-4 py-3">{payment.customerName}</td>
                    <td className="px-4 py-3">{payment.planName}</td>
                    <td className="px-4 py-3">{humanizeType(payment.type)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{payment.narration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No payments recorded for this date.
            </div>
          )}
        </div>
      </div>
    );
  };

  const ensurePlanFilters = useCallback(
    (planId) => {
      if (!planId) return createDefaultPlanFilter();
      return planFilters[planId] || createDefaultPlanFilter();
    },
    [planFilters],
  );

  const handlePlanFilterChange = useCallback(
    (planId, updates) => {
      if (!planId) return;
      setPlanFilters((prev) => ({
        ...prev,
        [planId]: {
          ...createDefaultPlanFilter(),
          ...(prev[planId] || {}),
          ...updates,
        },
      }));
    },
    [],
  );

  const getPlanEntries = useCallback(
    (planId) => {
      if (!planId) return [];
      return entries.filter((entry) => {
        const entryPlanId = entry.planId?._id || entry.planId;
        return entryPlanId?.toString() === planId.toString();
      });
    },
    [entries],
  );

  const renderPlanPaymentsSection = useCallback(
    (plan, filterState, planEntriesArg, monthEntriesArg) => {
      const planEntries = planEntriesArg ?? getPlanEntries(plan._id) ?? [];
      const months = getUniqueMonthsForEntries(planEntries);
      const monthScopedEntries = monthEntriesArg ?? filterEntriesByMonth(planEntries, filterState.paymentsMonth);
      const filteredPaymentsEntries = monthScopedEntries.filter((entry) => {
        const entryType = (entry.type || "").toLowerCase();
        return PAYMENT_TYPES.has(entryType);
      });

      const paymentRows = filteredPaymentsEntries.map((entry) => ({
        id: entry._id || entry.id,
        dateKey: getLocalDateKey(entry.recordedAt || entry.createdAt || entry.updatedAt),
        time: entry.recordedAt || entry.createdAt || entry.updatedAt,
        amount: getEntryAmount(entry),
        type: entry.type,
        narration: entry.narration || entry.description || "",
      }));

      const totalCollected = paymentRows.reduce((sum, row) => sum + row.amount, 0);

      return (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily payments</p>
              <p className="text-xs text-slate-500">
                Filter deposits and repayments by month to review the plan’s cash inflow.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor={`payments-month-${plan._id}`}>
                Month
              </label>
              <select
                id={`payments-month-${plan._id}`}
                value={filterState.paymentsMonth}
                onChange={(event) => handlePlanFilterChange(plan._id, { paymentsMonth: event.target.value })}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All months</option>
                {months.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
              <div className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600">
                Total: {formatCurrency(totalCollected)}
              </div>
              <button
                type="button"
                onClick={() => handlePlanFilterChange(plan._id, { showTransactions: !filterState.showTransactions })}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                {filterState.showTransactions ? "Hide" : "View"} transaction history
              </button>
            </div>
          </div>

          {/* <div className="overflow-x-auto rounded-2xl border border-slate-200">
            {filterState.showTransactions ? (
              paymentRows.length ? (
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Narration</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paymentRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatDateTime(row.time)}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{humanizeType(row.type)}</td>
                        <td className="px-4 py-3 text-slate-500">{row.narration || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No payments found for this month.
                </div>
              )
            ) : (
              <div className="px-5 py-6 text-center text-sm text-slate-500">
                Click “View transaction history” to see daily payment details for this plan.
              </div>
            )}
          </div> */}
        </div>
      );
    },
    [PAYMENT_TYPES, filterEntriesByMonth, formatDateTime, formatMonthLabel, formatCurrency, getEntryAmount, getPlanEntries, getUniqueMonthsForEntries, handlePlanFilterChange, humanizeType],
  );

  const renderPlanTransactionsSection = useCallback(
    (plan, filterState, planEntriesArg) => {
      if (!filterState.showTransactions) {
        return null;
      }

      const planEntries = planEntriesArg ?? getPlanEntries(plan._id) ?? [];
      const months = getUniqueMonthsForEntries(planEntries);
      const filteredEntries = filterEntriesByMonth(planEntries, filterState.transactionsMonth);

      const groupedEntries = filteredEntries.map((entry) => ({
        id: entry._id || entry.id,
        type: entry.type || "payment",
        amount: getEntryAmount(entry),
        narration: entry.narration || entry.description || "",
        timestamp: entry.recordedAt || entry.createdAt || entry.updatedAt,
        metadata: {
          fee: entry.fee,
          deposit: entry.amount,
          withdrawal: entry.withdrawalAmount,
          balance: entry.balanceAfter,
        },
      }));

      const totals = groupedEntries.reduce(
        (acc, entry) => {
          const type = (entry.type || "").toLowerCase();
          const amount = entry.amount;
          if (!Number.isFinite(amount)) {
            return acc;
          }

          if (type.includes("withdraw")) {
            acc.withdrawals += amount;
          } else if (type.includes("fee")) {
            acc.fees += amount;
          } else {
            acc.deposits += amount;
          }
          acc.total += amount;
          return acc;
        },
        { deposits: 0, fees: 0, withdrawals: 0, total: 0 },
      );

      return (
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Transaction history</p>
              <p className="text-xs text-primary/80">
                Explore all recorded movements (deposits, fees, withdrawals) for this plan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-primary/80" htmlFor={`transactions-month-${plan._id}`}>
                Month
              </label>
              <select
                id={`transactions-month-${plan._id}`}
                value={filterState.transactionsMonth}
                onChange={(event) => handlePlanFilterChange(plan._id, { transactionsMonth: event.target.value })}
                className="rounded-full border border-primary/30 px-3 py-1.5 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All months</option>
                {months.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-primary/20 bg-white p-3 text-xs text-slate-500 sm:grid-cols-4">
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="font-semibold text-primary">Deposits</p>
              <p className="mt-1 text-base text-slate-900">{formatCurrency(totals.deposits)}</p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="font-semibold text-primary">Fees</p>
              <p className="mt-1 text-base text-slate-900">{formatCurrency(totals.fees)}</p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="font-semibold text-primary">Withdrawals</p>
              <p className="mt-1 text-base text-slate-900">{formatCurrency(totals.withdrawals)}</p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 text-center">
              <p className="font-semibold text-primary">Net total</p>
              <p className="mt-1 text-base text-slate-900">{formatCurrency(totals.total)}</p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-primary/20 bg-white">
            {groupedEntries.length ? (
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-primary/10 text-xs uppercase tracking-wide text-primary">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Narration</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {groupedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-primary/5">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatDateTime(entry.timestamp)}</td>
                      <td className="px-4 py-3 font-medium text-primary">{humanizeType(entry.type)}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.narration || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No transactions recorded for this month.
              </div>
            )}
          </div>
        </div>
      );
    },
    [filterEntriesByMonth, formatCurrency, formatDateTime, formatMonthLabel, getEntryAmount, getPlanEntries, getUniqueMonthsForEntries, handlePlanFilterChange, humanizeType],
  );

  const renderCustomersTab = () => {
    if (!customers.length) {
      return (
        <EmptyTab
          title="No customers yet"
          description="Once the CSO onboard customers, their savings performance will appear here."
        />
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {customers.map((customer) => {
            const summary = customer.savingsSummary || {};
            return (
              <article
                key={customer._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">{customer.phone}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Users className="h-3.5 w-3.5" />
                    {summary.totalPlans || 0} plans
                  </span>
                </header>

                <p className="mt-3 text-sm text-slate-500">{customer.address}</p>

                <dl className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Active plans</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{summary.activePlans || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Deposited</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">
                      {formatCurrency(summary.totalDeposited || 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Available</dt>
                    <dd className="mt-1 text-base font-semibold text-emerald-600">
                      {formatCurrency(summary.availableBalance || 0)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlanModalCustomerId(customer._id);
                      setPlanFilters({});
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
                  >
                    View plans <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRemittanceTab = () => {
    const totalRemitted = remittanceHistory.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
    const lastRemittanceDate = remittanceHistory.length
      ? new Date(remittanceHistory[0].createdAt || remittanceHistory[0].updatedAt || Date.now()).toLocaleString()
      : "—";

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total remitted</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalRemitted)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Remittance count</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{remittanceHistory.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Last remittance</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{lastRemittanceDate}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Resolve outstanding remittance</p>
            <p className="text-xs text-slate-500">
              Pick a collection date to auto-fill the daily collections and log how the issue was resolved.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenResolveRemittance}
            disabled={isResolvingRemittance}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
          >
            {isResolvingRemittance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>Resolve remittance</span>
          </button>
        </div>

        {remittanceError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {remittanceError}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          {remittanceHistory.length ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount collected</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount remitted</th>
                  <th className="px-4 py-3 text-left font-semibold">Remark</th>
                  <th className="px-4 py-3 text-left font-semibold">Resolution note</th>
                  <th className="px-4 py-3 text-right font-semibold">Resolved amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-600">
                {remittanceHistory.map((item, index) => (
                  <tr key={`${item.createdAt}-${index}`} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {new Date(item.createdAt || item.updatedAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.amountCollected || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(item.amountPaid || item.amountRemitted || 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.remark || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.resolvedIssue || item.issueResolution || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.resolution || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              This CSO has not recorded any remittance yet. Once submissions are made, they will appear here.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboardTab = () => {
    const uniqueMonths = getUniqueMonthsForEntries(entries);
    
    if (!customers.length && !remittanceHistory.length) {
      return (
        <EmptyTab
          title="Insufficient data"
          description="More portfolio activity is required before the dashboard can display meaningful insights."
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Portfolio analytics</h3>
            <p className="text-sm text-slate-500">
              Overview of savings, loans, and fees performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600" htmlFor="dashboard-month">
              Filter by month:
            </label>
            <select
              id="dashboard-month"
              value={dashboardMonth}
              onChange={(e) => setDashboardMonth(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All cumulative periods</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          {/* Savings Section */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Savings Section</h4>
                <p className="text-xs text-slate-400">Activity for {dashboardMonth === "all" ? "all time" : formatMonthLabel(dashboardMonth)}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <PiggyBank className="h-6 w-6" />
              </div>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Total saved</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.savings.deposited)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Maintenance fees</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.savings.fees)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Total withdrawals</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.savings.withdrawn)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-emerald-50/50 p-4">
                <dt className="text-xs font-semibold text-emerald-600 capitalize">Current balance</dt>
                <dd className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(dashboardStats.savings.balance)}</dd>
              </div>
            </dl>
          </article>

          {/* Loan Section */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Loan Section</h4>
                <p className="text-xs text-slate-400">Performance targets and returns</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-2 text-amber-600">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Total disbursed</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.loans.disbursed)}</dd>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Total paid back</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.loans.paidBack)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-400 capitalize">Loan fees</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(dashboardStats.loans.fees)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-amber-50/50 p-4">
                <dt className="text-xs font-semibold text-amber-600 capitalize">Loan balance</dt>
                <dd className="mt-1 text-lg font-semibold text-amber-700">{formatCurrency(dashboardStats.loans.balance)}</dd>
              </div>
            </dl>
          </article>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total customers</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardStats.totalCustomers}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Portfolio accounts</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{dashboardStats.savings.count + dashboardStats.loans.count}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cumulative remittance</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(dashboardStats.totalRemitted)}</p>
          </div>
        </div>
      </div>
    );
  };


  const handleStatusToggle = () => {
    if (!cso) return;
    dispatch(updateCsoStatus({ csoId: cso._id, isActive: !cso.isActive }));
  };

  // Transfer Logic
  const { items: allCsos } = useSelector((state) => state.csos);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetCsoId, setTargetCsoId] = useState("");
  const [transferError, setTransferError] = useState("");

  const availableCsos = allCsos.filter((item) => item._id !== csoId && item.isActive);

  const handleToggleCustomer = (customerId) => {
    const next = new Set(selectedCustomerIds);
    if (next.has(customerId)) {
      next.delete(customerId);
    } else {
      next.add(customerId);
    }
    setSelectedCustomerIds(next);
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomerIds.size === customers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(customers.map((c) => c._id)));
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError("");

    if (!targetCsoId) {
      setTransferError("Please select a target CSO.");
      return;
    }

    try {
      await dispatch(
        transferCustomers({
          targetCsoId,
          customerIds: Array.from(selectedCustomerIds),
        })
      ).unwrap();

      setIsTransferModalOpen(false);
      setSelectedCustomerIds(new Set());
      setTargetCsoId("");
      dispatch(fetchAdminCsoDetail(csoId)); // Refresh current CSO data
    } catch (err) {
      setTransferError(err || "Failed to transfer customers.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cso) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CSO list
        </button>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center shadow-sm">
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">CSO not found</h2>
            <p className="max-w-sm text-sm text-slate-500">
              The CSO you are looking for may have been removed. Return to the directory to continue managing officers.
            </p>
            <Link
              to="/admin/cso"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Go to CSO directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CSO list
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              {cso.firstName} {cso.lastName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{cso.branchName}</p>
          </div>
          <Badge active={cso.isActive} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStatusToggle}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              cso.isActive
                ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {cso.isActive ? "Suspend CSO" : "Activate CSO"}
          </button>
        </div>
      </div>

      {mutationError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {mutationError}
        </div>
      ) : null}

      {detailError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {detailError}
        </div>
      ) : null}

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />

      <div className="min-h-[280px]">
        {detailStatus === "loading" && activeTab !== "details" ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading data…
          </div>
        ) : null}

        {activeTab === "details" ? (
          <DetailsTab cso={cso} />
        ) : activeTab === "customers" ? (
          <div className="space-y-5">
            {customers.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.size === customers.length && customers.length > 0}
                    onChange={handleSelectAllCustomers}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Select All ({selectedCustomerIds.size} selected)
                  </span>
                </div>
                {selectedCustomerIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                  >
                    Transfer to another CSO
                  </button>
                )}
              </div>
            )}
            
            {!customers.length ? (
              <EmptyTab
                title="No customers yet"
                description="Once the CSO onboard customers, their savings performance will appear here."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {customers.map((customer) => {
                  const summary = customer.savingsSummary || {};
                  return (
                    <article
                      key={customer._id}
                      className={`relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg ${
                        selectedCustomerIds.has(customer._id) ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="absolute right-4 top-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.has(customer._id)}
                          onChange={() => handleToggleCustomer(customer._id)}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                      <header className="flex items-start justify-between gap-3 pr-8">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <p className="text-sm text-slate-500">{customer.phone}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <Users className="h-3.5 w-3.5" />
                          {summary.totalPlans || 0} plans
                        </span>
                      </header>

                      <p className="mt-3 text-sm text-slate-500">{customer.address}</p>

                      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Active plans</dt>
                          <dd className="mt-1 text-base font-semibold text-slate-900">{summary.activePlans || 0}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Deposited</dt>
                          <dd className="mt-1 text-base font-semibold text-slate-900">
                            {formatCurrency(summary.totalDeposited || 0)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Available</dt>
                          <dd className="mt-1 text-base font-semibold text-emerald-600">
                            {formatCurrency(summary.availableBalance || 0)}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling selection
                            setPlanModalCustomerId(customer._id);
                            setPlanFilters({});
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
                        >
                          View plans <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "remittance" ? (
          renderRemittanceTab()
        ) : activeTab === "collections" ? (
          renderCollectionsTab()
        ) : activeTab === "dashboard" ? (
          renderDashboardTab()
        ) : null}
      </div>

      {isResolveRemittanceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Resolve remittance</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Capture outstanding collections</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the collection day to reconcile. The total collected will be logged automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseResolveRemittance}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close resolve remittance"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleResolveRemittanceSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="resolve-date">
                  Collection date
                </label>
                <input
                  id="resolve-date"
                  type="date"
                  value={resolveDate.trim()}
                  onChange={(event) => {
                    setResolveDate(event.target.value);
                    setResolveError("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>Total collected</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(resolveSummary.total)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {resolveSummary.count} payment{resolveSummary.count === 1 ? "" : "s"} found for this day.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="resolve-note">
                  Resolution note
                </label>
                <textarea
                  id="resolve-note"
                  value={resolveNote}
                  onChange={(event) => {
                    setResolveNote(event.target.value);
                    setResolveError("");
                  }}
                  rows={3}
                  placeholder="Describe how this remittance was resolved"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {resolveError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {resolveError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseResolveRemittance}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  disabled={isResolvingRemittance}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolvingRemittance}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                >
                  {isResolvingRemittance ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Resolve remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Transfer Modal */}
      {isTransferModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Transfer Customers</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Select Target CSO</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-5 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Target CSO</label>
                <select
                  value={targetCsoId}
                  onChange={(e) => setTargetCsoId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Select a CSO...</option>
                  {availableCsos.map((cso) => (
                    <option key={cso._id} value={cso._id}>
                      {cso.firstName} {cso.lastName} ({cso.branchName})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Transferring <strong>{selectedCustomerIds.size}</strong> customer(s) and their plans/loans.
                </p>
              </div>

              {transferError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {transferError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  disabled={mutationStatus === 'loading'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutationStatus === 'loading'}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
                >
                  {mutationStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {planModalCustomerId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Customer plans</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {modalCustomer ? `${modalCustomer.firstName} ${modalCustomer.lastName}` : "Customer"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPlanModalCustomerId(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close plans modal"
              >
                <ArrowUpRight className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {modalCustomerPlans.length ? (
                modalCustomerPlans.map((plan) => {
                  const filters = ensurePlanFilters(plan._id);
                  const planEntries = getPlanEntries(plan._id) || [];
                  const monthScopedEntries = filterEntriesByMonth(planEntries, filters.paymentsMonth);
                  const paymentEntriesForMonth = monthScopedEntries.filter((entry) =>
                    PAYMENT_TYPES.has((entry.type || "").toLowerCase()),
                  );
                  const depositedThisMonth = paymentEntriesForMonth.reduce(
                    (sum, entry) => sum + getEntryAmount(entry),
                    0,
                  );
                  const withdrawalsThisMonth = monthScopedEntries.reduce((sum, entry) => {
                    const type = (entry.type || "").toLowerCase();
                    if (!type.includes("withdraw")) {
                      return sum;
                    }
                    const amount = Math.abs(getEntryAmount(entry));
                    return Number.isFinite(amount) ? sum + amount : sum;
                  }, 0);
                  const dailyContribution = Number(
                    plan.dailyContribution || plan.expectedDailyContribution || 0,
                  );
                  const loanPrincipal = Number(
                    plan.loanDetails?.amount ?? plan.loanAmount ?? plan.loanPrincipal ?? plan.loan?.principal ?? 0,
                  );
                  const loanDisbursed = Number(plan.loanDetails?.disbursedAmount ?? plan.loan?.amountDisbursed ?? loanPrincipal);
                  const loanAmountRaw = loanDisbursed > 0 ? loanDisbursed : loanPrincipal;
                  const loanPaidRaw = Number(
                    plan.loanDetails?.amountPaid ?? plan.loanAmountPaid ?? plan.loanRepaid ?? 0,
                  );
                  const planLoanPayments = entries.reduce((acc, entry) => {
                    const entryPlanId = entry.planId?._id || entry.planId;
                    if (!entryPlanId) return acc;
                    if (entryPlanId.toString() !== plan._id?.toString()) return acc;
                    const entryType = (entry.type || "").toLowerCase();

                    const amountValue = Number(entry.amount || 0);
                    if (!Number.isFinite(amountValue) || amountValue <= 0) return acc;

                    const isLoanRepaymentType = LOAN_PAYMENT_TYPES.has(entryType);
                    const allowDepositAsLoanPayment = entryType === "deposit" && plan.isLoan && loanAmountRaw > 0;

                    if (!isLoanRepaymentType && !allowDepositAsLoanPayment) {
                      return acc;
                    }

                    return acc + amountValue;
                  }, 0);
                  const availableAfterFees = Number(plan.availableBalance || 0);
                  const derivedLoanPaid = availableAfterFees > 0 ? availableAfterFees : planLoanPayments;
                  const effectiveLoanPaid = loanPaidRaw > 0 ? loanPaidRaw : derivedLoanPaid;
                  const normalizedLoanPaid = Math.min(Math.max(effectiveLoanPaid, 0), loanAmountRaw);
                  const loanBalanceRaw = Math.max(0, loanAmountRaw - normalizedLoanPaid);
                  const loanStatusRaw = (plan.loanDetails?.status || "").toString();
                  const loanStatusNormalized = loanStatusRaw.toLowerCase();
                  const activeLoanKeywords = [
                    "active",
                    "ongoing",
                    "repayment",
                    "in_repayment",
                    "in-repayment",
                    "processing",
                    "approved",
                    "disbursed",
                  ];
                  const hasActiveLoan = Boolean(
                    loanAmountRaw > 0 && loanBalanceRaw > 0 &&
                    (
                      plan.hasActiveLoan ||
                      plan.loanDetails?.isActive ||
                      activeLoanKeywords.some((keyword) => loanStatusNormalized.includes(keyword))
                    ),
                  );

                  return (
                    <div key={plan._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{plan.planName}</p>
                          <p className="text-xs text-slate-500">
                            Daily contribution: {formatCurrency(dailyContribution)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasActiveLoan ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              Active loan
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                              plan.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {plan.status || "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Deposited</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(depositedThisMonth)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Available</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(plan.availableBalance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
                          <p className="text-sm font-semibold text-rose-600">
                            {formatCurrency(withdrawalsThisMonth)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Start date</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "Not provided"}
                          </p>
                        </div>
                      </div>

                      {renderPlanPaymentsSection(plan, filters, planEntries, monthScopedEntries)}
                      {renderPlanTransactionsSection(plan, filters, planEntries)}

                      {hasActiveLoan ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Loan summary</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Loan amount</p>
                              <p className="text-sm font-semibold text-amber-700">{formatCurrency(loanAmountRaw)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Paid so far</p>
                              <p className="text-sm font-semibold text-amber-700">{formatCurrency(normalizedLoanPaid)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Balance</p>
                              <p className="text-sm font-semibold text-amber-700">{formatCurrency(loanBalanceRaw)}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Daily repayment</p>
                              <p className="text-sm font-semibold text-amber-700">
                                {formatCurrency(plan.loanDetails?.dailyAmount || dailyContribution)} per day
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Status</p>
                              <p className="text-sm font-semibold text-amber-700">
                                {plan.loanDetails?.status
                                  ? humanizeType(plan.loanDetails.status)
                                  : "Active"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  No plans recorded for this customer yet.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setPlanModalCustomerId(null)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
