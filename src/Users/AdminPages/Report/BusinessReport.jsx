import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, CalendarDays, Loader2 } from "lucide-react";

import { fetchAdminSavingsPlans, fetchAdminPlanEntries } from "../../../redux/slices/savingsSlice";
import { fetchActiveLoans } from "../../../redux/slices/adminLoanSlice";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const clone = new Date(value.getTime());
    if (Number.isNaN(clone.getTime())) return null;
    return clone;
  }

  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate;
};

const getMonthKey = (value) => {
  const date = toDateOrNull(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonthKey = (key) => {
  if (!key || typeof key !== "string") return null;
  const [yearToken, monthToken] = key.split("-");
  const year = Number.parseInt(yearToken, 10);
  const month = Number.parseInt(monthToken, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const formatMonthLabel = (key) => {
  const date = parseMonthKey(key);
  if (!date) return "—";
  return monthFormatter.format(date);
};

const startOfMonth = (date) => {
  const base = toDateOrNull(date) || new Date();
  const result = new Date(base.getFullYear(), base.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfMonth = (date) => {
  const base = toDateOrNull(date) || new Date();
  const result = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date) => {
  const base = toDateOrNull(date) || new Date();
  const result = new Date(base);
  const day = (result.getDay() + 6) % 7; // Monday as first day
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, amount) => {
  const base = toDateOrNull(date) || new Date();
  const result = new Date(base);
  result.setDate(result.getDate() + amount);
  return startOfWeek(result) ? result : result; // ensure normalized later if needed
};

const addMonths = (date, amount) => {
  const base = toDateOrNull(date) || new Date();
  const result = new Date(base);
  result.setDate(1);
  result.setMonth(result.getMonth() + amount);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getLocalDateKey = (value) => {
  if (!value) return null;
  const date = toDateOrNull(value);
  if (!date) return null;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const parseDateKey = (key) => {
  if (!key) return null;
  const [yearToken, monthToken, dayToken] = key.split("-");
  const year = Number.parseInt(yearToken, 10);
  const month = Number.parseInt(monthToken, 10) - 1;
  const day = Number.parseInt(dayToken, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const weekRangeFormatterShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const weekRangeFormatterLong = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatWeekRangeLabel = (start) => {
  const startDate = toDateOrNull(start);
  if (!startDate) return "—";
  const endDate = addDays(startDate, 6);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  if (sameYear) {
    const startLabel = weekRangeFormatterShort.format(startDate);
    const endLabel = weekRangeFormatterShort.format(endDate);
    return `${startLabel} — ${endLabel}, ${startDate.getFullYear()}`;
  }

  const startLabel = weekRangeFormatterLong.format(startDate);
  const endLabel = weekRangeFormatterLong.format(endDate);
  return `${startLabel} — ${endLabel}`;
};

const DEPOSIT_TYPES = new Set(["deposit", "loan_repayment", "loanrepayment", "repayment", "loan-payment"]);
const WITHDRAWAL_TYPES = new Set(["withdrawal", "payout", "loan_withdrawal"]);

const normalizeType = (value) => (value ? value.toString().toLowerCase() : "");

const isLoanPlan = (plan) => {
  if (!plan) return false;
  if (plan.isLoan) return true;
  const planType = normalizeType(plan.planType);
  if (planType === "loan") return true;
  const loanStatus = normalizeType(plan.loanStatus);
  if (["pending", "approved", "active", "completed"].includes(loanStatus)) return true;
  return Boolean(plan.loanDetails);
};

const getPlanReferenceDate = (plan) => {
  if (!plan) return null;
  if (isLoanPlan(plan)) {
    return (
      plan.loanDetails?.startDate ||
      plan.loanDetails?.approvalDate ||
      plan.loanDetails?.requestDate ||
      plan.loanStatusUpdatedAt ||
      plan.createdAt ||
      plan.updatedAt ||
      plan.startDate
    );
  }

  return plan.startDate || plan.createdAt || plan.updatedAt;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BusinessReportPage() {
  const dispatch = useDispatch();

  const { adminPlans, adminPlansStatus, adminPlansError, entriesByPlan } = useSelector((state) => state.savings);
  const { activeLoans, status: loansStatus, error: loansError } = useSelector((state) => state.adminLoans);

  const [selectedMonthKey, setSelectedMonthKey] = useState(() => getMonthKey(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    if (adminPlansStatus === "idle") {
      dispatch(fetchAdminSavingsPlans());
    }
  }, [adminPlansStatus, dispatch]);

  useEffect(() => {
    if (loansStatus === "idle") {
      dispatch(fetchActiveLoans());
    }
  }, [loansStatus, dispatch]);

  const fetchedPlanIdsRef = useRef(new Set());
  const fetchingIdsRef = useRef(new Set());

  useEffect(() => {
    const plans = [...(adminPlans || []), ...(activeLoans || [])];
    if (!plans.length) return;

    plans.forEach((plan) => {
      const planId = plan?._id?.toString();
      if (!planId) return;
      if (fetchedPlanIdsRef.current.has(planId) || fetchingIdsRef.current.has(planId)) return;

      const existing = entriesByPlan?.[planId];
      if (existing?.items && (existing.pagination?.limit || 0) >= 1000) {
        fetchedPlanIdsRef.current.add(planId);
        return;
      }

      fetchingIdsRef.current.add(planId);
      dispatch(
        fetchAdminPlanEntries({
          customerId: plan.customerId?._id || plan.customerId,
          planId,
          page: 1,
          limit: 1000,
        }),
      ).finally(() => {
        fetchingIdsRef.current.delete(planId);
        fetchedPlanIdsRef.current.add(planId);
      });
    });
  }, [adminPlans, activeLoans, dispatch]);

  const planMap = useMemo(() => {
    const map = new Map();
    (adminPlans || []).forEach((plan) => {
      const planId = plan?._id?.toString();
      if (planId) {
        map.set(planId, plan);
      }
    });
    (activeLoans || []).forEach((loanPlan) => {
      const planId = loanPlan?._id?.toString();
      if (!planId) return;
      const existing = map.get(planId) || {};
      map.set(planId, { ...existing, ...loanPlan });
    });
    return map;
  }, [adminPlans, activeLoans]);

  const allPlans = useMemo(() => Array.from(planMap.values()), [planMap]);

  const planCountsByDay = useMemo(() => {
    const counts = new Map();

    allPlans.forEach((plan) => {
      const referenceDate = getPlanReferenceDate(plan);
      const dateKey = getLocalDateKey(referenceDate);
      if (!dateKey) return;

      const bucket = counts.get(dateKey) || { savingsCount: 0, loanCount: 0 };
      if (isLoanPlan(plan)) {
        bucket.loanCount += 1;
      } else {
        bucket.savingsCount += 1;
      }
      counts.set(dateKey, bucket);
    });

    return counts;
  }, [allPlans]);

  const { entriesByDay, monthKeysFromEntries } = useMemo(() => {
    const dailyMap = new Map();
    const monthKeys = new Set();

    allPlans.forEach((plan) => {
      const planId = plan?._id?.toString();
      if (!planId) return;
      const entries = entriesByPlan?.[planId]?.items || [];
      const loanPlan = isLoanPlan(plan);

      entries.forEach((entry) => {
        const entryType = normalizeType(entry.type);
        const entryDate = (WITHDRAWAL_TYPES.has(entryType) && entry.metadata?.processedAt) 
          ? entry.metadata.processedAt 
          : (entry.recordedAt || entry.createdAt);
          
        const dateKey = getLocalDateKey(entryDate);
        if (!dateKey) return;
        const amount = Number(entry.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        const bucket =
          dailyMap.get(dateKey) || {
            deposits: 0,
            savingsFees: 0,
            loanFees: 0,
          };

        if (DEPOSIT_TYPES.has(entryType)) {
          bucket.deposits += amount;
        } else if (entryType.includes("fee")) {
          if (loanPlan) {
            bucket.loanFees += amount;
          } else {
            bucket.savingsFees += amount;
          }
        }

        dailyMap.set(dateKey, bucket);
        const monthKey = getMonthKey(parseDateKey(dateKey));
        if (monthKey) {
          monthKeys.add(monthKey);
        }
      });
    });

    return { entriesByDay: dailyMap, monthKeysFromEntries: monthKeys };
  }, [allPlans, entriesByPlan]);

  const planMonthKeys = useMemo(() => {
    const keys = new Set();
    allPlans.forEach((plan) => {
      const date = getPlanReferenceDate(plan);
      const monthKey = getMonthKey(date);
      if (monthKey) {
        keys.add(monthKey);
      }
    });
    return keys;
  }, [allPlans]);

  const monthOptions = useMemo(() => {
    const keys = new Set([selectedMonthKey, getMonthKey(new Date())]);
    planMonthKeys.forEach((value) => keys.add(value));
    monthKeysFromEntries.forEach((value) => keys.add(value));

    const validKeys = Array.from(keys).filter(Boolean);
    if (!validKeys.length) {
      return [{ value: getMonthKey(new Date()), label: formatMonthLabel(getMonthKey(new Date())) }];
    }

    const sorted = validKeys.sort((a, b) => b.localeCompare(a));
    return sorted.map((value) => ({ value, label: formatMonthLabel(value) }));
  }, [planMonthKeys, monthKeysFromEntries, selectedMonthKey]);

  const monthBounds = useMemo(() => {
    const monthDate = parseMonthKey(selectedMonthKey) || new Date();
    return {
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    };
  }, [selectedMonthKey]);

  const monthlyTotals = useMemo(() => {
    const totals = {
      savingsCount: 0,
      loanCount: 0,
      amountDeposited: 0,
      adminFeeSavings: 0,
      adminFeeLoan: 0,
    };

    planCountsByDay.forEach((counts, dateKey) => {
      const date = parseDateKey(dateKey);
      if (!date) return;
      if (date >= monthBounds.start && date <= monthBounds.end) {
        totals.savingsCount += counts.savingsCount;
        totals.loanCount += counts.loanCount;
      }
    });

    entriesByDay.forEach((metrics, dateKey) => {
      const date = parseDateKey(dateKey);
      if (!date) return;
      if (date >= monthBounds.start && date <= monthBounds.end) {
        totals.amountDeposited += metrics.deposits;
        totals.adminFeeSavings += metrics.savingsFees;
        totals.adminFeeLoan += metrics.loanFees;
      }
    });

    return {
      ...totals,
      adminFee: totals.adminFeeSavings + totals.adminFeeLoan,
    };
  }, [planCountsByDay, entriesByDay, monthBounds]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_value, index) => {
      const day = new Date(selectedWeekStart);
      day.setDate(selectedWeekStart.getDate() + index);
      day.setHours(0, 0, 0, 0);
      return day;
    });
  }, [selectedWeekStart]);

  const weekDayKeys = useMemo(() => weekDays.map((day) => getLocalDateKey(day)), [weekDays]);

  const weeklyMetrics = useMemo(() => {
    const savingsCounts = weekDayKeys.map((key) => (key ? planCountsByDay.get(key)?.savingsCount || 0 : 0));
    const loanCounts = weekDayKeys.map((key) => (key ? planCountsByDay.get(key)?.loanCount || 0 : 0));
    const deposits = weekDayKeys.map((key) => (key ? entriesByDay.get(key)?.deposits || 0 : 0));
    const adminFees = weekDayKeys.map((key) => {
      if (!key) return 0;
      const bucket = entriesByDay.get(key);
      if (!bucket) return 0;
      return bucket.savingsFees + bucket.loanFees;
    });

    return [
      { label: "Savings count", type: "count", values: savingsCounts },
      { label: "Loan count", type: "count", values: loanCounts },
      { label: "Amount deposited", type: "currency", values: deposits },
      { label: "Admin fee", type: "currency", values: adminFees },
    ];
  }, [weekDayKeys, planCountsByDay, entriesByDay]);

  const hasWeekData = useMemo(
    () =>
      weeklyMetrics.some((row) =>
        row.values.some((value) => {
          if (row.type === "count") {
            return Number(value) > 0;
          }
          return Number(value) > 0.01;
        }),
      ),
    [weeklyMetrics],
  );

  const isInitialLoading =
    adminPlansStatus === "idle" ||
    adminPlansStatus === "loading" ||
    loansStatus === "idle" ||
    loansStatus === "loading";

  const combinedError = adminPlansError || loansError;

  const handleMonthChange = (monthKey) => {
    if (!monthKey) return;
    setSelectedMonthKey(monthKey);
    const monthDate = parseMonthKey(monthKey) || new Date();
    setSelectedWeekStart(startOfWeek(monthDate));
  };

  const handleMonthNavigation = (offset) => {
    const current = parseMonthKey(selectedMonthKey) || new Date();
    const nextMonthDate = addMonths(current, offset);
    const nextMonthKey = getMonthKey(nextMonthDate);
    handleMonthChange(nextMonthKey);
  };

  const handleWeekNavigation = (offset) => {
    setSelectedWeekStart((prev) => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() + offset * 7);
      nextDate.setHours(0, 0, 0, 0);
      const normalized = startOfWeek(nextDate);
      const monthKey = getMonthKey(normalized);
      if (monthKey) {
        setSelectedMonthKey(monthKey);
      }
      return normalized;
    });
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    setSelectedMonthKey(getMonthKey(today));
    setSelectedWeekStart(startOfWeek(today));
  };

  const weekHeaderLabels = useMemo(
    () =>
      weekDays.map((day, index) => {
        const label = day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `${WEEKDAY_LABELS[index]} ${label.split(" ").slice(1).join(" ")}`;
      }),
    [weekDays],
  );

  const adminFeeBreakdownText = useMemo(() => {
    if (!monthlyTotals.adminFeeSavings && !monthlyTotals.adminFeeLoan) {
      return "No admin fees recorded";
    }
    return `Savings: ${formatCurrency(monthlyTotals.adminFeeSavings)} • Loan: ${formatCurrency(monthlyTotals.adminFeeLoan)}`;
  }, [monthlyTotals.adminFeeLoan, monthlyTotals.adminFeeSavings]);

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Business performance</p>
            <h1 className="text-3xl font-semibold text-slate-900">Business report</h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Track savings and loan activity at a glance. Review monthly totals and drill into daily performance for any week.
            </p>
          </div>
          <button
            type="button"
            onClick={goToCurrentWeek}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
          >
            <CalendarDays className="h-4 w-4" /> This week
          </button>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Monthly snapshot</h2>
            <p className="text-sm text-slate-500">Totals for {formatMonthLabel(selectedMonthKey)}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleMonthNavigation(-1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <select
              value={selectedMonthKey || ""}
              onChange={(event) => handleMonthChange(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {monthOptions.map((option) => (
                <option key={option.value || "current"} value={option.value || ""}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleMonthNavigation(1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {combinedError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{combinedError}</div>
        ) : isInitialLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading activity…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Savings count</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{monthlyTotals.savingsCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Savings plans opened this month</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan count</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{monthlyTotals.loanCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Loans activated this month</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount deposited</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatCurrency(monthlyTotals.amountDeposited)}</p>
              <p className="text-xs text-slate-500">Customer deposits recorded this month</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin fee</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(monthlyTotals.adminFee)}</p>
              <p className="text-xs text-slate-500">{adminFeeBreakdownText}</p>
            </article>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Weekly breakdown</h2>
            <p className="text-sm text-slate-500">Daily activity for {formatWeekRangeLabel(selectedWeekStart)}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleWeekNavigation(-1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goToCurrentWeek}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              Current
            </button>
            <button
              type="button"
              onClick={() => handleWeekNavigation(1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {combinedError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{combinedError}</div>
        ) : isInitialLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading weekly data…
          </div>
        ) : !hasWeekData ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center text-sm text-slate-500">
            No activity recorded for the selected week.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Metric</th>
                  {weekHeaderLabels.map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {weeklyMetrics.map((row) => (
                  <tr key={row.label} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="whitespace-nowrap px-4 py-3 text-right font-medium">
                        {row.type === "currency" ? formatCurrency(value) : Number(value || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
