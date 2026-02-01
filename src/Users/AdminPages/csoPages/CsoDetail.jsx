import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchCsoById,
  fetchAdminCsoDetail,
  setSelectedCso,
  resetCsoStatus,
  updateCsoStatus,
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
} from "lucide-react";

const tabConfig = [
  { key: "details", label: "Details" },
  { key: "customers", label: "Customers" },
  { key: "remittance", label: "Remittance" },
  { key: "dashboard", label: "Dashboard" },
  { key: "collections", label: "Collections" },
];

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
  } = useSelector((state) => state.csos);
  const [activeTab, setActiveTab] = useState("details");
  const [planModalCustomerId, setPlanModalCustomerId] = useState(null);

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

  const dashboardStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totals = customers.reduce(
      (acc, customer) => {
        const summary = customer.savingsSummary || {};
        acc.totalPlans += summary.totalPlans || 0;
        acc.activePlans += summary.activePlans || 0;
        acc.totalDeposited += summary.totalDeposited || 0;
        acc.availableBalance += summary.availableBalance || 0;
        return acc;
      },
      {
        totalPlans: 0,
        activePlans: 0,
        totalDeposited: 0,
        availableBalance: 0,
      },
    );

    const totalRemitted = remittanceHistory.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);

    return {
      totalCustomers,
      totalPlans: totals.totalPlans,
      activePlans: totals.activePlans,
      totalDeposited: totals.totalDeposited,
      availableBalance: totals.availableBalance,
      totalRemitted,
    };
  }, [customers, remittanceHistory]);

  const PAYMENT_TYPES = useMemo(
    () =>
      new Set([
        "deposit",
        "loan_repayment",
        "loanrepayment",
        "loan-payment",
        "repayment",
      ]),
    [],
  );

  const LOAN_PAYMENT_TYPES = useMemo(
    () =>
      new Set([
        "loan_repayment",
        "loanrepayment",
        "loan-payment",
        "loan repayment",
        "loanpayment",
        "loan",
        "repayment",
        "loanpayment",
        "loan-pay",
      ]),
    [],
  );

  const getLocalDateKey = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
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

  const [selectedCollectionDate, setSelectedCollectionDate] = useState(() => getLocalDateKey(new Date()));

  const paymentsForSelectedDate = useMemo(() => {
    if (!entries.length || !selectedCollectionDate) return [];
    const rows = [];
    entries.forEach((entry) => {
      if (!PAYMENT_TYPES.has((entry.type || "").toLowerCase())) return;

      const recordedTimestamp = entry.recordedAt;
      const createdTimestamp = entry.createdAt;
      const entryDateKey = getLocalDateKey(recordedTimestamp || createdTimestamp);
      if (!entryDateKey || entryDateKey !== selectedCollectionDate) {
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

      let timeValue = null;
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
      timeValue = recordedTime || createdTime || updatedTime;

      rows.push({
        id: String(entry._id || entry.id || `${entryDateKey}-${rows.length}`),
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
  }, [entries, plansById, customers, selectedCollectionDate, PAYMENT_TYPES]);

  const renderCollectionsTab = () => {
    const totals = paymentsForSelectedDate.reduce(
      (acc, payment) => {
        acc.total += payment.amount;
        acc.count += 1;
        return acc;
      },
      { total: 0, count: 0 },
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

        <div className="grid gap-4 sm:grid-cols-3">
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
                    onClick={() => setPlanModalCustomerId(customer._id)}
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
    if (!remittanceHistory.length) {
      return (
        <EmptyTab
          title="No remittance records"
          description="This CSO has not recorded any remittance yet. Records will appear once submissions are made."
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total remitted</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(
                remittanceHistory.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0),
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Remittance count</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{remittanceHistory.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Last remittance</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {new Date(remittanceHistory[0].createdAt || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Amount collected</th>
                <th className="px-4 py-3 text-right font-semibold">Amount remitted</th>
                <th className="px-4 py-3 text-left font-semibold">Remark</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDashboardTab = () => {
    const cards = [
      {
        label: "Customers",
        value: dashboardStats.totalCustomers,
        icon: Users,
        accent: "bg-sky-100 text-sky-700",
      },
      {
        label: "Active plans",
        value: dashboardStats.activePlans,
        icon: TrendingUp,
        accent: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Total plans",
        value: dashboardStats.totalPlans,
        icon: ClipboardList,
        accent: "bg-indigo-100 text-indigo-700",
      },
      {
        label: "Deposit volume",
        value: formatCurrency(dashboardStats.totalDeposited),
        icon: Wallet,
        accent: "bg-primary/10 text-primary",
      },
      {
        label: "Available balance",
        value: formatCurrency(dashboardStats.availableBalance),
        icon: PiggyBank,
        accent: "bg-amber-100 text-amber-700",
      },
      {
        label: "Total remitted",
        value: formatCurrency(dashboardStats.totalRemitted),
        icon: TrendingDown,
        accent: "bg-rose-100 text-rose-700",
      },
    ];

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Portfolio health overview</h3>
          <p className="mt-2 text-sm text-slate-500">
            Monitor the CSO's performance, customer growth, and liquidity position to quickly identify support needs.
          </p>
        </div>
      </div>
    );
  };

  const handleStatusToggle = () => {
    if (!cso) return;
    dispatch(updateCsoStatus({ csoId: cso._id, isActive: !cso.isActive }));
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
          renderCustomersTab()
        ) : activeTab === "remittance" ? (
          renderRemittanceTab()
        ) : activeTab === "collections" ? (
          renderCollectionsTab()
        ) : activeTab === "dashboard" ? (
          renderDashboardTab()
        ) : null}
      </div>

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
                            {formatCurrency(plan.totalDeposited || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Available</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(plan.availableBalance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Start date</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(plan.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

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
