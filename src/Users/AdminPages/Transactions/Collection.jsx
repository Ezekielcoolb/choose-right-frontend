import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  CalendarDays,
  CalendarRange,
  Filter,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import {
  fetchAdminSavingsPlans,
  fetchAdminPlanEntries,
} from "../../../redux/slices/savingsSlice";
import { fetchCustomers } from "../../../redux/slices/customersSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";

const PAYMENT_TYPES = new Set([
  "deposit",
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "repayment",
]);

const isLoan = (plan) => {
  if (!plan) return false;
  const status = (plan.loanStatus || plan.status || "").toLowerCase();
  const type = (plan.planType || "").toLowerCase();
  // Only classify as Loan if it's explicitly approved, active, or in a terminal "paid" state.
  // Pending and Rejected requests should stay as Savings.
  return (
    ["approved", "active", "completed", "disbursed", "repaid"].includes(status) ||
    plan.isLoan === true ||
    type === "loan"
  );
};

const deriveLoanMetrics = (plan) => {
  const loanDetails = plan?.loanDetails || {};
  const loanFees = Number(
    loanDetails.maintenanceFee ??
      loanDetails.processingFee ??
      loanDetails.serviceCharge ??
      plan?.loanFees ??
      0,
  );
  return { loanFees: Number.isFinite(loanFees) && loanFees > 0 ? loanFees : 0 };
};

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const getLocalDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

const getDateKey = (value) => {
  const date = getLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const getMonthKey = (value) => {
  const date = getLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 7);
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (reference) => {
  const date = startOfDay(reference);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  date.setDate(date.getDate() - diff);
  return date;
};

const endOfWeek = (reference) => {
  const date = startOfWeek(reference);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
};

const extractName = (entity) => {
  if (!entity) return { name: "", phone: "" };
  if (typeof entity === "string") return { name: entity, phone: "" };
  const first = entity.firstName || entity.firstname || "";
  const last = entity.lastName || entity.lastname || "";
  const full = entity.fullName || entity.name || `${first} ${last}`.trim();
  return {
    name: full || "",
    phone: entity.phone || entity.phoneNumber || "",
  };
};

const deriveCustomerMeta = (plan, customersById) => {
  const explicitName = plan.customerName;
  const explicitPhone = plan.customerPhone;
  if (explicitName || explicitPhone) {
    return {
      id: typeof plan.customerId === "string" ? plan.customerId : plan.customerId?._id || null,
      name: explicitName || "Unknown customer",
      phone: explicitPhone || "—",
    };
  }

  const direct = extractName(plan.customer || plan.customerId);
  if (direct.name) {
    return {
      id: typeof plan.customerId === "string" ? plan.customerId : plan.customerId?._id || null,
      name: direct.name,
      phone: direct.phone || "—",
    };
  }

  const planCustomerId = typeof plan.customerId === "string" ? plan.customerId : plan.customerId?._id;
  if (planCustomerId && customersById.has(planCustomerId)) {
    const resolved = extractName(customersById.get(planCustomerId));
    if (resolved.name) {
      return { id: planCustomerId, name: resolved.name, phone: resolved.phone || "—" };
    }
  }

  return { id: null, name: "Unknown customer", phone: "—" };
};

const deriveCsoMeta = (plan, csosById) => {
  const planCsoId = typeof plan.csoId === "string" ? plan.csoId : plan.csoId?._id || plan.cso?._id;
  const direct = extractName(plan.cso || plan.csoId);
  if (direct.name) {
    return { id: planCsoId || null, name: direct.name, phone: direct.phone || "—" };
  }

  if (planCsoId && csosById.has(planCsoId)) {
    const resolved = extractName(csosById.get(planCsoId));
    if (resolved.name) {
      return { id: planCsoId, name: resolved.name, phone: resolved.phone || "—" };
    }
  }

  return { id: planCsoId || null, name: "—", phone: "—" };
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminCollectionsPage() {
  const dispatch = useDispatch();

  const {
    adminPlans,
    adminPlansStatus,
    adminPlansError,
    entriesByPlan,
  } = useSelector((state) => state.savings);
  const { items: customers, status: customersStatus } = useSelector((state) => state.customers);
  const { items: csos, status: csosStatus } = useSelector((state) => state.csos);

  const [quickRange, setQuickRange] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (adminPlansStatus === "idle") {
      dispatch(fetchAdminSavingsPlans());
    }
  }, [adminPlansStatus, dispatch]);

  useEffect(() => {
    if (customersStatus === "idle") {
      dispatch(fetchCustomers({ admin: true }));
    }
  }, [customersStatus, dispatch]);

  useEffect(() => {
    if (csosStatus === "idle") {
      dispatch(fetchCsos());
    }
  }, [csosStatus, dispatch]);

  const fetchedPlans = useRef(new Set());

  useEffect(() => {
    if (!adminPlans?.length) return;

    adminPlans.forEach((plan) => {
      if (!plan?._id) return;
      if (fetchedPlans.current.has(plan._id)) return;

      if (entriesByPlan?.[plan._id]?.items) {
        fetchedPlans.current.add(plan._id);
        return;
      }

      fetchedPlans.current.add(plan._id);
      dispatch(
        fetchAdminPlanEntries({
          customerId: plan.customerId?._id || plan.customerId,
          planId: plan._id,
          page: 1,
          limit: 500,
        }),
      );
    });
  }, [adminPlans, entriesByPlan, dispatch]);

  const customersById = useMemo(() => {
    const map = new Map();
    (customers || []).forEach((customer) => {
      if (customer?._id) {
        map.set(customer._id, customer);
      }
    });
    return map;
  }, [customers]);

  const csosById = useMemo(() => {
    const map = new Map();
    (csos || []).forEach((cso) => {
      if (cso?._id) {
        map.set(cso._id, cso);
      }
    });
    return map;
  }, [csos]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getDateKey(today), [today]);
  const yesterdayKey = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 1);
    return getDateKey(date);
  }, [today]);
  const thisWeekStart = useMemo(() => startOfWeek(today), [today]);
  const thisWeekEnd = useMemo(() => endOfWeek(today), [today]);

  const allEntries = useMemo(() => {
    if (!adminPlans?.length) return [];

    const entries = [];

    adminPlans.forEach((plan) => {
      const planEntries = entriesByPlan?.[plan._id]?.items || [];
      if (!planEntries.length) return;

      const customerMeta = deriveCustomerMeta(plan, customersById);
      const csoMeta = deriveCsoMeta(plan, csosById);

      planEntries.forEach((entry) => {
        const entryType = (entry.type || "").toLowerCase();
        if (!PAYMENT_TYPES.has(entryType)) return;

        const amount = Number(entry.amount || entry.value || 0);
        if (!Number.isFinite(amount) || amount <= 0) return;

        const recordedAt = entry.recordedAt || entry.createdAt;
        const localDate = getLocalDate(recordedAt);
        const dateKey = getDateKey(recordedAt);
        const monthKey = getMonthKey(recordedAt);

        const isLoanPlan = isLoan(plan);
        const maintenanceFees = Number(plan.totalFees || plan.maintenanceFee || 0);
        const loanFees = isLoanPlan ? deriveLoanMetrics(plan).loanFees : 0;

        entries.push({
          id: `${plan._id}-${entry._id || entry.id || recordedAt}`,
          planId: plan._id,
          planName: plan.planName || "Savings plan",
          planCode: plan.planCode || plan._id,
          customerName: customerMeta.name,
          customerPhone: customerMeta.phone,
          csoId: csoMeta.id,
          csoName: csoMeta.name,
          csoPhone: csoMeta.phone,
          amount,
          type: entryType.replace(/[_-]+/g, " "),
          narration: entry.narration || entry.description || "",
          recordedAt: localDate,
          dateKey,
          monthKey,
          maintenanceFees,
          loanFees,
          isLoanPlan,
        });
      });
    });

    return entries.sort((a, b) => {
      if (!a.recordedAt || !b.recordedAt) return 0;
      return b.recordedAt - a.recordedAt;
    });
  }, [adminPlans, entriesByPlan, customersById, csosById]);

  const matchesQuickRange = (entry) => {
    if (!entry.recordedAt) return false;

    switch (quickRange) {
      case "today":
        return entry.dateKey === todayKey;
      case "yesterday":
        return entry.dateKey === yesterdayKey;
      case "thisWeek":
        return entry.recordedAt >= thisWeekStart && entry.recordedAt <= thisWeekEnd;
      case "custom":
        if (!customStart || !customEnd) return true;
        return (
          entry.recordedAt >= startOfDay(new Date(customStart)) &&
          entry.recordedAt <= endOfDay(new Date(customEnd))
        );
      case "all":
      default:
        return true;
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (!matchesQuickRange(entry)) return false;

      if (selectedMonth && entry.monthKey !== selectedMonth) {
        return false;
      }

      if (csoFilter !== "all" && entry.csoId !== csoFilter) {
        return false;
      }

      if (term) {
        const haystack = [
          entry.customerName,
          entry.planName,
          entry.planCode,
          entry.csoName,
          entry.narration,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [allEntries, matchesQuickRange, selectedMonth, csoFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [quickRange, selectedMonth, customStart, customEnd, csoFilter, searchTerm]);

  const totalRecords = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / (pageSize || 1)));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value) || PAGE_SIZE_OPTIONS[0];
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (canGoPrev) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }
  };

  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalRecords, (currentPage - 1) * pageSize + paginatedEntries.length);

  const totals = useMemo(
    () =>
      filteredEntries.reduce(
        (acc, entry) => {
          acc.count += 1;
          acc.amount += entry.amount;
          if (entry.csoId) {
            acc.csoSet.add(entry.csoId);
          }
          return acc;
        },
        { count: 0, amount: 0, csoSet: new Set() },
      ),
    [filteredEntries],
  );

  const csoOptions = useMemo(() => {
    const map = new Map();
    allEntries.forEach((entry) => {
      if (entry.csoId && entry.csoName) {
        map.set(entry.csoId, entry.csoName);
      }
    });
    return [{ value: "all", label: "All CSOs" }, ...Array.from(map.entries()).map(([value, label]) => ({ value, label }))];
  }, [allEntries]);

  const isLoading =
    adminPlansStatus === "loading" ||
    customersStatus === "loading" ||
    csosStatus === "loading" ||
    (adminPlans?.length > 0 && !allEntries.length);

  const hasError = Boolean(adminPlansError);

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Collections insight</p>
          <h1 className="text-3xl font-semibold text-slate-900">All payments</h1>
          <p className="text-sm text-slate-500">
            Monitor every deposit and loan repayment across CSOs, refine by date range, and review collection performance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch(fetchAdminSavingsPlans());
            dispatch(fetchCustomers({ admin: true }));
            dispatch(fetchCsos());
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className="h-4 w-4" /> Refresh data
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Collections volume</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.amount)}</p>
          <p className="text-xs text-slate-500">Total amount captured in view</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Entries that match the current filters</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active CSOs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.csoSet.size.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Unique CSOs recorded in results</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date scope</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{quickRange === "all" ? "All time" : quickRange === "custom" ? "Custom range" : quickRange === "thisWeek" ? "This week" : quickRange === "today" ? "Today" : "Yesterday"}</p>
          <p className="text-xs text-slate-500">Adjust the quick range to focus your analysis</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick range</span>
            {["today", "yesterday", "thisWeek", "all", "custom"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuickRange(value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  quickRange === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {value === "thisWeek" ? "This week" : value === "all" ? "All time" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {quickRange === "custom" ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <span className="text-xs uppercase tracking-wide text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by plan, narration, or customer"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Users className="h-4 w-4 text-slate-400" /> CSO
              <select
                value={csoFilter}
                onChange={(event) => setCsoFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {csoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {filteredEntries.length.toLocaleString()} record{filteredEntries.length === 1 ? "" : "s"} in view
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {hasError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {adminPlansError}
            </div>
          ) : isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading collections…
            </div>
          ) : !filteredEntries.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
              No payments match your filters.
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">CSO</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Narration</th>
                    <th className="px-4 py-3 text-right font-semibold">M. Fee</th>
                    <th className="px-4 py-3 text-right font-semibold">Loan Fee</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {entry.recordedAt
                          ? `${entry.recordedAt.toLocaleDateString()} • ${entry.recordedAt.toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{entry.planName}</p>
                        <p className="text-xs text-slate-400">{entry.planCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{entry.customerName}</p>
                        <p className="text-xs text-slate-400">{entry.customerPhone || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{entry.csoName || "—"}</p>
                        <p className="text-xs text-slate-400">{entry.csoPhone || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{entry.type}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.narration || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-400">
                        {entry.maintenanceFees > 0 ? formatCurrency(entry.maintenanceFees) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-400">
                        {entry.loanFees > 0 ? formatCurrency(entry.loanFees) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {totalRecords === 0
                      ? "No records to display"
                      : `Showing ${startIndex.toLocaleString()}–${endIndex.toLocaleString()} of ${totalRecords.toLocaleString()} record${totalRecords === 1 ? "" : "s"}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={!canGoPrev}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={!canGoNext}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

