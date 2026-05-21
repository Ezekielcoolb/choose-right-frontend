import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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
  const month = Number.parseInt(monthToken, 10) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  const date = new Date(year, month, 1);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const formatMonthLabel = (key) => {
  const date = parseMonthKey(key);
  if (!date) return "—";
  return MONTH_LABEL_FORMATTER.format(date);
};

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

const DEPOSIT_TYPES = new Set(["deposit", "loan_repayment", "loanrepayment", "repayment", "loan-payment"]);
const WITHDRAWAL_TYPES = new Set(["withdrawal", "payout", "loan_withdrawal"]);

const RANGE_OPTIONS = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Full year" },
];

const buildYearMonthKeys = (year) => {
  const months = [];
  for (let index = 0; index < 12; index += 1) {
    const month = String(index + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
};

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonthIndex = () => new Date().getMonth();

export default function MonthlyReportPage() {
  const dispatch = useDispatch();

  const { adminPlans, adminPlansStatus, adminPlansError, entriesByPlan } = useSelector((state) => state.savings);
  const { activeLoans, status: loansStatus, error: loansError } = useSelector((state) => state.adminLoans);

  const currentYear = getCurrentYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [range, setRange] = useState(3);

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
    (activeLoans || []).forEach((plan) => {
      const planId = plan?._id?.toString();
      if (!planId) return;
      const existing = map.get(planId) || {};
      map.set(planId, { ...existing, ...plan });
    });
    return map;
  }, [adminPlans, activeLoans]);

  const allPlans = useMemo(() => Array.from(planMap.values()), [planMap]);

  const planCountsByMonth = useMemo(() => {
    const counts = new Map();
    allPlans.forEach((plan) => {
      const monthKey = getMonthKey(getPlanReferenceDate(plan));
      if (!monthKey) return;
      const bucket = counts.get(monthKey) || { savingsCount: 0, loanCount: 0 };
      if (isLoanPlan(plan)) {
        bucket.loanCount += 1;
      } else {
        bucket.savingsCount += 1;
      }
      counts.set(monthKey, bucket);
    });
    return counts;
  }, [allPlans]);

  const entriesByMonth = useMemo(() => {
    const monthMap = new Map();

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

        const monthKey = getMonthKey(entryDate);
        if (!monthKey) return;

        const amount = Number(entry.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        const bucket =
          monthMap.get(monthKey) || {
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

        monthMap.set(monthKey, bucket);
      });
    });

    return monthMap;
  }, [allPlans, entriesByPlan]);

  const monthKeysWithData = useMemo(() => {
    const keys = new Set();
    planCountsByMonth.forEach((_value, monthKey) => {
      keys.add(monthKey);
    });
    entriesByMonth.forEach((_value, monthKey) => {
      keys.add(monthKey);
    });
    return keys;
  }, [planCountsByMonth, entriesByMonth]);

  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    monthKeysWithData.forEach((monthKey) => {
      const date = parseMonthKey(monthKey);
      if (date) {
        years.add(date.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [monthKeysWithData, currentYear]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  const monthsForSelectedYear = useMemo(() => buildYearMonthKeys(selectedYear), [selectedYear]);

  const latestMonthIndexWithData = useMemo(() => {
    let latestIndex = -1;
    monthsForSelectedYear.forEach((monthKey, index) => {
      if (planCountsByMonth.has(monthKey) || entriesByMonth.has(monthKey)) {
        latestIndex = index;
      }
    });

    if (latestIndex >= 0) {
      return latestIndex;
    }

    if (selectedYear === currentYear) {
      return getCurrentMonthIndex();
    }

    return 11; // December
  }, [monthsForSelectedYear, planCountsByMonth, entriesByMonth, selectedYear, currentYear]);

  const displayMonthKeys = useMemo(() => {
    if (range === 12) {
      return monthsForSelectedYear;
    }

    const lastIndex = Math.min(Math.max(latestMonthIndexWithData, 0), 11);
    if (Number.isNaN(lastIndex)) {
      return monthsForSelectedYear.slice(-range);
    }

    const startIndex = Math.max(0, lastIndex - range + 1);
    return monthsForSelectedYear.slice(startIndex, lastIndex + 1);
  }, [monthsForSelectedYear, latestMonthIndexWithData, range]);

  const rows = useMemo(() => {
    return displayMonthKeys.map((monthKey) => {
      const counts = planCountsByMonth.get(monthKey) || { savingsCount: 0, loanCount: 0 };
      const metrics = entriesByMonth.get(monthKey) || {
        deposits: 0,
        withdrawals: 0,
        savingsFees: 0,
        loanFees: 0,
      };

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        savingsCount: counts.savingsCount,
        loanCount: counts.loanCount,
        deposited: metrics.deposits,
        adminFeeSavings: metrics.savingsFees,
        adminFeeLoan: metrics.loanFees,
        adminFeeTotal: metrics.savingsFees + metrics.loanFees,
      };
    });
  }, [displayMonthKeys, planCountsByMonth, entriesByMonth]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.savingsCount += row.savingsCount;
        acc.loanCount += row.loanCount;
        acc.deposited += row.deposited;
        acc.adminFeeSavings += row.adminFeeSavings;
        acc.adminFeeLoan += row.adminFeeLoan;
        acc.adminFeeTotal += row.adminFeeTotal;
        return acc;
      },
      {
        savingsCount: 0,
        loanCount: 0,
        deposited: 0,
        adminFeeSavings: 0,
        adminFeeLoan: 0,
        adminFeeTotal: 0,
      },
    );
  }, [rows]);

  const combinedError = adminPlansError || loansError;
  const isLoading =
    adminPlansStatus === "idle" ||
    adminPlansStatus === "loading" ||
    loansStatus === "idle" ||
    loansStatus === "loading";

  const handleSelectYear = (event) => {
    const nextYear = Number.parseInt(event.target.value, 10);
    if (Number.isFinite(nextYear)) {
      setSelectedYear(nextYear);
    }
  };

  const handleRangeChange = (value) => {
    setRange(value);
  };

  const handleYearNavigation = (offset) => {
    setSelectedYear((prev) => prev + offset);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Business performance</p>
            <h1 className="text-3xl font-semibold text-slate-900">Monthly report</h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Compare savings and loan activity across months. Start with the latest quarter, then expand the range to six months or a full year.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => handleYearNavigation(-1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <select
              value={selectedYear}
              onChange={handleSelectYear}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {availableYears.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleYearNavigation(1)}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Monthly performance table</h2>
            <p className="text-sm text-slate-500">
              Viewing {range === 12 ? "all months" : `last ${range} month${range === 1 ? "" : "s"}` } for {selectedYear}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRangeChange(option.value)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  range === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {combinedError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{combinedError}</div>
        ) : isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading monthly metrics…
          </div>
        ) : !rows.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center text-sm text-slate-500">
            No activity recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Month</th>
                  <th className="px-4 py-3 text-right font-semibold">Savings count</th>
                  <th className="px-4 py-3 text-right font-semibold">Loan count</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount deposited</th>
                  <th className="px-4 py-3 text-right font-semibold">Admin fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.monthKey} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {row.savingsCount.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                      {row.loanCount.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(row.deposited)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(row.adminFeeTotal)}
                      <div className="text-[11px] text-slate-400">
                        Savings {formatCurrency(row.adminFeeSavings)} • Loan {formatCurrency(row.adminFeeLoan)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Total ({rows.length} month{rows.length === 1 ? "" : "s"})</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">{totals.savingsCount.toLocaleString()}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">{totals.loanCount.toLocaleString()}</th>
                  <th className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(totals.deposited)}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(totals.adminFeeTotal)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
