import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CalendarDays, RefreshCw, Banknote, X, Search } from "lucide-react";
import {
  fetchSavingsPlans,
  fetchSavingsEntries,
} from "../../redux/slices/savingsSlice";
import { fetchCustomers } from "../../redux/slices/customersSlice";
import {
  recordCsoRemittance,
  setRemittanceDeadlineAlert,
} from "../../redux/slices/csoSlice";
import { fetchCsoProfile } from "../../redux/slices/csoAuthSlice";

const PAGE_SIZE = 10;

const PAYMENT_TYPES = new Set([
  "deposit",
  "loan_repayment",
  "loanrepayment",
  "loan-payment",
  "repayment",
]);

const getLocalDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const getTodayKey = () => getLocalDateKey(new Date());

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const getMillisUntilNextMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
};

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value) => value.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
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

const humanizeType = (type) => {
  if (!type) return "Payment";
  return type
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const extractNameFragments = (entity) => {
  if (!entity) return "";
  if (typeof entity === "string") {
    if (/^[a-f\d]{24}$/i.test(entity)) {
      return "";
    }
    return entity;
  }
  const fullName = entity.fullName || entity.name;
  if (fullName) return fullName;
  const combined = `${entity.firstName || ""} ${entity.lastName || ""}`.trim();
  if (combined) return combined;
  return "";
};

const getPlanCustomerId = (plan) => {
  if (!plan) return null;
  if (typeof plan.customerId === "string") return plan.customerId;
  if (plan.customerId?._id) return plan.customerId._id;
  if (plan.customer?._id) return plan.customer._id;
  return null;
};

const getCustomerName = (plan, customersById) => {
  if (!plan) return "Unknown";
  const explicit =
    plan.customerName ||
    extractNameFragments(plan.customer) ||
    extractNameFragments(plan.customerId);
  if (explicit) return explicit;

  const customerId = getPlanCustomerId(plan);
  if (customerId && customersById.has(customerId)) {
    const resolved = extractNameFragments(customersById.get(customerId));
    if (resolved) return resolved;
  }

  return "Unknown";
};

export default function CsoCollectionPage() {
  const dispatch = useDispatch();
  const {
    plansById,
    plansStatus,
    entriesByPlan,
    mutationStatus: savingsMutationStatus,
  } = useSelector((state) => state.savings);
  const { items: customerItems, status: customersStatus } = useSelector(
    (state) => state.customers,
  );
  const { profile: csoProfile } = useSelector((state) => state.csoAuth);
  const { remittanceStatus } = useSelector((state) => state.csos);

  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);
  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [remittanceError, setRemittanceError] = useState("");
  const [countdownMs, setCountdownMs] = useState(getMillisUntilNextMidnight);
  const [remittanceRecordedFlag, setRemittanceRecordedFlag] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const todayKey = getTodayKey();
  const isViewingToday = selectedDate === todayKey;

  useEffect(() => {
    if (plansStatus === "idle") {
      dispatch(fetchSavingsPlans());
    }
  }, [plansStatus, dispatch]);

  useEffect(() => {
    if (customersStatus === "idle") {
      dispatch(fetchCustomers());
    }
  }, [customersStatus, dispatch]);

  const plans = useMemo(() => Object.values(plansById || {}), [plansById]);
  const customersById = useMemo(() => {
    const map = new Map();
    (customerItems || []).forEach((customer) => {
      if (customer?._id) {
        map.set(customer._id, customer);
      }
    });
    return map;
  }, [customerItems]);

  const fetchedEntriesRef = useRef(new Set());

  useEffect(() => {
    if (plansStatus !== "succeeded" || !plans.length) {
      return;
    }

    plans.forEach((plan) => {
      if (!plan?._id) return;
      if (fetchedEntriesRef.current.has(plan._id)) return;
      if (entriesByPlan[plan._id]?.items) {
        fetchedEntriesRef.current.add(plan._id);
        return;
      }

      fetchedEntriesRef.current.add(plan._id);
      dispatch(fetchSavingsEntries({ planId: plan._id, page: 1, limit: 500 }));
    });
  }, [plansStatus, plans, entriesByPlan, dispatch]);

  const isPlansLoading = plansStatus === "loading" || plansStatus === "idle";
  const isCustomersLoading = customersStatus === "loading" || customersStatus === "idle";
  const isEntriesLoading = useMemo(() => {
    if (!plans.length) return false;
    return plans.some((plan) => !entriesByPlan[plan._id]?.items);
  }, [plans, entriesByPlan]);

  const payments = useMemo(() => {
    if (!plans.length) return [];
    const rows = [];
    plans.forEach((plan) => {
      const entries = entriesByPlan[plan._id]?.items || [];
      entries.forEach((entry) => {
        const recordedTimestamp = entry.recordedAt;
        const createdTimestamp = entry.createdAt;
        const entryDateKey = getLocalDateKey(recordedTimestamp || createdTimestamp);
        if (!entryDateKey || entryDateKey !== selectedDate) {
          return;
        }

        const entryType = (entry.type || "").toLowerCase();
        if (!PAYMENT_TYPES.has(entryType)) {
          return;
        }

        const amountValue = Number(entry.amount || 0);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
          return;
        }

        const customerName = getCustomerName(plan, customersById);
        let timeValue = null;
        if (createdTimestamp) {
          const createdDate = new Date(createdTimestamp);
          if (!Number.isNaN(createdDate.getTime())) {
            timeValue = createdDate;
          }
        }
        if (!timeValue && recordedTimestamp) {
          const hasTimeComponent =
            typeof recordedTimestamp === "string" && recordedTimestamp.includes("T");
          const recordedDate = new Date(recordedTimestamp);
          if (!Number.isNaN(recordedDate.getTime()) && hasTimeComponent) {
            timeValue = recordedDate;
          }
        }
        if (!timeValue && recordedTimestamp) {
          const recordedDate = new Date(recordedTimestamp);
          if (!Number.isNaN(recordedDate.getTime())) {
            timeValue = recordedDate;
          }
        }

        rows.push({
          id: `${plan._id}-${entry._id || entry.id || createdTimestamp || recordedTimestamp}`,
          customerName,
          planName: plan.planName || "Unnamed plan",
          type: humanizeType(entry.type || "payment"),
          amount: amountValue,
          narration: entry.narration || "",
          time: timeValue,
        });
      });
    });

    return rows.sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return b.time - a.time;
    });
  }, [plans, entriesByPlan, selectedDate, customersById]);

  const totalAmount = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const lookup = searchTerm.toLowerCase();
    return payments.filter((payment) => {
      return [
        payment.customerName,
        payment.planName,
        payment.type,
        payment.narration,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(lookup));
    });
  }, [payments, searchTerm]);

  const paginatedPayments = useMemo(() => {
    const total = filteredPayments.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return {
      total,
      totalPages,
      page,
      items: filteredPayments.slice(start, start + PAGE_SIZE),
    };
  }, [filteredPayments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const uniqueCustomersCount = useMemo(() => {
    const set = new Set();
    payments.forEach((payment) => {
      if (payment.customerName) {
        set.add(payment.customerName);
      }
    });
    return set.size;
  }, [payments]);

  const uniquePlansCount = useMemo(() => {
    const set = new Set();
    payments.forEach((payment) => {
      // Assuming planName is unique enough or we can use ID if we had it.
      // Let's use ID if possible. Checking payment object structure.
      // In rows.push, ID is `${plan._id}-${entry._id ...}`.
      // Let's extract planId or add it to the payment object.
      // Re-examining rows.push logic.
      if (payment.planName) {
        set.add(payment.planName);
      }
    });
    return set.size;
  }, [payments]);

  useEffect(() => {
    setRemittanceRecordedFlag(false);
  }, [selectedDate]);

  const hasRemittanceForSelectedDate = useMemo(() => {
    if (remittanceRecordedFlag) return true;
    const remittances = csoProfile?.remittance || [];
    return remittances.some((entry) => getLocalDateKey(entry?.createdAt) === selectedDate);
  }, [csoProfile?.remittance, remittanceRecordedFlag, selectedDate]);

  useEffect(() => {
    if (!isViewingToday || hasRemittanceForSelectedDate) {
      setCountdownMs(0);
      return undefined;
    }

    setCountdownMs(getMillisUntilNextMidnight());
    const interval = setInterval(() => {
      setCountdownMs(getMillisUntilNextMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, [isViewingToday, hasRemittanceForSelectedDate]);

  useEffect(() => {
    if (!isViewingToday) {
      return;
    }

    if (countdownMs === 0) {
      setSelectedDate(getTodayKey());
    }
  }, [countdownMs, isViewingToday]);

  const isCountdownCritical = countdownMs <= 5 * 60 * 60 * 1000;
  const countdownLabel = formatDuration(countdownMs);

  useEffect(() => {
    if (!isViewingToday) {
      dispatch(setRemittanceDeadlineAlert(false));
      return;
    }

    dispatch(setRemittanceDeadlineAlert(hasRemittanceForSelectedDate ? false : isCountdownCritical));
  }, [dispatch, isCountdownCritical, hasRemittanceForSelectedDate, isViewingToday]);

  const isBusy =
    isPlansLoading ||
    isCustomersLoading ||
    (plans.length > 0 && (isEntriesLoading || savingsMutationStatus === "loading"));

  const handleDateChange = (event) => {
    const { value } = event.target;
    if (!value) return;
    setSelectedDate(value);
  };

  const handleResetDate = () => {
    setSelectedDate(getTodayKey());
  };

  const isRemitting = remittanceStatus === "loading";
  const handleOpenRemittance = () => {
    if (!isViewingToday || hasRemittanceForSelectedDate) return;
    setRemittanceAmount("");
    setRemittanceError("");
    setIsRemittanceModalOpen(true);
  };

  const handleCloseRemittance = () => {
    if (isRemitting) return;
    setIsRemittanceModalOpen(false);
  };

  const handleSubmitRemittance = async (event) => {
    event.preventDefault();
    setRemittanceError("");

    if (!isViewingToday || hasRemittanceForSelectedDate) {
      setRemittanceError("Remittance for today has already been recorded.");
      return;
    }

    if (!csoProfile?._id) {
      setRemittanceError("CSO profile not available. Please try again later.");
      return;
    }

    if (!totalAmount) {
      setRemittanceError("No collections recorded for this date.");
      return;
    }

    const parsedAmount = Number(remittanceAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setRemittanceError("Enter a valid remittance amount.");
      return;
    }

    try {
      await dispatch(
        recordCsoRemittance({
          csoId: csoProfile._id,
          amountCollected: totalAmount,
          amountPaid: parsedAmount,
          remark: "",
        }),
      ).unwrap();
      setRemittanceRecordedFlag(true);
      dispatch(fetchCsoProfile()).catch(() => {});
      setIsRemittanceModalOpen(false);
      setRemittanceAmount("");
    } catch (error) {
      setRemittanceError(error || "Failed to record remittance.");
    }
  };

  const countdownBadgeClass = !isViewingToday
    ? "border-slate-200 bg-slate-50 text-slate-500"
    : hasRemittanceForSelectedDate
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : isCountdownCritical
        ? "border-rose-200 bg-rose-50 text-rose-600 animate-pulse"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const countdownMessage = !isViewingToday
    ? `Viewing collections for ${selectedDate}`
    : hasRemittanceForSelectedDate
      ? "Remittance recorded for today"
      : `Remittance window resets in ${countdownLabel}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Daily collections</h1>
          <p className="text-sm text-slate-500">
            Review all customer payments for the selected date. Use the date picker to revisit past
            collection days.
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${countdownBadgeClass}`}
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-current" />
            {countdownMessage}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <CalendarDays className="h-4 w-4 text-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full rounded-full border border-slate-100 px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={handleResetDate}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Today
          </button>
          {isViewingToday ? (
            <button
              type="button"
              onClick={handleOpenRemittance}
              disabled={!totalAmount || isBusy || hasRemittanceForSelectedDate}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
            >
              <Banknote className="h-4 w-4" />
              Record remittance
            </button>
          ) : null}
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total collected</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div> */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{uniqueCustomersCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Plans</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{uniquePlansCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Collections table
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by customer, plan, type or narration"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 sm:overflow-hidden">
          {isBusy ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Gathering payments…
            </div>
          ) : payments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No payments recorded for this date.
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No payments match your search.
            </div>
          ) : (
            <table className="w-full min-w-[720px] table-auto">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Narration</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {paginatedPayments.items.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{formatTime(payment.time)}</td>
                    <td className="px-4 py-3">{payment.customerName}</td>
                    <td className="px-4 py-3">{payment.planName}</td>
                    <td className="px-4 py-3">{payment.type}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{payment.narration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredPayments.length > 0 ? (
          <div className="flex flex-col items-center gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 sm:flex-row sm:justify-between sm:text-sm">
            <span>
              Showing {(paginatedPayments.page - 1) * PAGE_SIZE + 1}–
              {Math.min(paginatedPayments.page * PAGE_SIZE, paginatedPayments.total)} of {paginatedPayments.total} payments
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={paginatedPayments.page === 1}
                className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(paginatedPayments.totalPages, page + 1),
                  )
                }
                disabled={paginatedPayments.page === paginatedPayments.totalPages}
                className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {isRemittanceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Record remittance</h2>
                {/* <p className="mt-1 text-sm text-slate-500">
                  Remit today’s collected total of {formatCurrency(totalAmount)}.
                </p> */}
              </div>
              <button
                type="button"
                onClick={handleCloseRemittance}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmitRemittance}>
              <div className="space-y-2">
                <label htmlFor="remittance-amount" className="text-sm font-medium text-slate-600">
                  Amount remitted
                </label>
                <input
                  id="remittance-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={remittanceAmount}
                  onChange={(event) => setRemittanceAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter amount remitted"
                />
                <p className="text-xs text-slate-500">
                  This amount will be added to the CSO’s paid total for today.
                </p>
              </div>

              {remittanceError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {remittanceError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseRemittance}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  disabled={isRemitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                >
                  {isRemitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
