import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  fetchCustomerById,
  updateCustomer,
  archiveCustomer,
  clearCustomerState,
} from "../../../redux/slices/customersSlice";
import {
  fetchSavingsPlans,
  fetchSavingsPlanById,
  recordSavingsDeposit,
  createSavingsWithdrawalRequest,
  updateSavingsPlanStatus,
  fetchSavingsEntries,
  clearSavingsState,
  createSavingsPlanForCustomer,
  requestSavingsLoan,
  updateSavingsDailyContribution,
} from "../../../redux/slices/savingsSlice";
import { fetchCsoProfile } from "../../../redux/slices/csoAuthSlice";
import { 
  createBackdateRequest, 
  fetchCsoBackdateRequests,
  clearBackdateState 
} from "../../../redux/slices/backdateSlice";
import LoanRequestModal from "./LoanRequestModal";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  X,
  Plus,
  CalendarDays,
  CalendarPlus,
  XCircle,
  CheckCircle2,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Target,
  MoreVertical,
  AlertCircle,
  CalendarClock,
  Send,
} from "lucide-react";

const defaultEditForm = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  email: "",
};

const contributionPalette = [
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

const LOAN_PAYMENT_TYPES = new Set([
  "deposit",
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "repayment",
  "fee",
]);

const LOAN_DISBURSEMENT_TYPES = new Set([
  "loan_disbursement",
  "loan",
  "disbursement",
  "withdrawal",
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

const PLAN_STATUS_FILTERS = [
  { value: "all", label: "All plans" },
  { value: "active", label: "Active savings" },
  { value: "completed", label: "Completed savings" },
  { value: "loan", label: "Loan plans" },
];

const createDefaultDepositForm = (date = new Date()) => ({
  amount: "",
  narration: "",
  recordedAt: date.toISOString(),
});

const getPlanStartDate = (plan = {}) => {
  if (!plan) return null;
  return plan.startDate || plan.createdAt || null;
};

const defaultWithdrawalForm = {
  amount: "",
  narration: "",
  recordedAt: new Date().toISOString().slice(0, 10),
};

const defaultPlanForm = {
  planName: "",
  dailyContribution: "",
  startDate: "",
  description: "",
};

const defaultContributionUpdateForm = {
  dailyContribution: "",
};

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const parseAmount = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getMonthKey = (value) => {
  if (!value) return null;
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) return null;
  const year = candidate.getFullYear();
  const month = String(candidate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (key) => {
  if (!key) return "—";
  const [year, month] = key.split("-").map((token) => Number.parseInt(token, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return "—";
  const date = new Date(year, month - 1, 1);
  return monthFormatter.format(date);
};

const createEmptyMonthlyTotals = () => ({
  totalSavings: 0,
  totalLoanAmount: 0,
  totalLoanPaid: 0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  totalFees: 0,
  activeLoanIds: new Set(),
});

const ACTIVE_LOAN_STATUSES = new Set(["active", "approved", "pending", "disbursed"]);

const deriveLoanState = (plan = {}) => {
  const normalizedPlanType = (plan.planType || (plan.isLoan ? "loan" : "saving")).toLowerCase();
  const details = plan.loanDetails || {};
  let request = plan.loanRequest || null;

  if (!request && (plan.loanStatus === "pending" || (details.status || "").toLowerCase() === "pending")) {
    request = {
      amount: details.amount,
      dailyAmount: details.dailyAmount,
      requestDate: details.requestDate,
      guarantor: details.guarantor,
      customerSignature: details.customerSignature,
      status: details.status || "pending",
    };
  }

  const statusSource =
    plan.status === "completed"
      ? "completed"
      : plan.loanStatus ??
        request?.status ??
        details.status ??
        (plan.isLoan ? "approved" : "none");

  const status = (statusSource || "none").toLowerCase();

  return {
    planType: normalizedPlanType,
    status,
    request,
    isLoanPlan: normalizedPlanType === "loan" || Boolean(plan.isLoan),
  };
};

const MIN_LOAN_DEPOSITS_REQUIRED = 5;
const MIN_LOAN_DAILY_CONTRIBUTION = 2000;

const getContributionResetProgress = (plan = {}) => {
  let metadata = plan.metadata || {};
  if (metadata && typeof metadata.get === "function") {
    metadata = Object.fromEntries(metadata);
  }
  const resetAtRaw = metadata.loanContributionResetAt;
  const unitsSinceResetRaw = metadata.loanContributionUnitsSinceReset;

  const resetAt = resetAtRaw ? new Date(resetAtRaw) : null;
  let unitsSinceReset = Number(unitsSinceResetRaw ?? 0);
  if (!Number.isFinite(unitsSinceReset)) {
    unitsSinceReset = 0;
  }

  return {
    resetAt,
    unitsSinceReset,
  };
};

const hasMinimumLoanDeposits = (plan = {}) => {
  const totalDeposited = Number(plan.totalDeposited || 0);
  const dailyContribution = Number(plan.dailyContribution || 0);
  if (dailyContribution < MIN_LOAN_DAILY_CONTRIBUTION) {
    return false;
  }
  if (!dailyContribution) {
    return false;
  }

  const { resetAt, unitsSinceReset } = getContributionResetProgress(plan);
  if (resetAt) {
    return unitsSinceReset + 1e-6 >= MIN_LOAN_DEPOSITS_REQUIRED;
  }

  const depositMultiple = totalDeposited / dailyContribution;
  if (!Number.isFinite(depositMultiple)) {
    return false;
  }

  const epsilon = 1e-6;
  return depositMultiple + epsilon >= MIN_LOAN_DEPOSITS_REQUIRED;
};

const getLoanEligibility = (plan = {}) => {
  const loanState = plan.loanState || deriveLoanState(plan);
  const status = (plan.status || "").toLowerCase();
  const dailyContribution = Number(plan.dailyContribution || 0);
  const { resetAt, unitsSinceReset } = getContributionResetProgress(plan);

  if (loanState.isLoanPlan) {
    return { canRequest: false, reason: "Plan already converted to a loan." };
  }

  if (loanState.status === "pending") {
    return { canRequest: false, reason: "Loan request already pending approval." };
  }

  if (status !== "active") {
    return { canRequest: false, reason: "Plan must be active before requesting a loan." };
  }

  if (dailyContribution < MIN_LOAN_DAILY_CONTRIBUTION) {
    return {
      canRequest: false,
      reason: `Daily contribution must be at least ₦${MIN_LOAN_DAILY_CONTRIBUTION.toLocaleString()} before requesting a loan.`,
    };
  }

  if (!hasMinimumLoanDeposits(plan)) {
    const remaining = Math.max(MIN_LOAN_DEPOSITS_REQUIRED - unitsSinceReset, 0);
    const reason = resetAt
      ? `Requires ${MIN_LOAN_DEPOSITS_REQUIRED} daily deposits after the last contribution change (${remaining} remaining).`
      : `Requires at least ${MIN_LOAN_DEPOSITS_REQUIRED} daily deposits before requesting a loan.`;

    return {
      canRequest: false,
      reason,
    };
  }

  return { canRequest: true, reason: null };
};

const canRequestLoanForPlan = (plan = {}) => getLoanEligibility(plan).canRequest;

const formatLoanSlotLabel = (scheduledDate, paymentDate, status) => {
  const schedule = formatDateLabel(scheduledDate);
  if (status === "paid" && paymentDate) {
    const actual = formatDateLabel(paymentDate);
    if (schedule === actual) {
      return `Paid on ${actual}`;
    }
    return `Due ${schedule} • Paid ${actual}`;
  }
  if (status === "missed") {
    return `Missed • Due ${schedule}`;
  }
  return `Due ${schedule}`;
};
const formatDate = (value) => {
  if (!value) return "—";
  const dateObject = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObject.getTime())) {
    return "—";
  }
  return dateObject.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const withdrawalStatusConfig = {
  pending: {
    label: "Pending approval",
    className: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700",
  },
};

function Modal({ open, title, onClose, children, widthClass = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className={`relative w-full ${widthClass} rounded-3xl bg-white shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Workflow</p>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function EditCustomerForm({ initialValues, onSubmit, submitting }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-600">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-600">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-600">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-600">
            Email (optional)
          </label>
          <input
            id="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-slate-600">
          Residential address
        </label>
        <textarea
          id="address"
          name="address"
          value={values.address}
          onChange={handleChange}
          required
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

function ContributionForm({ initialValues, onSubmit, submitting, actionLabel, icon: Icon, minDate, maxDate, readOnlyDate }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "recordedAt") {
      if (!value) {
        setValues((prev) => ({ ...prev, recordedAt: "" }));
        return;
      }

      let selectedDate = new Date(value);
      if (Number.isNaN(selectedDate.getTime())) {
        return;
      }

      if (minDate) {
        const minimum = new Date(minDate);
        if (!Number.isNaN(minimum.getTime()) && selectedDate < minimum) {
          selectedDate = minimum;
        }
      }

      if (maxDate) {
        const maximum = new Date(maxDate);
        if (!Number.isNaN(maximum.getTime()) && selectedDate > maximum) {
          selectedDate = maximum;
        }
      }

      const reference = values.recordedAt ? new Date(values.recordedAt) : new Date();
      if (!Number.isNaN(reference.getTime())) {
        selectedDate.setHours(
          reference.getHours(),
          reference.getMinutes(),
          reference.getSeconds(),
          reference.getMilliseconds(),
        );
      }

      setValues((prev) => ({ ...prev, recordedAt: selectedDate.toISOString() }));
      return;
    }

    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      amount: Number(values.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-slate-600">
            Amount (₦)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="recordedAt" className="block text-sm font-medium text-slate-600">
            Recorded date
          </label>
          <input
            id="recordedAt"
            name="recordedAt"
            type="date"
            value={values.recordedAt ? values.recordedAt.slice(0, 10) : ""}
            onChange={handleChange}
            readOnly={readOnlyDate}
            min={minDate ? new Date(minDate).toISOString().slice(0, 10) : undefined}
            max={maxDate ? new Date(maxDate).toISOString().slice(0, 10) : undefined}
            className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${readOnlyDate ? "bg-slate-50 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="narration" className="block text-sm font-medium text-slate-600">
          Narration (optional)
        </label>
        <textarea
          id="narration"
          name="narration"
          value={values.narration}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Add a note about this transaction"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ status }) {
  const config = {
    active: {
      label: "Active",
      className: "bg-emerald-100 text-emerald-700",
      icon: ShieldCheck,
    },
    completed: {
      label: "Completed",
      className: "bg-blue-100 text-blue-700",
      icon: ShieldCheck,
    },
    closed: {
      label: "Closed",
      className: "bg-slate-200 text-slate-600",
      icon: ShieldAlert,
    },
  };

  const info = config[status] || config.active;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>
      <Icon className="h-3.5 w-3.5" /> {info.label}
    </span>
  );
}

function PlanForm({ initialValues, onSubmit, submitting }) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      dailyContribution: Number(values.dailyContribution),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="planName" className="block text-sm font-medium text-slate-600">
            Savings plan name
          </label>
          <input
            id="planName"
            name="planName"
            value={values.planName}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Daily 500 savings"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dailyContribution" className="block text-sm font-medium text-slate-600">
            Daily contribution (₦)
          </label>
          <input
            id="dailyContribution"
            name="dailyContribution"
            type="number"
            min="0"
            step="0.01"
            value={values.dailyContribution}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-600">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={values.startDate}
            readOnly
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 shadow-sm focus:outline-none cursor-not-allowed opacity-75"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-600">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Optional notes about the plan"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          Launch savings plan
        </button>
      </div>
    </form>
  );
}

function BackdateRequestModal({ isOpen, onClose, onSubmit, submitting, plan }) {
  const [proposedDate, setProposedDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!proposedDate || !reason) return;
    
    onSubmit({
      planId: plan._id,
      proposedDate,
      reason
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Request Backdate Deposit"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            Recording a deposit for a past date requires Administrator approval. 
            Please provide the proposed date and a reason for the backdate request.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="proposedDate" className="block text-sm font-medium text-slate-700">
              Proposed Date
            </label>
            <input
              id="proposedDate"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
              Reason for Backdate
            </label>
            <textarea
              id="reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Please explain why this deposit is being recorded late..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !proposedDate || !reason}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    selectedCustomer,
    mutationStatus,
    mutationError,
    savingsPlansByCustomer,
  } = useSelector((state) => state.customers);
  const {
    plansById,
    entriesByPlan,
    withdrawalRequestsByPlan,
    mutationStatus: savingsMutationStatus,
    mutationError: savingsMutationError,
    selectedPlan,
  } = useSelector((state) => state.savings);
  const { 
    requests: backdateRequests,
    mutationStatus: backdateMutationStatus
  } = useSelector((state) => state.backdate);
  const { profile: csoProfile } = useSelector((state) => state.csoAuth);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState(null);
  const [editFormValues, setEditFormValues] = useState(defaultEditForm);
  const [depositFormValues, setDepositFormValues] = useState(() => createDefaultDepositForm());
  const [withdrawalFormValues, setWithdrawalFormValues] = useState(defaultWithdrawalForm);
  const [planFormValues, setPlanFormValues] = useState(defaultPlanForm);
  const [contributionUpdateFormValues, setContributionUpdateFormValues] = useState(
    defaultContributionUpdateForm,
  );
  const [planFilter, setPlanFilter] = useState("all");
  const [openPlanActionsId, setOpenPlanActionsId] = useState(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [selectedWardCell, setSelectedWardCell] = useState(null);
  const [isSlotDetailOpen, setIsSlotDetailOpen] = useState(false);
  const [loanSlotSelection, setLoanSlotSelection] = useState(null);
  const [isLoanCardModalOpen, setIsLoanCardModalOpen] = useState(false);
  const [isLoanSlotDetailOpen, setIsLoanSlotDetailOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionMonthFilter, setTransactionMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [summaryMonth, setSummaryMonth] = useState("all");
  const [isConfirmDepositModalOpen, setIsConfirmDepositModalOpen] = useState(false);
  const [pendingDepositValues, setPendingDepositValues] = useState(null);
  const [isBackdateModalOpen, setIsBackdateModalOpen] = useState(false);
  const [selectedBackdate, setSelectedBackdate] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthKey = useMemo(() => todayKey.slice(0, 7), [todayKey]);
  const hasRemittanceToday = useMemo(() => {
    const records = csoProfile?.remittance || [];
    return records.some((entry) => {
      const timestamp = entry?.createdAt || entry?.updatedAt;
      if (!timestamp) return false;
      const entryDate = new Date(timestamp);
      if (Number.isNaN(entryDate.getTime())) return false;
      const normalized = new Date(entryDate.getTime() - entryDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      return normalized === todayKey;
    });
  }, [csoProfile?.remittance, todayKey]);

  useEffect(() => {
    if (!csoProfile) {
      dispatch(fetchCsoProfile());
    }
  }, [dispatch, csoProfile]);

  useEffect(() => {
    if (customerId) {
      dispatch(fetchCustomerById(customerId));
      dispatch(fetchSavingsPlans({ customerId }));
    }

    return () => {
      dispatch(clearCustomerState());
      dispatch(clearSavingsState());
      dispatch(clearBackdateState());
    };
  }, [customerId, dispatch]);

  useEffect(() => {
    dispatch(fetchCsoBackdateRequests());
  }, [dispatch]);

  const plans = useMemo(() => {
    const customerPlans = savingsPlansByCustomer[customerId] || [];
    return customerPlans.map((plan) => ({
      ...plan,
      loanState: deriveLoanState(plan),
    }));
  }, [savingsPlansByCustomer, customerId]);

  const filteredPlans = useMemo(() => {
    if (planFilter === "all") {
      return plans;
    }

    return plans.filter((plan) => {
      const loanState = plan.loanState || deriveLoanState(plan);
      if (planFilter === "loan") {
        return loanState.isLoanPlan || loanState.status !== "none";
      }

      if (loanState.isLoanPlan) {
        return false;
      }

      if (planFilter === "active") {
        return plan.status === "active";
      }

      if (planFilter === "completed") {
        return plan.status && plan.status !== "active";
      }

      return true;
    });
  }, [planFilter, plans]);

  const currentPlan = useMemo(() => {
    const rawPlan = plansById[activePlanId] || null;
    if (!rawPlan) {
      return null;
    }
    return {
      ...rawPlan,
      loanState: deriveLoanState(rawPlan),
    };
  }, [plansById, activePlanId]);

  const currentLoanState = useMemo(() => {
    if (!currentPlan) {
      return null;
    }
    return currentPlan.loanState || deriveLoanState(currentPlan);
  }, [currentPlan]);

  const isCurrentLoanPlan = Boolean(currentLoanState?.isLoanPlan);
  const currentLoanStatus = currentLoanState?.status || "none";
  const currentLoanRequest = currentLoanState?.request;
  useEffect(() => {
    if (activePlanId && !filteredPlans.some((plan) => plan._id === activePlanId)) {
      setActivePlanId(null);
    }
  }, [activePlanId, filteredPlans]);
  useEffect(() => {
    setOpenPlanActionsId(null);
  }, [planFilter]);
  useEffect(() => {
    setTransactionMonthFilter(new Date().toISOString().slice(0, 7));
  }, [activePlanId]);
  const prefetchedPlanEntriesRef = useRef(new Set());
  useEffect(() => {
    if (!plans.length) return;
    plans.forEach((plan) => {
      const planId = plan._id;
      if (!planId) return;
      if (prefetchedPlanEntriesRef.current.has(planId)) return;
      prefetchedPlanEntriesRef.current.add(planId);
      dispatch(
        fetchSavingsEntries({
          planId,
          limit: 500,
        }),
      );
    });
  }, [dispatch, plans]);
  const planEntries = useMemo(() => entriesByPlan[activePlanId]?.items || [], [entriesByPlan, activePlanId]);
  const planWithdrawalRequests = useMemo(
    () => withdrawalRequestsByPlan[activePlanId] || [],
    [withdrawalRequestsByPlan, activePlanId],
  );
  const aggregatedPlanEntries = useMemo(() => {
    if (!plans.length) return [];
    return plans.flatMap((plan) => {
      const items = entriesByPlan[plan._id]?.items;
      if (!items || !items.length) {
        return [];
      }
      return items.map((entry) => ({ entry, plan }));
    });
  }, [entriesByPlan, plans]);
  const summaryMonthBuckets = useMemo(() => {
    if (!aggregatedPlanEntries.length) {
      return new Map();
    }

    const buckets = new Map();

    aggregatedPlanEntries.forEach(({ entry, plan }) => {
      const monthKey = getMonthKey(entry.recordedAt || entry.createdAt);
      if (!monthKey) {
        return;
      }

      const amount = parseAmount(entry.amount);
      if (amount <= 0) {
        return;
      }

      if (!buckets.has(monthKey)) {
        buckets.set(monthKey, createEmptyMonthlyTotals());
      }

      const bucket = buckets.get(monthKey);
      const normalizedType = (entry.type || "").toString().trim().toLowerCase();
      const loanState = plan.loanState || deriveLoanState(plan);
      const isLoanPlan = Boolean(loanState?.isLoanPlan);

      if (isLoanPlan) {
        const loanStatus = (loanState?.status || loanState?.loanStatus || plan.loanStatus || "").toString().toLowerCase();
        if (ACTIVE_LOAN_STATUSES.has(loanStatus)) {
          bucket.activeLoanIds.add(plan._id);
        }

        if (LOAN_DISBURSEMENT_TYPES.has(normalizedType)) {
          bucket.totalLoanAmount += amount;
        }

        if (LOAN_PAYMENT_TYPES.has(normalizedType)) {
          bucket.totalLoanPaid += amount;
          bucket.totalDeposited += amount;
        }

        if (normalizedType.includes("fee")) {
          bucket.totalFees += amount;
        }

        return;
      }

      if (normalizedType === "deposit") {
        bucket.totalDeposited += amount;
        bucket.totalSavings += amount;
        return;
      }

      if (normalizedType === "withdrawal") {
        bucket.totalWithdrawn += amount;
        bucket.totalSavings -= amount;
        return;
      }

      if (normalizedType.includes("fee")) {
        bucket.totalFees += amount;
        bucket.totalSavings -= amount;
      }
    });

    return buckets;
  }, [aggregatedPlanEntries]);
  const summaryMonthOptions = useMemo(() => {
    const keys = Array.from(summaryMonthBuckets.keys());
    return keys.sort((a, b) => b.localeCompare(a));
  }, [summaryMonthBuckets]);
  useEffect(() => {
    if (summaryMonth === "all") return;
    if (!summaryMonthOptions.includes(summaryMonth)) {
      setSummaryMonth("all");
    }
  }, [summaryMonth, summaryMonthOptions]);
  const dailyContributionTarget = Number(currentPlan?.dailyContribution || 0);
  const contributionUnit = dailyContributionTarget > 0 ? dailyContributionTarget : 1;
  const depositDays = useMemo(() => {
    let sourceEntries = planEntries;
    if (transactionMonthFilter !== "all" && !isCurrentLoanPlan) {
      sourceEntries = planEntries.filter(
        (entry) => getMonthKey(entry.recordedAt || entry.createdAt) === transactionMonthFilter,
      );
    }

    const grouped = new Map();
    sourceEntries.forEach((entry) => {
      if (entry.type !== "deposit") {
        return;
      }
      const timestamp = entry.recordedAt || entry.createdAt;
      if (!timestamp) {
        return;
      }
      const entryDate = new Date(timestamp);
      if (Number.isNaN(entryDate.getTime())) {
        return;
      }
      const normalizedDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      const key = normalizedDate.getTime();
      if (!grouped.has(key)) {
        grouped.set(key, { date: normalizedDate, entries: [], total: 0 });
      }
      const bucket = grouped.get(key);
      bucket.entries.push(entry);
      bucket.total += Number(entry.amount || 0);
    });

    return Array.from(grouped.values()).sort((a, b) => a.date - b.date);
  }, [planEntries, transactionMonthFilter, isCurrentLoanPlan]);

  const wardCells = useMemo(() => {
    const slots = [];
    const paletteSize = contributionPalette.length;
    let paletteIndex = 0;

    depositDays.forEach((day) => {
      const palette = contributionPalette[paletteIndex % paletteSize];
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
  }, [depositDays, contributionUnit]);
  const planMonthOptions = useMemo(() => {
    const months = new Set();
    const currentMonth = new Date().toISOString().slice(0, 7);
    months.add(currentMonth); // Ensure today's month is always an option

    planEntries.forEach((entry) => {
      const key = getMonthKey(entry.recordedAt || entry.createdAt);
      if (key) {
        months.add(key);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [planEntries]);
  useEffect(() => {
    if (transactionMonthFilter === "all") return;
    if (!planMonthOptions.includes(transactionMonthFilter)) {
      setTransactionMonthFilter("all");
    }
  }, [planMonthOptions, transactionMonthFilter]);
  useEffect(() => {
    if (!isCurrentLoanPlan) {
      return;
    }
    if (transactionMonthFilter !== "all") {
      setTransactionMonthFilter("all");
    }
  }, [isCurrentLoanPlan, transactionMonthFilter]);

  const filteredTransactions = useMemo(() => {
    let data = planEntries;
    if (transactionMonthFilter !== "all" && !isCurrentLoanPlan) {
      data = data.filter(
        (entry) => getMonthKey(entry.recordedAt || entry.createdAt) === transactionMonthFilter,
      );
    }
    if (transactionFilter === "all") {
      return data;
    }
    return data.filter((entry) => (entry.type || "").toLowerCase() === transactionFilter);
  }, [isCurrentLoanPlan, planEntries, transactionFilter, transactionMonthFilter]);
  const planEntriesForSelectedMonth = useMemo(() => {
    if (transactionMonthFilter === "all" || isCurrentLoanPlan) {
      return null;
    }

    return planEntries.filter((entry) => getMonthKey(entry.recordedAt || entry.createdAt) === transactionMonthFilter);
  }, [isCurrentLoanPlan, planEntries, transactionMonthFilter]);
  const planCardMetrics = useMemo(() => {
    const defaults = {
      totalDeposited: 0,
      totalFees: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      loanAmount: 0,
      loanPaid: 0,
      loanBalance: 0,
    };

    if (!currentPlan) {
      return defaults;
    }

    const fallbackLoanAmount = parseAmount(currentPlan.loanDetails?.amount || currentLoanRequest?.amount || 0);
    const fallbackLoanPaid = parseAmount(currentPlan.totalDeposited || 0);

    if (!planEntriesForSelectedMonth) {
      return {
        totalDeposited: parseAmount(currentPlan.totalDeposited || 0),
        totalFees: parseAmount(currentPlan.totalFees || 0),
        totalWithdrawn: parseAmount(currentPlan.totalWithdrawn || 0),
        availableBalance: parseAmount(currentPlan.availableBalance || 0),
        loanAmount: fallbackLoanAmount,
        loanPaid: fallbackLoanPaid,
        loanBalance: Math.max(fallbackLoanAmount - fallbackLoanPaid, 0),
      };
    }

    if (!planEntriesForSelectedMonth.length) {
      return {
        totalDeposited: 0,
        totalFees: 0,
        totalWithdrawn: 0,
        availableBalance: 0,
        loanAmount: 0,
        loanPaid: 0,
        loanBalance: 0,
      };
    }

    const totals = {
      totalDeposited: 0,
      totalFees: 0,
      totalWithdrawn: 0,
      loanAmount: 0,
      loanPaid: 0,
    };

    planEntriesForSelectedMonth.forEach((entry) => {
      const amount = parseAmount(entry.amount || 0);
      if (amount <= 0) {
        return;
      }

      const normalizedType = (entry.type || "").toLowerCase();

      // Primary Financial Metrics Classification
      if (normalizedType === "deposit") {
        totals.totalDeposited += amount;
      } else if (normalizedType === "withdrawal") {
        totals.totalWithdrawn += amount;
      } else if (normalizedType === "fee") {
        totals.totalFees += amount;
      }

      // Secondary/Loan Metrics tracking
      if (LOAN_DISBURSEMENT_TYPES.has(normalizedType)) {
        totals.loanAmount += amount;
      }

      if (LOAN_PAYMENT_TYPES.has(normalizedType)) {
        totals.loanPaid += amount;
        
        // Only count as additional deposit if it hasn't been handled as a standard "deposit"
        // and is not a generic "fee" (like maintenance fee)
        if (normalizedType !== "deposit" && normalizedType !== "fee") {
          totals.totalDeposited += amount;
        }
      }
    });

    const availableBalance = totals.totalDeposited - totals.totalWithdrawn - totals.totalFees;

    return {
      totalDeposited: totals.totalDeposited,
      totalFees: totals.totalFees,
      totalWithdrawn: totals.totalWithdrawn,
      availableBalance,
      loanAmount: totals.loanAmount,
      loanPaid: totals.loanPaid,
      loanBalance: Math.max(totals.loanAmount - totals.loanPaid, 0),
    };
  }, [currentPlan, currentLoanRequest, planEntriesForSelectedMonth]);
  const isPlanCardScopedToMonth = transactionMonthFilter !== "all" && !isCurrentLoanPlan;
  const planLabelSuffix = useMemo(() => {
    if (transactionMonthFilter === "all" || isCurrentLoanPlan) return "";
    if (transactionMonthFilter === currentMonthKey) return " (this month)";
    return ` (${formatMonthLabel(transactionMonthFilter)})`;
  }, [transactionMonthFilter, currentMonthKey, isCurrentLoanPlan]);
  const selectedWardSlot = selectedWardCell?.slot ?? null;
  const selectedWardDay = selectedWardCell?.filled ? selectedWardCell.day : null;
  const currentLoanDetails = currentPlan?.loanDetails;
  const loanDailyRepayment = useMemo(() => {
    const detailsAmount = Number(currentLoanDetails?.dailyRepaymentAmount || currentLoanDetails?.dailyAmount || 0);
    const requestAmount = Number(currentLoanRequest?.dailyRepaymentAmount || currentLoanRequest?.dailyAmount || 0);
    if (detailsAmount > 0) return detailsAmount;
    if (requestAmount > 0) return requestAmount;
    return 0;
  }, [currentLoanDetails?.dailyRepaymentAmount, currentLoanDetails?.dailyAmount, currentLoanRequest?.dailyRepaymentAmount, currentLoanRequest?.dailyAmount]);

  const loanPayments = useMemo(() => {
    if (!isCurrentLoanPlan) {
      return [];
    }
    const loanUnitRaw = loanDailyRepayment;
    const fallbackUnit = contributionUnit > 0 ? contributionUnit : 1;
    const unit = loanUnitRaw > 0 ? loanUnitRaw : fallbackUnit;

    return planEntries
      .filter((entry) => LOAN_PAYMENT_TYPES.has((entry.type || "").toLowerCase()))
      .flatMap((entry) => {
        const amount = Number(entry.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return [];
        }

        const actualDate = new Date(entry.recordedAt || entry.createdAt);
        if (Number.isNaN(actualDate.getTime())) {
          return [];
        }
        const normalizedDate = new Date(
          actualDate.getFullYear(),
          actualDate.getMonth(),
          actualDate.getDate(),
        );

        const chunks = [];
        let remaining = amount;
        while (remaining > 0) {
          const portion = Math.min(unit, remaining);
          chunks.push({
            entry,
            actualDate,
            normalizedDate,
            portionAmount: portion,
          });
          remaining -= portion;
        }

        if (!chunks.length) {
          chunks.push({
            entry,
            actualDate,
            normalizedDate,
            portionAmount: unit,
          });
        }

        return chunks;
      })
      .sort((a, b) => a.actualDate - b.actualDate);
  }, [contributionUnit, isCurrentLoanPlan, loanDailyRepayment, planEntries]);
  const loanExpectedUnit = useMemo(
    () => Number(loanDailyRepayment || contributionUnit || 0),
    [loanDailyRepayment, contributionUnit],
  );
  const loanCardSlots = useMemo(() => {
    if (!isCurrentLoanPlan) {
      return [];
    }
    const loanAmount = Number(currentLoanDetails?.amount || currentLoanRequest?.amount || 0);
    const expectedSlots = loanExpectedUnit > 0 ? Math.ceil(loanAmount / loanExpectedUnit) : LOAN_CARD_SLOT_COUNT;
    
    let startDate;
    if (currentLoanDetails?.startDate) {
      startDate = new Date(currentLoanDetails.startDate);
    } else if (loanPayments.length) {
      startDate = new Date(loanPayments[0].normalizedDate);
    } else {
      startDate = new Date();
    }
    startDate.setHours(0, 0, 0, 0);

    const slotCount = LOAN_CARD_SLOT_COUNT;
    const slots = Array.from({ length: slotCount }, (_, index) => {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + index);
      return {
        slot: index + 1,
        scheduledDate,
        payment: loanPayments[index] || null, // Map payment units directly to slots by index
      };
    });

    const totalDeposited = Number(currentPlan?.totalDeposited || 0);
    const totalFees = Number(currentPlan?.totalFees || 0);
    const dailyUnit = loanExpectedUnit > 0 ? loanExpectedUnit : (contributionUnit > 0 ? contributionUnit : 1);
    const totalPaidUnits = Math.floor((totalDeposited + totalFees) / dailyUnit);

    return slots.map((slot, index) => {
      const isPaidByCount = index < totalPaidUnits;
      const hasPayment = Boolean(slot.payment) || isPaidByCount;
      let status = "upcoming";
      if (hasPayment) {
        status = "paid";
      } else if (slot.scheduledDate <= today) {
        status = "missed";
      }
      return {
        ...slot,
        hasPayment,
        paymentDate: slot.payment ? slot.payment.actualDate : null,
        paymentEntry: slot.payment?.entry || null,
        portionAmount: slot.payment?.portionAmount ?? null,
        status,
      };
    });
  }, [isCurrentLoanPlan, currentLoanDetails?.startDate, loanPayments, currentPlan?.totalDeposited, currentPlan?.totalFees, loanExpectedUnit, today]);
  const loanCardSummary = useMemo(() => {
    if (!isCurrentLoanPlan) {
      return { paid: 0, missed: 0, upcoming: 0 };
    }
    let paid = 0;
    let missed = 0;
    let upcoming = 0;
    loanCardSlots.forEach((slot) => {
      if (slot.status === "paid") paid += 1;
      else if (slot.status === "missed") missed += 1;
      else upcoming += 1;
    });
    return { paid, missed, upcoming };
  }, [isCurrentLoanPlan, loanCardSlots]);

  const selectedLoanSlotDetail = useMemo(() => {
    if (!loanSlotSelection) {
      return null;
    }
    return loanCardSlots.find((slot) => slot.slot === loanSlotSelection) || null;
  }, [loanSlotSelection, loanCardSlots]);
  const selectedLoanSlotAmount = selectedLoanSlotDetail?.portionAmount ?? loanExpectedUnit;

  const handleOpenWard = () => {
    if (isCurrentLoanPlan) {
      return;
    }
    setIsWardModalOpen(true);
    setSelectedWardCell(null);
    setIsSlotDetailOpen(false);
    setLoanSlotSelection(null);
  };

  const handleCloseWard = () => {
    setIsWardModalOpen(false);
    setSelectedWardCell(null);
    setIsSlotDetailOpen(false);
    setLoanSlotSelection(null);
    setIsLoanSlotDetailOpen(false);
  };

  const handleCloseLoanCard = () => {
    setIsLoanCardModalOpen(false);
    setLoanSlotSelection(null);
    setIsLoanSlotDetailOpen(false);
  };

  const handleOpenLoanCard = () => {
    if (!isCurrentLoanPlan) {
      return;
    }
    setIsLoanCardModalOpen(true);
    setLoanSlotSelection(null);
  };

  useEffect(() => {
    if (!isWardModalOpen) {
      setLoanSlotSelection(null);
    }
  }, [isWardModalOpen]);

  useEffect(() => {
    if (isCurrentLoanPlan && isWardModalOpen) {
      handleCloseWard();
    }
  }, [isCurrentLoanPlan, isWardModalOpen]);

  useEffect(() => {
    if (!isCurrentLoanPlan) {
      setIsLoanCardModalOpen(false);
      setLoanSlotSelection(null);
      setIsLoanSlotDetailOpen(false);
    }
  }, [isCurrentLoanPlan]);

  useEffect(() => {
    if (!isLoanCardModalOpen) {
      setLoanSlotSelection(null);
      setIsLoanSlotDetailOpen(false);
    }
  }, [isLoanCardModalOpen]);

  useEffect(() => {
    if (!loanSlotSelection) {
      setIsLoanSlotDetailOpen(false);
    }
  }, [loanSlotSelection]);

  useEffect(() => {
    setTransactionFilter("all");
  }, [activePlanId]);

  const withdrawalErrorMessage = useMemo(() => {
    if (!savingsMutationError || !isWithdrawalModalOpen) {
      return savingsMutationError;
    }

    const baseMessage = String(savingsMutationError);
    if (baseMessage.toLowerCase().includes("insufficient available balance")) {
      const plan = plansById[activePlanId] || plans.find((item) => item._id === activePlanId);
      return `Insufficient available balance. Available balance: ${formatCurrency(plan?.availableBalance)}.`;
    }

    return savingsMutationError;
  }, [savingsMutationError, isWithdrawalModalOpen, activePlanId, plansById, plans]);

  const handleOpenEdit = () => {
    if (!selectedCustomer) return;
    setEditFormValues({
      firstName: selectedCustomer.firstName,
      lastName: selectedCustomer.lastName,
      phone: selectedCustomer.phone,
      address: selectedCustomer.address,
      email: selectedCustomer.email || "",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeposit = (plan) => {
    if (hasRemittanceToday) {
      toast.error("Remittance has been submitted for today. Deposits are locked until tomorrow.");
      return;
    }

    if (!plan || !plan._id) {
      toast.error("Unable to open deposit form for this plan");
      return;
    }

    setActivePlanId(plan._id);
    const now = new Date();
    
    // Find if there's an approved backdate request for this plan
    const approvedRequest = backdateRequests.find(
      req => req.planId._id === plan._id && req.status === "approved"
    );

    setDepositFormValues({
      amount: plan.dailyContribution,
      narration: "Daily contribution",
      recordedAt: approvedRequest ? approvedRequest.proposedDate : now.toISOString(),
    });
    setSelectedBackdate(approvedRequest || null);
    setIsDepositModalOpen(true);
  };

  const handleBackdateSubmit = (values) => {
    if (!activePlanId) return;
    dispatch(createBackdateRequest({
      planId: activePlanId,
      proposedDate: values.proposedDate,
      reason: values.reason
    })).then((res) => {
      if (!res.error) {
        toast.success("Backdate request submitted successfully");
        setIsBackdateModalOpen(false);
      }
    });
  };

  const handleOpenWithdrawal = (plan) => {
    if (plan.latestWithdrawalRequest?.status === "pending") {
      toast.error("A withdrawal request is already pending approval for this plan.");
      return;
    }

    setActivePlanId(plan._id);
    setWithdrawalFormValues({
      amount: plan.availableBalance,
      narration: "Customer withdrawal",
      recordedAt: new Date().toISOString().slice(0, 10),
    });
    setIsWithdrawalModalOpen(true);
  };

  const handleOpenPlanModal = () => {
    if (!selectedCustomer) return;
    setPlanFormValues({
      ...defaultPlanForm,
      planName: `${selectedCustomer.firstName}'s savings`,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenContributionModal = (plan) => {
    if (!plan) return;
    setActivePlanId(plan._id);
    setContributionUpdateFormValues({
      dailyContribution: Number(plan.dailyContribution || 0) || "",
    });
    setIsContributionModalOpen(true);
  };

  const handleOpenLoanRequest = (plan) => {
    setActivePlanId(plan._id);
    setIsLoanModalOpen(true);
  };

  const handleEditSubmit = (values) => {
    dispatch(updateCustomer({ customerId, updates: values }));
  };

  const handleDepositSubmit = (values) => {
    if (!activePlanId) return;
    const plan = plansById[activePlanId] || plans.find((item) => item._id === activePlanId);
    const amount = Number(values.amount);

    if (hasRemittanceToday) {
      toast.error("Today’s remittance is already submitted. Please record deposits tomorrow.");
      return;
    }

    if (!plan || !plan.dailyContribution) {
      toast.error("Unable to determine plan contribution amount");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Deposit amount must be greater than zero");
      return;
    }

    const activeLoanState = plan?.loanState || deriveLoanState(plan);
    if (activeLoanState?.isLoanPlan) {
      const loanAmount = parseAmount(plan?.loanDetails?.amount || activeLoanState?.request?.amount || 0);
      const netPaidFromBalance = parseAmount(plan?.availableBalance || 0);
      const netPaidFromTotals = Math.max(
        parseAmount(plan?.totalDeposited || 0) - parseAmount(plan?.totalFees || 0),
        0,
      );
      const netPaid = Math.max(netPaidFromBalance, netPaidFromTotals);
      const remainingBalance = Math.max(loanAmount - netPaid, 0);

      if (amount > remainingBalance + 1e-6) {
        toast.error(
          `Deposit exceeds remaining loan balance. Outstanding balance after fees: ${formatCurrency(remainingBalance)}.`,
        );
        return;
      }
    }

    const recordedMoment = values.recordedAt ? new Date(values.recordedAt) : new Date();
    if (Number.isNaN(recordedMoment.getTime())) {
      toast.error("Please select a valid date for this deposit");
      return;
    }

    const planStartDate = getPlanStartDate(plan);
    if (planStartDate) {
      const minimum = new Date(planStartDate);
      if (!Number.isNaN(minimum.getTime()) && recordedMoment < minimum) {
        toast.error("Deposits cannot be recorded before the plan was created");
        return;
      }
    }

    if (!activeLoanState?.isLoanPlan) {
      const contributionUnit = Number(plan.dailyContribution);
      const ratio = amount / contributionUnit;
      if (!Number.isFinite(ratio) || Math.abs(Math.round(ratio) - ratio) > 1e-8) {
        toast.error("Deposit must be a multiple of the daily contribution");
        return;
      }
    }

    setPendingDepositValues(values);
    setIsConfirmDepositModalOpen(true);
  };

  const handleConfirmDeposit = () => {
    if (!pendingDepositValues || !activePlanId) return;

    const values = pendingDepositValues;
    const payload = {
      ...values,
      recordedAt: values.recordedAt ? new Date(values.recordedAt).toISOString() : new Date().toISOString(),
    };

    dispatch(recordSavingsDeposit({ planId: activePlanId, payload }))
      .unwrap()
      .then(async () => {
        const refreshed = await dispatch(fetchSavingsPlanById(activePlanId)).unwrap();
        const updatedPlan = refreshed?.plan || refreshed;

        const updatedLoanState = updatedPlan?.loanState || deriveLoanState(updatedPlan);
        if (updatedLoanState?.isLoanPlan) {
          const updatedLoanAmount = parseAmount(
            updatedPlan?.loanDetails?.amount || updatedLoanState?.request?.amount || 0,
          );
          const updatedNetPaidFromBalance = parseAmount(updatedPlan?.availableBalance || 0);
          const updatedNetPaidFromTotals = Math.max(
            parseAmount(updatedPlan?.totalDeposited || 0) - parseAmount(updatedPlan?.totalFees || 0),
            0,
          );
          const updatedNetPaid = Math.max(updatedNetPaidFromBalance, updatedNetPaidFromTotals);
          const updatedRemaining = Math.max(updatedLoanAmount - updatedNetPaid, 0);

          if (updatedRemaining <= 1e-2 && updatedPlan?.status !== "completed") {
            toast.success("Loan fully repaid. Plan remains active.");
          }
        }

        dispatch(fetchSavingsEntries({ planId: activePlanId }));
        setIsConfirmDepositModalOpen(false);
        setIsDepositModalOpen(false);
        setPendingDepositValues(null);
        setDepositFormValues(createDefaultDepositForm());
        toast.success("Deposit recorded successfully");
      })
      .catch((error) => {
        toast.error(error || "Failed to record deposit");
        setIsConfirmDepositModalOpen(false);
      });
  };

  const handleWithdrawalSubmit = (values) => {
    if (!activePlanId) return;
    const plan = plansById[activePlanId] || plans.find((item) => item._id === activePlanId);

    dispatch(createSavingsWithdrawalRequest({ planId: activePlanId, payload: values }))
      .unwrap()
      .then(() => {
        setIsWithdrawalModalOpen(false);
        setWithdrawalFormValues(defaultWithdrawalForm);
        dispatch(fetchSavingsPlanById(activePlanId));
        toast.success("Withdrawal request submitted for admin approval");
      })
      .catch((error) => {
        const normalizedMessage =
          typeof error === "string" ? error : error?.message;

        if (normalizedMessage && normalizedMessage.toLowerCase().includes("insufficient available balance")) {
          toast.error(
            `Insufficient available balance. Available balance: ${formatCurrency(plan?.availableBalance)}.`,
          );
        } else if (normalizedMessage && normalizedMessage.toLowerCase().includes("pending withdrawal request")) {
          toast.error("There is already a pending withdrawal request for this plan.");
        } else {
          toast.error(normalizedMessage || "Failed to process withdrawal");
        }
      });
  };

  const handleCreatePlan = (values) => {
    dispatch(
      createSavingsPlanForCustomer({
        customerId,
        payload: values,
      }),
    )
      .unwrap()
      .then(() => {
        setIsPlanModalOpen(false);
        setPlanFormValues(defaultPlanForm);
        dispatch(fetchSavingsPlans({ customerId }));
        dispatch(fetchCustomerById(customerId));
        toast.success("Savings plan launched successfully");
      })
      .catch((error) => {
        toast.error(error || "Unable to create savings plan");
      });

  };

  const handleContributionUpdateSubmit = (values) => {
    if (!activePlanId) return;

    const amount = Number(values.dailyContribution);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Daily contribution must be greater than zero");
      return;
    }

    dispatch(
      updateSavingsDailyContribution({
        planId: activePlanId,
        payload: { proposedAmount: amount },
      }),
    )
      .unwrap()
      .then(() => {
        setIsContributionModalOpen(false);
        setContributionUpdateFormValues(defaultContributionUpdateForm);
        toast.success(
          `Update request for ${formatCurrency(amount)} sent to admin for approval.`,
        );
      })
      .catch((error) => {
        toast.error(error || "Unable to submit contribution update request");
      });
  };

  const handleLoanRequestSubmit = (values) => {
    if (!activePlanId) return;
    dispatch(requestSavingsLoan({ planId: activePlanId, payload: values }))
      .unwrap()
      .then(() => {
        setIsLoanModalOpen(false);
        setActivePlanId(null);
        toast.success("Loan requested successfully");
        dispatch(fetchSavingsPlans({ customerId }));
        dispatch(fetchSavingsPlanById(activePlanId));
      })
      .catch((error) => {
        toast.error(error || "Unable to request loan");
      });
  };

  const handleFetchEntries = (planId) => {
    if (!planId) {
      return;
    }

    if (activePlanId === planId) {
      setActivePlanId(null);
      return;
    }

    setActivePlanId(planId);
    dispatch(fetchSavingsPlanById(planId));
    dispatch(fetchSavingsEntries({ planId, limit: 500 }));
  };

  const summary = useMemo(() => {
    let totalSavings = 0;
    let totalLoanAmount = 0;
    let totalLoanPaid = 0;
    let activeLoansCount = 0;
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let totalFees = 0;

    plans.forEach((plan) => {
      const loanState = plan.loanState || deriveLoanState(plan);
      totalDeposited += parseAmount(plan.totalDeposited || 0);
      totalWithdrawn += parseAmount(plan.totalWithdrawn || 0);
      totalFees += parseAmount(plan.totalFees || 0);

      if (loanState.isLoanPlan) {
        activeLoansCount += 1;
        totalLoanAmount += parseAmount(plan.loanDetails?.amount || loanState.request?.amount || 0);
        totalLoanPaid += parseAmount(plan.availableBalance || 0);
      } else {
        totalSavings += parseAmount(plan.availableBalance || 0);
      }
    });

    return {
      totalSavings,
      totalLoanAmount,
      totalLoanPaid,
      totalLoanBalance: totalLoanAmount - totalLoanPaid,
      activeLoansCount,
      totalDeposited,
      totalWithdrawn,
      totalFees,
      netBalance: totalSavings - (totalLoanAmount - totalLoanPaid)
    };
  }, [plans]);
  const summaryMetrics = useMemo(() => {
    if (summaryMonth === "all") {
      return summary;
    }

    const bucket = summaryMonthBuckets.get(summaryMonth);
    if (!bucket) {
      return summary;
    }

    const totalLoanBalance = Math.max(bucket.totalLoanAmount - bucket.totalLoanPaid, 0);
    const netBalance = bucket.totalSavings - totalLoanBalance;

    return {
      totalSavings: bucket.totalSavings,
      totalLoanAmount: bucket.totalLoanAmount,
      totalLoanPaid: bucket.totalLoanPaid,
      totalLoanBalance,
      activeLoansCount: bucket.activeLoanIds.size,
      totalDeposited: bucket.totalDeposited,
      totalWithdrawn: bucket.totalWithdrawn,
      totalFees: bucket.totalFees,
      netBalance,
    };
  }, [summary, summaryMonth, summaryMonthBuckets]);

  const loading = mutationStatus === "loading";
  const savingsLoading = savingsMutationStatus === "loading";

  useEffect(() => {
    if (summaryMonth !== "all") return;
    if (!prefetchedPlanEntriesRef.current.size) return;
  }, [summaryMonth]);

  if (!selectedCustomer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-3 pb-16 sm:px-0">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-slate-900">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </h1>
            <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
            <p className="text-sm text-slate-500">{selectedCustomer.address}</p>
            <p className="text-sm text-slate-500">{selectedCustomer.email}</p>
          </div>
          <div className="flex w-full flex-wrap justify-center gap-3 lg:w-auto lg:justify-end">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <Pencil className="h-4 w-4" /> Edit info
            </button>
            <button
              type="button"
              onClick={() => dispatch(archiveCustomer(customerId))}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Archive customer
            </button>
          </div>
        </div>
      </section>

      {/* Account Summary Section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Account summary</h2>
            <p className="text-sm text-slate-500">Review customer activity at a glance.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <label htmlFor="summary-month-filter" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" /> Month
            </label>
            <select
              id="summary-month-filter"
              value={summaryMonth}
              onChange={(event) => setSummaryMonth(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All time</option>
              {summaryMonthOptions.map((option) => (
                <option key={option} value={option}>
                  {formatMonthLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-600">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Savings</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summaryMetrics.totalSavings)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loan Balance</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summaryMetrics.totalLoanBalance)}</p>
              </div>
            </div>
          {summaryMetrics.activeLoansCount > 0 && (
            <div className="mt-2 text-[10px] font-medium text-slate-400">
              {summaryMetrics.activeLoansCount} active loan(s)
            </div>
          )}
        </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Deposited</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summaryMetrics.totalDeposited)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Withdrawn</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summaryMetrics.totalWithdrawn)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Fees</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summaryMetrics.totalFees)}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md lg:col-span-1 ${
          summaryMetrics.netBalance >= 0 ? "border-emerald-100 bg-emerald-50/30" : "border-rose-100 bg-rose-50/30"
        }`}>
            <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-2.5 ${summaryMetrics.netBalance >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Position</p>
              <p className={`text-lg font-bold ${summaryMetrics.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatCurrency(summaryMetrics.netBalance)}
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-900">Savings plans</h2>
            <p className="text-sm text-slate-500">Launch multiple daily savings plans for this customer.</p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
              {PLAN_STATUS_FILTERS.map((filter) => {
                const isActive = planFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setPlanFilter(filter.value)}
                    className={`rounded-full px-3 py-1 transition ${
                      isActive ? "bg-white text-primary shadow" : "hover:bg-white/80"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleOpenPlanModal}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" /> New plan
            </button>
          </div>
        </header>

        <div className="mt-6 space-y-4">
          {!filteredPlans.length ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No savings plans found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Adjust your filter or launch a new plan for this customer.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlanFilter("all")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                >
                  Reset filters
                </button>
                <button
                  type="button"
                  onClick={handleOpenPlanModal}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Create plan
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPlans.map((plan) => {
                const latestRequest = plan.latestWithdrawalRequest;
                const requestStatusInfo = latestRequest
                  ? withdrawalStatusConfig[latestRequest.status] || withdrawalStatusConfig.pending
                  : null;
                const loanState = plan.loanState || deriveLoanState(plan);
                const loanStatus = loanState.status;
                const loanRequest = loanState.request;
                const isLoanPlan = loanState.isLoanPlan;
                const isPendingLoan = loanStatus === "pending";
                const isRejectedLoan = loanStatus === "rejected";
                const { canRequest: canRequestLoan, reason: loanIneligibleReason } = getLoanEligibility(plan);

                const normalizedPlanStatus = (plan.status || "").toLowerCase();
                const normalizedLoanStatus = (loanStatus || "").toLowerCase();
                const isCompletedSavingsPlan = !isLoanPlan && normalizedPlanStatus && normalizedPlanStatus !== "active";
                const isCompletedLoanPlan = isLoanPlan && (normalizedLoanStatus === "completed" || normalizedPlanStatus === "completed");
                const hidePlanActions = isCompletedSavingsPlan || isCompletedLoanPlan;
                const hideWithdrawalAction =
                  isLoanPlan && ["active", "approved", "disbursed"].includes(normalizedLoanStatus);
                const canEditContribution =
                  !isLoanPlan && 
                  normalizedPlanStatus === "active" && 
                  (plan.dailyContribution || 0) > 0 &&
                  plan.latestContributionUpdateRequest?.status !== "pending";

                const cardTone = isLoanPlan
                  ? "border-indigo-500 bg-indigo-50/80 shadow-indigo-100 shadow-xl ring-2 ring-indigo-500/20"
                  : isPendingLoan
                    ? "border-sky-300 bg-sky-50/40 shadow-sm"
                    : isRejectedLoan
                      ? "border-rose-400 bg-rose-50/50 shadow-sm"
                      : "border-slate-200 bg-white shadow-sm";

                return (
                  <div
                    key={plan._id}
                    className={`rounded-3xl border px-4 py-4 transition-all duration-300 hover:shadow-lg sm:px-5 ${cardTone}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
                          <h3 className="text-lg font-semibold text-slate-900">{plan.planName}</h3>
                          <StatusBadge status={plan.status} />
                          {requestStatusInfo ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${requestStatusInfo.className}`}
                            >
                              Withdrawal {requestStatusInfo.label}
                            </span>
                          ) : null}
                          {isLoanPlan ? (
                            normalizedLoanStatus === "completed" || normalizedPlanStatus === "completed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                <CheckCircle2 className="h-3 w-3" /> Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                                <CheckCircle2 className="h-3 w-3" /> Active Loan
                              </span>
                            )
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500">
                          Daily ₦{Number(plan.dailyContribution).toLocaleString()} • Available ₦
                          {Number(plan.availableBalance).toLocaleString()}
                        </p>
                          {plan.targetAmount ? (
                            <p className="text-xs text-slate-400">
                              Target ₦{Number(plan.targetAmount).toLocaleString()} • Started {new Date(plan.startDate).toLocaleDateString()}
                            </p>
                          ) : null}
                          {plan.latestContributionUpdateRequest?.status === "pending" && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Update Pending: ₦{Number(plan.latestContributionUpdateRequest.proposedAmount).toLocaleString()}
                            </div>
                          )}
                        </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold sm:justify-start">
                        <button
                          type="button"
                          onClick={() => handleFetchEntries(plan._id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-primary/40 hover:text-primary"
                        >
                          View ledger
                        </button>
                        {!hidePlanActions ? (
                          <div data-plan-actions={plan._id} className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPlanActionsId((prev) => (prev === plan._id ? null : plan._id))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-primary/40 hover:text-primary"
                              aria-haspopup="menu"
                              aria-expanded={openPlanActionsId === plan._id}
                            >
                              <MoreVertical className="h-4 w-4" />
                              Actions
                            </button>
                            {openPlanActionsId === plan._id ? (
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPlanActionsId(null);
                                    handleOpenDeposit(plan);
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                    hasRemittanceToday
                                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                  disabled={hasRemittanceToday}
                                >
                                  Record deposit
                                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                                </button>
                                {canEditContribution ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPlanActionsId(null);
                                      handleOpenContributionModal(plan);
                                    }}
                                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                  >
                                    Update daily amount
                                    <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                                  </button>
                                ) : null}
                                {!hideWithdrawalAction ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPlanActionsId(null);
                                      handleOpenWithdrawal(plan);
                                    }}
                                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                  >
                                    Request withdrawal
                                    <Upload className="h-3.5 w-3.5 text-amber-500" />
                                  </button>
                                ) : null}
                                {canRequestLoan ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPlanActionsId(null);
                                      handleOpenLoanRequest(plan);
                                    }}
                                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                  >
                                    Request loan
                                    <Wallet className="h-3.5 w-3.5 text-blue-500" />
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {loanRequest && loanStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                            <Loader2 className="h-3 w-3 animate-spin" /> Waiting Approval
                          </span>
                        ) : null}
                        {isRejectedLoan ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            <XCircle className="h-3 w-3" /> Loan Rejected
                          </span>
                        ) : null}
                        {isLoanPlan ? (
                          normalizedLoanStatus === "completed" || normalizedPlanStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                              <CheckCircle2 className="h-3 w-3" /> Loan Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                              <CheckCircle2 className="h-3 w-3" /> Active Loan
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>

                    {activePlanId === plan._id && currentPlan ? (
                      <div className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                        {savingsLoading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading plan details…
                          </div>
                        ) : (
  <div className="space-y-4">
    {/* Month Selector for Plan Card */}
    {!isCurrentLoanPlan && (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Monthly View</h4>
          <p className="text-xs text-slate-500">Review metrics and activity for the selected period.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary shadow-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <select
            id={`plan-card-month-filter-${activePlanId || "all"}`}
            value={transactionMonthFilter}
            onChange={(event) => setTransactionMonthFilter(event.target.value)}
            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
          >
            <option value="all">All time records</option>
            {planMonthOptions.map((option) => (
              <option key={option} value={option} className="text-slate-900">
                {formatMonthLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>
    )}

    <div
      className={`grid grid-cols-1 gap-4 ${
        isCurrentLoanPlan
          ? "sm:grid-cols-2 md:grid-cols-3"
          : "sm:grid-cols-2 md:grid-cols-4"
      }`}
    >
                            {isCurrentLoanPlan ? (
                              <>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Loan Amount{planLabelSuffix}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.loanAmount
                                        : parseAmount(currentPlan.loanDetails?.amount || currentLoanRequest?.amount || 0),
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Paid So Far{planLabelSuffix}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-emerald-600">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.loanPaid
                                        : planCardMetrics.loanPaid
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Loan Balance (Owed){planLabelSuffix}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-rose-600">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.loanBalance
                                        : planCardMetrics.loanBalance
                                    )}
                                  </p>
                                </div>
                                <div className="md:col-span-3 pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                                   <span>Start Date: {currentPlan.loanDetails?.startDate ? new Date(currentPlan.loanDetails.startDate).toLocaleDateString() : 'N/A'}</span>
                                   <span className="font-semibold text-indigo-600">Expected End Date: {currentPlan.loanDetails?.endDate ? new Date(currentPlan.loanDetails.endDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                {currentLoanStatus === 'rejected' ? (
                                  <div className="md:col-span-4 mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                                    <strong>Loan Request Rejected:</strong>{' '}
                                    {currentLoanRequest?.requestDate
                                      ? `A loan request was made on ${new Date(currentLoanRequest.requestDate).toLocaleDateString()} but was not approved.`
                                      : "A loan request on this plan was not approved."}
                                  </div>
                                ) : null}
                                {currentLoanStatus === 'pending' ? (
                                  <div className="md:col-span-4 mb-4 rounded-xl bg-sky-50 p-3 text-xs text-sky-700 border border-sky-100">
                                    <strong>Loan Request Pending:</strong> Your loan request is currently awaiting administrator approval.
                                  </div>
                                ) : null}
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Total deposited{planLabelSuffix}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.totalDeposited
                                        : parseAmount(currentPlan.totalDeposited || 0),
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Maintenance fees{planLabelSuffix}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.totalFees
                                        : parseAmount(currentPlan.totalFees || 0),
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Total withdrawn{isPlanCardScopedToMonth ? " (this month)" : ""}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-slate-900">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.totalWithdrawn
                                        : parseAmount(currentPlan.totalWithdrawn || 0),
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Available balance{isPlanCardScopedToMonth ? " (this month)" : ""}
                                  </p>
                                  <p className="mt-1 text-base font-semibold text-emerald-600">
                                    {formatCurrency(
                                      isPlanCardScopedToMonth
                                        ? planCardMetrics.availableBalance
                                        : parseAmount(currentPlan.availableBalance || 0),
                                    )}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-4">
                            {isCurrentLoanPlan ? (
                              <div className="rounded-2xl border border-indigo-200 bg-white">
                                <header className="flex flex-col gap-3 border-b border-indigo-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="text-center sm:text-left">
                                    <h4 className="text-sm font-semibold text-indigo-900">Loan repayment card</h4>
                                    <p className="text-xs text-indigo-500">Track 32-day repayment schedule and fill missed days first.</p>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                                    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Paid {loanCardSummary.paid}</span>
                                      <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Missed {loanCardSummary.missed}</span>
                                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600">Upcoming {loanCardSummary.upcoming}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleOpenLoanCard}
                                      className="inline-flex items-center gap-2 rounded-full border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                    >
                                      View card
                                    </button>
                                  </div>
                                </header>
                                <div className="px-4 py-4 text-xs text-slate-600">
                                  <p>
                                    Payments are mapped into 32 sequential boxes. Any new repayment fills the earliest unfilled slot so that missed days are closed before marking future dates.
                                  </p>
                                </div>
                              </div>
                            ) : null}

                            <div className="rounded-2xl border border-slate-200 bg-white">
                              <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-center sm:text-left">
                                  <h4 className="text-sm font-semibold text-slate-900">Transactions</h4>
                                  <p className="text-xs text-slate-500">Filter by type and review recent activity.</p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                                  <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                                    {["all", "deposit", "fee", "withdrawal"].map((option) => {
                                      const labels = {
                                        all: "All",
                                        deposit: "Deposits",
                                        fee: "Fees",
                                        withdrawal: "Withdrawals",
                                      };
                                      const isActive = transactionFilter === option;
                                      return (
                                        <button
                                          key={option}
                                          type="button"
                                          onClick={() => setTransactionFilter(option)}
                                          className={`rounded-full px-3 py-1 transition ${
                                            isActive ? "bg-white text-primary shadow" : "hover:bg-white/80"
                                          }`}
                                        >
                                          {labels[option]}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {!isCurrentLoanPlan ? (
                                    <button
                                      type="button"
                                      onClick={handleOpenWard}
                                      className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                                    >
                                      View card
                                    </button>
                                  ) : null}
                                </div>
                              </header>
                              <div className="max-h-60 overflow-y-auto">
                                {!filteredTransactions.length ? (
                                  <div className="px-4 py-6 text-center text-xs text-slate-500">No transactions found for this filter.</div>
                                ) : (
                                  <ul className="divide-y divide-slate-100">
                                    {filteredTransactions.map((entry) => (
                                      <li key={entry._id} className="flex items-center justify-between px-4 py-3 text-sm">
                                        <div>
                                          <p className="font-semibold text-slate-800">{entry.type.toUpperCase()}</p>
                                          <p className="text-xs text-slate-500">{entry.narration || "No narration"}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`font-semibold ${entry.type === "deposit" ? "text-emerald-600" : entry.type === "withdrawal" ? "text-rose-600" : "text-slate-900"}`}>
                                            {formatCurrency(entry.amount)}
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            {formatDateLabel(entry.recordedAt || entry.createdAt)}
                                          </p>
                                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                            {formatTime(entry.recordedAt || entry.createdAt)}
                                          </p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white">
                              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <h4 className="text-sm font-semibold text-slate-900">Withdrawal requests</h4>
                              </header>
                              <div className="max-h-52 overflow-y-auto">
                                {!planWithdrawalRequests.length ? (
                                  <div className="px-4 py-6 text-center text-xs text-slate-500">No withdrawal requests yet.</div>
                                ) : (
                                  <ul className="divide-y divide-slate-100 text-sm">
                                    {planWithdrawalRequests.map((request) => {
                                      const info = withdrawalStatusConfig[request.status] || withdrawalStatusConfig.pending;
                                      return (
                                        <li key={request._id} className="flex items-center justify-between px-4 py-3">
                                          <div>
                                            <p className="font-semibold text-slate-800">
                                              ₦{Number(request.amount).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {request.narration || "No narration"}
                                            </p>
                                          </div>
                                          <div className="text-right text-xs">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${info.className}`}>
                                              {info.label}
                                            </span>
                                            <p className="mt-1 text-slate-400">
                                              {new Date(request.recordedAt || request.createdAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            </div>
          )}
        </div>
      </section>

      <Modal
        open={isEditModalOpen}
        title="Update customer information"
        onClose={() => setIsEditModalOpen(false)}
      >
        {mutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {mutationError}
          </div>
        ) : null}
        <EditCustomerForm initialValues={editFormValues} onSubmit={handleEditSubmit} submitting={loading} />
      </Modal>

      <Modal
        open={isDepositModalOpen}
        title="Record deposit"
        onClose={() => setIsDepositModalOpen(false)}
      >
        {savingsMutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {savingsMutationError}
          </div>
        ) : null}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              {selectedBackdate ? "Approved Backdate" : "Recording for Today"}
            </span>
          </div>
          {!selectedBackdate && (
            <button
              onClick={() => {
                setIsDepositModalOpen(false);
                setIsBackdateModalOpen(true);
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Request Backdate
            </button>
          )}
        </div>
        <ContributionForm
          initialValues={depositFormValues}
          onSubmit={handleDepositSubmit}
          submitting={savingsLoading}
          actionLabel="Record deposit"
          icon={Download}
          minDate={getPlanStartDate(plansById[activePlanId] || plans.find((item) => item._id === activePlanId))}
          maxDate={new Date().toISOString()}
          readOnlyDate={!selectedBackdate}
        />
      </Modal>

      <Modal
        open={isConfirmDepositModalOpen}
        title="Confirm Deposit"
        onClose={() => setIsConfirmDepositModalOpen(false)}
      >
        <div className="space-y-6">
          <div className="rounded-2xl bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-800">
              Are you sure you want to deposit <span className="text-lg font-bold">{formatCurrency(pendingDepositValues?.amount)}</span> to this plan?
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsConfirmDepositModalOpen(false)}
              className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeposit}
              disabled={savingsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {savingsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Confirm and Record
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isWithdrawalModalOpen}
        title="Withdraw funds"
        onClose={() => setIsWithdrawalModalOpen(false)}
      >
        {withdrawalErrorMessage ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {withdrawalErrorMessage}
          </div>
        ) : null}
        <ContributionForm
          initialValues={withdrawalFormValues}
          onSubmit={handleWithdrawalSubmit}
          submitting={savingsLoading}
          actionLabel="Withdraw"
          icon={Upload}
        />
      </Modal>

      <Modal
        open={isPlanModalOpen}
        title="Launch savings plan"
        onClose={() => {
          setIsPlanModalOpen(false);
          setPlanFormValues(defaultPlanForm);
        }}
      >
        {savingsMutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {savingsMutationError}
          </div>
        ) : null}
        <PlanForm initialValues={planFormValues} onSubmit={handleCreatePlan} submitting={savingsLoading} />
      </Modal>
      <Modal
        open={isContributionModalOpen}
        title="Request daily contribution update"
        onClose={() => {
          setIsContributionModalOpen(false);
          setContributionUpdateFormValues(defaultContributionUpdateForm);
        }}
      >
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            This request will be sent to an <strong>Administrator</strong> for approval. The new
            daily amount and maintenance fee will only be applied once approved.
          </p>
        </div>
        {savingsMutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {savingsMutationError}
          </div>
        ) : null}
        <ContributionForm
          initialValues={{
            amount: contributionUpdateFormValues.dailyContribution,
            narration: "Daily contribution update request",
            recordedAt: new Date().toISOString().slice(0, 10),
          }}
          onSubmit={(formValues) =>
            handleContributionUpdateSubmit({ dailyContribution: formValues.amount })
          }
          submitting={savingsLoading}
          actionLabel="Submit request"
          icon={Send}
        />
      </Modal>
      <LoanRequestModal
        open={isLoanModalOpen}
        plan={plans.find(p => p._id === activePlanId)}
        onClose={() => setIsLoanModalOpen(false)}
        onSubmit={handleLoanRequestSubmit}
        submitting={savingsLoading}
      />
      <Modal
        open={isLoanCardModalOpen}
        title="Loan repayment card"
        onClose={handleCloseLoanCard}
        widthClass="max-w-5xl"
      >
        {!loanCardSlots.length ? (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-10 text-center text-sm text-indigo-600">
            No repayment data available yet.
          </div>
        ) : (
          <div className="relative">
            <div className="rounded-3xl bg-slate-950 p-6 shadow-inner">
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
                        {slot.status === "paid"
                          ? "Paid"
                          : slot.status === "missed"
                            ? "Missed"
                            : "Pending"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-300">
                        {formatDateLabel(slot.scheduledDate)}
                      </p>
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
                      <p className="font-semibold text-slate-700">{formatLoanSlotLabel(
                        selectedLoanSlotDetail.scheduledDate,
                        selectedLoanSlotDetail.paymentDate,
                        selectedLoanSlotDetail.status,
                      )}</p>
                      <p className="text-slate-500">
                        Expected amount: <span className="font-semibold text-slate-900">{formatCurrency(selectedLoanSlotAmount)}</span>
                      </p>
                    </div>

                    {selectedLoanSlotDetail.status === "paid" ? (
                      <div className="space-y-2 rounded-xl bg-emerald-50/70 p-3 text-xs text-emerald-700">
                        <p className="font-semibold text-emerald-800">Payment recorded</p>
                        <p>
                          Amount received: <span className="font-semibold text-emerald-900">{formatCurrency(selectedLoanSlotDetail.paymentEntry?.amount || selectedLoanSlotAmount)}</span>
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
      <Modal
        open={isWardModalOpen}
        title={`Contribution card - ${transactionMonthFilter === "all" ? "All Time" : formatMonthLabel(transactionMonthFilter)}`}
        onClose={handleCloseWard}
        widthClass="max-w-5xl"
      >
        {!wardCells.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No contribution entries yet.
          </div>
        ) : (
          <div className="relative">
            <div className="rounded-3xl bg-slate-950 p-6 shadow-inner">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {wardCells.map((cell) => {
                  const palette = cell.palette;
                  const isFilled = cell.filled;
                  const isSelected = selectedWardSlot === cell.slot && isSlotDetailOpen;

                  const slotBgClass = isFilled
                    ? palette?.slotBg || "bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 text-emerald-100"
                    : "bg-slate-900 text-slate-500";
                  const slotBorderClass = isFilled
                    ? palette?.slotBorder || "border-emerald-500"
                    : "border-slate-800";
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
                        setIsSlotDetailOpen(true);
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

            {isSlotDetailOpen && selectedWardCell ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 text-sm shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot</p>
                      <p className="text-lg font-semibold text-slate-900">Slot {selectedWardSlot ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSlotDetailOpen(false)}
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
                              <p className="text-xs font-semibold text-slate-600">{formatTime(entry.recordedAt || entry.createdAt)}</p>
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

      <BackdateRequestModal
        isOpen={isBackdateModalOpen}
        onClose={() => setIsBackdateModalOpen(false)}
        onSubmit={handleBackdateSubmit}
        submitting={backdateMutationStatus === "loading"}
        plan={plansById[activePlanId] || plans.find((item) => item._id === activePlanId)}
      />
    </div>
  );
}
