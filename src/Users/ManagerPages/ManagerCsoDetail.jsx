import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchManagerCsoDetail,
  resetManagerData,
  fetchManagerCsos,
} from "../../redux/slices/managerDataSlice.jsx";
import { recordCsoRemittance } from "../../redux/slices/csoSlice.jsx";
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
  { key: "dashboard", label: "Dashboard" },
  { key: "customers", label: "Customers" },
  { key: "remittance", label: "Remittance" },
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

export default function ManagerCsoDetail() {
  const { csoId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    csoDetail: {
      data: cso,
      status,
      error,
      customers,
      plans,
      entries,
    },
  } = useSelector((state) => state.managerData);

  const [activeTab, setActiveTab] = useState("details");
  const [dashboardMonth, setDashboardMonth] = useState("all");
  const [planModalCustomerId, setPlanModalCustomerId] = useState(null);
  const [planFilters, setPlanFilters] = useState({});

  useEffect(() => {
    if (csoId) {
      dispatch(fetchManagerCsoDetail(csoId));
      dispatch(fetchManagerCsos());
    }
  }, [csoId, dispatch]);

  const isLoading = status === "loading" || status === "idle";







  const remittanceHistory = useMemo(() => {
    if (!Array.isArray(cso?.remittance)) return [];
    return [...cso.remittance].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [cso?.remittance]);

  const plansMap = useMemo(() => {
    const map = new Map();
    plans.forEach((p) => {
      if (p._id) map.set(p._id.toString(), p);
    });
    return map;
  }, [plans]);

  const dashboardStats = useMemo(() => {

    const isLoan = (p) => {
      const status = (p.loanStatus || "").toLowerCase();
      // Also check planType or isLoan flag if available in manager data
      const type = (p.planType || "").toLowerCase();
      return ["approved", "active", "completed"].includes(status) || p.isLoan === true || type === "loan";
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
      const plan = planId ? plansMap.get(planId.toString()) : null;
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
        stats.loans.balance += Number(plan.loanDetails?.balance || plan.availableBalance || 0);
        
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
  }, [customers, entries, plans, plansMap, remittanceHistory, dashboardMonth]);

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




  const modalCustomer = useMemo(
    () => customers.find((customer) => customer._id === planModalCustomerId),
    [customers, planModalCustomerId]
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







  const ensurePlanFilters = useCallback(
    (planId) => {
      if (!planId) return createDefaultPlanFilter();
      return planFilters[planId] || createDefaultPlanFilter();
    },
    [planFilters]
  );

  const handlePlanFilterChange = useCallback((planId, updates) => {
    if (!planId) return;
    setPlanFilters((prev) => ({
      ...prev,
      [planId]: {
        ...createDefaultPlanFilter(),
        ...(prev[planId] || {}),
        ...updates,
      },
    }));
  }, []);

  const getPlanEntries = useCallback(
    (planId) => {
      if (!planId) return [];
      return entries.filter((entry) => {
        const entryPlanId = entry.planId?._id || entry.planId;
        return entryPlanId?.toString() === planId.toString();
      });
    },
    [entries]
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
              <label
                className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                htmlFor={`payments-month-${plan._id}`}
              >
                Month
              </label>
              <select
                id={`payments-month-${plan._id}`}
                value={filterState.paymentsMonth}
                onChange={(event) =>
                  handlePlanFilterChange(plan._id, {
                    paymentsMonth: event.target.value,
                  })
                }
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
                onClick={() =>
                  handlePlanFilterChange(plan._id, {
                    showTransactions: !filterState.showTransactions,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                {filterState.showTransactions ? "Hide" : "View"} transaction history
              </button>
            </div>
          </div>
        </div>
      );
    },
    [PAYMENT_TYPES, filterEntriesByMonth, formatMonthLabel, formatCurrency, getEntryAmount, getPlanEntries, getUniqueMonthsForEntries, handlePlanFilterChange]
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
      }));

      const totals = groupedEntries.reduce(
        (acc, entry) => {
          const type = (entry.type || "").toLowerCase();
          const amount = entry.amount;
          if (!Number.isFinite(amount)) return acc;

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
        { deposits: 0, fees: 0, withdrawals: 0, total: 0 }
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
              <label
                className="text-xs font-semibold uppercase tracking-wide text-primary/80"
                htmlFor={`transactions-month-${plan._id}`}
              >
                Month
              </label>
              <select
                id={`transactions-month-${plan._id}`}
                value={filterState.transactionsMonth}
                onChange={(event) =>
                  handlePlanFilterChange(plan._id, {
                    transactionsMonth: event.target.value,
                  })
                }
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
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">{humanizeType(entry.type)}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.narration || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(entry.amount)}
                      </td>
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
    [filterEntriesByMonth, formatCurrency, formatDateTime, formatMonthLabel, getEntryAmount, getPlanEntries, getUniqueMonthsForEntries, handlePlanFilterChange, humanizeType]
  );

  const [selectedCollectionDate, setSelectedCollectionDate] = useState(() => getLocalDateKey(new Date()));
  const [resolveDate, setResolveDate] = useState(" ");
  const [resolveNote, setResolveNote] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [isResolveRemittanceOpen, setIsResolveRemittanceOpen] = useState(false);

  const plansById = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => {
      if (plan?._id) map.set(plan._id.toString(), plan);
    });
    return map;
  }, [plans]);

  const collectPaymentsByDate = useCallback(
    (targetDateKey) => {
      if (!entries.length || !targetDateKey) return [];
      const rows = [];
      entries.forEach((entry, index) => {
        const entryType = (entry.type || "").toLowerCase();
        if (!PAYMENT_TYPES.has(entryType)) return;

        const recordedTimestamp = entry.recordedAt;
        const createdTimestamp = entry.createdAt;
        const entryDateKey = getLocalDateKey(recordedTimestamp || createdTimestamp);
        if (!entryDateKey || entryDateKey !== targetDateKey) return;

        const amountValue = Number(entry.amount || 0);
        if (!Number.isFinite(amountValue) || amountValue <= 0) return;

        const planIdValue = entry.planId?._id || entry.planId;
        const plan = planIdValue ? plansById.get(planIdValue.toString()) : null;
        const customerIdValue = entry.customerId?._id || entry.customerId;
        const customer = customerIdValue
          ? customers.find((cust) => cust._id?.toString() === customerIdValue?.toString())
          : null;

        const setTimeIfApplicable = (timestamp) => {
          if (!timestamp) return null;
          const parseDate = new Date(timestamp);
          if (Number.isNaN(parseDate.getTime())) return null;
          const hours = parseDate.getHours();
          const minutes = parseDate.getMinutes();
          if (hours === 0 && minutes === 0) return null;
          return parseDate;
        };

        const timeValue =
          setTimeIfApplicable(recordedTimestamp) ||
          setTimeIfApplicable(createdTimestamp) ||
          setTimeIfApplicable(entry.updatedAt);

        rows.push({
          id: String(entry._id || entry.id || `${entryDateKey}-${index}`),
          time: timeValue,
          amount: amountValue,
          planName: plan?.planName || "Unknown plan",
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown customer",
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
    [customers, entries, getLocalDateKey, plansById, PAYMENT_TYPES]
  );

  const paymentsForSelectedDate = useMemo(
    () => collectPaymentsByDate(selectedCollectionDate),
    [collectPaymentsByDate, selectedCollectionDate]
  );

  const paymentsForResolveDate = useMemo(
    () => (resolveDate ? collectPaymentsByDate(resolveDate) : []),
    [collectPaymentsByDate, resolveDate]
  );

  const resolveSummary = useMemo(
    () => ({
      total: paymentsForResolveDate.reduce((sum, payment) => sum + payment.amount, 0),
      count: paymentsForResolveDate.length,
    }),
    [paymentsForResolveDate]
  );

  const handleOpenResolveRemittance = useCallback(() => {
    setResolveDate(getLocalDateKey(new Date()));
    setResolveNote("");
    setResolveError("");
    setIsResolveRemittanceOpen(true);
  }, [getLocalDateKey]);

  const handleResolveRemittanceSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setResolveError("");
      if (!resolveDate) {
        setResolveError("Select a collection date to resolve.");
        return;
      }
      const totalCollected = resolveSummary.total;
      try {
        await dispatch(
          recordCsoRemittance({
            csoId: cso._id,
            amountCollected: totalCollected,
            remark: `Resolved by manager for ${new Date(resolveDate).toLocaleDateString()}`,
            resolvedIssue: resolveNote || "Manual resolution",
            resolutionDate: resolveDate,
          })
        ).unwrap();
        setIsResolveRemittanceOpen(false);
        dispatch(fetchManagerCsoDetail(cso._id));
      } catch (err) {
        setResolveError(err?.message || "Failed to resolve remittance.");
      }
    },
    [cso, dispatch, resolveDate, resolveNote, resolveSummary.total]
  );



  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-500">Loading CSO profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="max-w-xs space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Unable to load CSO</h3>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button
          onClick={() => navigate("/manager/csos")}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CSOs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/manager/csos")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">
                {cso?.firstName} {cso?.lastName}
              </h1>
              <Badge active={cso?.isActive} />
            </div>
            <p className="text-sm text-slate-500">CSO Profile & Performance</p>
          </div>
        </div>
      </header>

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />

      <div className="mt-8">
        {activeTab === "details" && <DetailsTab cso={cso} />}
        {activeTab === "customers" && (
          <div className="space-y-5">

            {!customers.length ? (
              <EmptyTab
                title="No customers yet"
                description="Once the CSO onboards customers, their savings performance will appear here."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {customers.map((customer) => {
                  const summary = customer.savingsSummary || {};
                  return (
                    <article
                      key={customer._id}
                      className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
                    >
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
            )}
          </div>
        )}
        {activeTab === "remittance" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total remitted</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(dashboardStats.totalRemitted)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Remittance count</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{remittanceHistory.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Last remittance</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {remittanceHistory.length ? new Date(remittanceHistory[0].createdAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Resolve outstanding remittance</p>
                <p className="text-xs text-slate-500">Pick a collection date to reconcile issues manually.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenResolveRemittance}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Resolve remittance
              </button>
            </div>

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
                      <tr key={index} className="hover:bg-slate-50">
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
        )}
      {activeTab === "dashboard" && renderDashboardTab()}
        {activeTab === "collections" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Daily collections</h3>
                <p className="text-sm text-slate-500">Review payments recorded for a specific date.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <input
                    type="date"
                    value={selectedCollectionDate || ""}
                    onChange={(e) => setSelectedCollectionDate(e.target.value)}
                    className="rounded-full border border-slate-100 px-3 py-1 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCollectionDate(getLocalDateKey(new Date()))}
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-primary"
                >
                  Reset to today
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedCollectionDate
                    ? new Date(selectedCollectionDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total collected</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCurrency(paymentsForSelectedDate.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payments</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{paymentsForSelectedDate.length}</p>
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
                        <td className="px-4 py-3 font-medium text-slate-900">{formatTime(payment.time)}</td>
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
                <div className="px-6 py-12 text-center text-slate-500">No collections found for this date.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {isResolveRemittanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Resolve remittance</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Resolve Outstanding Issues</h3>
              </div>
              <button onClick={() => setIsResolveRemittanceOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleResolveRemittanceSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Collection date</label>
                <input
                  type="date"
                  value={resolveDate}
                  onChange={(e) => setResolveDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  required
                />
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-sm flex justify-between">
                <span className="text-slate-500">Total collected for date:</span>
                <span className="font-semibold">{formatCurrency(resolveSummary.total)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Resolution note</label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  rows={3}
                  placeholder="Describe the resolution..."
                />
              </div>
              {resolveError && <p className="text-sm text-rose-500">{resolveError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResolveRemittanceOpen(false)}
                  className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    PAYMENT_TYPES.has((entry.type || "").toLowerCase())
                  );
                  const depositedThisMonth = paymentEntriesForMonth.reduce(
                    (sum, entry) => sum + getEntryAmount(entry),
                    0
                  );
                  const withdrawalsThisMonth = monthScopedEntries.reduce((sum, entry) => {
                    const type = (entry.type || "").toLowerCase();
                    if (!type.includes("withdraw")) {
                      return sum;
                    }
                    const amount = Math.abs(getEntryAmount(entry));
                    return Number.isFinite(amount) ? sum + amount : sum;
                  }, 0);
                  const dailyContribution = Number(plan.dailyContribution || plan.expectedDailyContribution || 0);

                  const loanPrincipal = Number(
                    plan.loanDetails?.amount ?? plan.loanAmount ?? plan.loanPrincipal ?? plan.loan?.principal ?? 0
                  );
                  const loanDisbursed = Number(
                    plan.loanDetails?.disbursedAmount ?? plan.loan?.amountDisbursed ?? loanPrincipal
                  );
                  const loanAmountRaw = loanDisbursed > 0 ? loanDisbursed : loanPrincipal;
                  const loanPaidRaw = Number(plan.loanDetails?.amountPaid ?? plan.loanAmountPaid ?? plan.loanRepaid ?? 0);
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
                    loanAmountRaw > 0 &&
                      loanBalanceRaw > 0 &&
                      (plan.hasActiveLoan ||
                        plan.loanDetails?.isActive ||
                        activeLoanKeywords.some((keyword) => loanStatusNormalized.includes(keyword)))
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
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(depositedThisMonth)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Available</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(plan.availableBalance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
                          <p className="text-sm font-semibold text-rose-600">{formatCurrency(withdrawalsThisMonth)}</p>
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
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">
                                Loan amount
                              </p>
                              <p className="text-sm font-semibold text-amber-700">{formatCurrency(loanAmountRaw)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">
                                Paid so far
                              </p>
                              <p className="text-sm font-semibold text-amber-700">
                                {formatCurrency(normalizedLoanPaid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Balance</p>
                              <p className="text-sm font-semibold text-amber-700">{formatCurrency(loanBalanceRaw)}</p>
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
