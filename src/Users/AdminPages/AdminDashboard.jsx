import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowRight,
  Banknote,
  Building2,
  Loader2,
  PieChart,
  PiggyBank,
  Sparkles,
  Target,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  fetchDashboardOverview,
  fetchDashboardInsights,
  fetchDashboardRecent,
} from "../../redux/slices/adminDashboardSlice.jsx";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const monthLabel = (key) => {
  if (!key) return "—";
  const [year, month] = key.split("-").map((token) => Number.parseInt(token, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return "—";
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short" });
};

const computeFlowTotals = (totals = {}) => {
  const savingsDeposited = Number(totals.savingsDeposited || 0);
  const loanRepaid = Number(totals.loanRepaid || 0);
  const savingsWithdrawn = Number(totals.savingsWithdrawn || 0);
  const loanOutstanding = Number(totals.loanOutstanding || 0);
  const savingsFees = Number(totals.savingsFees || 0);
  const loanFees = Number(totals.loanFees || 0);

  const totalInflow = savingsDeposited + loanRepaid;
  const totalOutflow = savingsWithdrawn + loanOutstanding;
  const feeTotal = savingsFees + loanFees;
  const grandTotal = totalInflow + totalOutflow + feeTotal;
  const safeDenominator = grandTotal > 0 ? grandTotal : 1;

  return {
    inflow: totalInflow,
    outflow: totalOutflow,
    fees: feeTotal,
    ratioInflow: Math.round((totalInflow / safeDenominator) * 100),
    ratioOutflow: Math.round((totalOutflow / safeDenominator) * 100),
    ratioFees: Math.round((feeTotal / safeDenominator) * 100),
  };
};

const SparkBarChart = ({ data, primaryColor, secondaryColor }) => {
  if (!data?.length) {
    return null;
  }

  const maxTotal = data.reduce((max, item) => Math.max(max, (item.primary || 0) + (item.secondary || 0)), 0) || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} /> Savings
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: secondaryColor }} /> Loans
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((item) => {
          const primaryHeight = Math.round(((item.primary || 0) / maxTotal) * 100);
          const secondaryHeight = Math.round(((item.secondary || 0) / maxTotal) * 100);
          return (
            <div key={item.label} className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50/60 p-3">
              <div className="flex h-32 w-full items-end justify-between gap-1">
                <div
                  className="w-1/2 rounded-t-lg"
                  style={{ height: `${primaryHeight}%`, background: primaryColor }}
                  title={`Savings: ${item.primary.toLocaleString()}`}
                />
                <div
                  className="w-1/2 rounded-t-lg"
                  style={{ height: `${secondaryHeight}%`, background: secondaryColor }}
                  title={`Loans: ${item.secondary.toLocaleString()}`}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressMeter = ({ label, total, value, tone }) => {
  const ratio = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span>{ratio}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${tone}`}
          style={{ width: `${ratio}%`, transition: "width 500ms ease" }}
        />
      </div>
    </div>
  );
};

const SparkStackedList = ({ items }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <article key={item.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{item.subtitle}</p>
          </div>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.value)}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
            style={{ width: `${item.percent}%`, transition: "width 450ms ease" }}
          />
        </div>
      </article>
    ))}
  </div>
);

export default function AdminDashboardPage() {
  const dispatch = useDispatch();

  const dashboardState = useSelector((state) => state.adminDashboard) || {};
  const [showSensitive, setShowSensitive] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [specificDate, setSpecificDate] = useState("");
  const [specificMonth, setSpecificMonth] = useState("");

  const defaultAsyncState = useMemo(
    () => ({ data: null, status: "idle", error: null }),
    [],
  );
  const {
    overview = defaultAsyncState,
    insights = defaultAsyncState,
    recent = defaultAsyncState,
  } = dashboardState;

  const filters = useMemo(() => ({ dateRange, specificDate, specificMonth }), [dateRange, specificDate, specificMonth]);

  useEffect(() => {
    // Only fetch if we are "idle" OR if the filters change
    dispatch(fetchDashboardOverview(filters));
    dispatch(fetchDashboardInsights(filters));
    dispatch(fetchDashboardRecent(filters));
  }, [dispatch, filters]);

  const emptyTotals = useMemo(
    () => ({
      savingsDeposited: 0,
      savingsWithdrawn: 0,
      savingsFees: 0,
      availableBalance: 0,
      loanOutstanding: 0,
      overdueLoanOutstanding: 0,
      onTargetLoanOutstanding: 0,
      loanDisbursed: 0,
      loanRepaid: 0,
      loanFees: 0,
      loanFees: 0,
      savingsCount: 0,
      loanCount: 0,
      totalDeposit: 0,
      totalMaintenance: 0,
    }),
    [],
  );


  const overviewData = overview.data || {};
  const totals = overviewData.totals || emptyTotals;
  const counts = overviewData.counts || {};
  const flowTotals = overviewData.flowTotals || computeFlowTotals(totals);

  const monthlyTrend = insights.data?.monthlyTrend || [];
  const topCsos = insights.data?.topCsos || [];
  const recentPlans = recent.data?.recentPlans || [];

  const saverCount = counts.savers ?? totals.savingsCount ?? 0;
  const csoCount = counts.csos ?? 0;
  const customerCount = counts.customers ?? saverCount;
  const activeBranchCount = counts.branches ?? 0;
  const totalBranchCapacity = Math.max(counts.totalBranches ?? counts.branches ?? activeBranchCount ?? 0, 1);

  const isLoading =
    overview.status === "idle" ||
    overview.status === "loading" ||
    insights.status === "idle" ||
    insights.status === "loading" ||
    recent.status === "idle" ||
    recent.status === "loading";

  const combinedError = overview.error || insights.error || recent.error;

  const chartData = useMemo(() => {
    return (monthlyTrend || []).map((month) => ({
      label: monthLabel(month.monthKey),
      primary: month.savings || 0,
      secondary: month.loans || 0,
    }));
  }, [monthlyTrend]);

  return (
    <div className="space-y-8 p-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                <Sparkles className="h-4 w-4" /> Executive overview
              </span>
              
              <div className="flex items-center gap-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white outline-none transition focus:bg-white/20"
                >
                  <option value="all" className="text-slate-900">All Time</option>
                  <option value="today" className="text-slate-900">Today</option>
                  <option value="yesterday" className="text-slate-900">Yesterday</option>
                  <option value="thisWeek" className="text-slate-900">This Week</option>
                  <option value="thisMonth" className="text-slate-900">This Month</option>
                  <option value="specificDate" className="text-slate-900">Specific Date</option>
                  <option value="specificMonth" className="text-slate-900">Specific Month</option>
                </select>
                {dateRange === "specificDate" && (
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white outline-none transition focus:bg-white/20 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                )}
                {dateRange === "specificMonth" && (
                  <input
                    type="month"
                    value={specificMonth}
                    onChange={(e) => setSpecificMonth(e.target.value)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white outline-none transition focus:bg-white/20 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                )}

                <button
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  title={showSensitive ? "Hide sensitive values" : "Show sensitive values"}
                >
                  {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showSensitive ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Welcome back!</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Monitor savings momentum, loan exposure, network coverage, and operational health in real time. 
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold">
                <Activity className="h-4 w-4 text-emerald-300" /> {monthlyTrend.length} month trendline
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold">
                <Target className="h-4 w-4 text-sky-300" /> 
                <span className={!showSensitive ? "blur-sm" : ""}>{formatCurrency(totals.availableBalance)}</span> liquidity
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 text-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Today&apos;s focus</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200">Net inflow YTD</span>
                <span className={`font-semibold text-white ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.savingsDeposited - totals.savingsWithdrawn)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200">Loan portfolio</span>
                <span className={`font-semibold text-white ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanOutstanding)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200">Collections captured</span>
                <span className={`font-semibold text-emerald-200 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.savingsDeposited + totals.loanRepaid)}</span>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/30"
            >
              Explore detailed analytics <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {combinedError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{combinedError}</div>
      )}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Preparing your dashboard…
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposits</p>
                  <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.totalDeposit)}</p>
                </div>
                <PiggyBank className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-3 text-xs text-slate-500">Net cumulative savings & repayments</p>
              <ProgressMeter label="Available liquidity" total={totals.totalDeposit} value={totals.availableBalance} tone="bg-emerald-500" />
            </article>


            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan exposure</p>
                    <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanOutstanding)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-amber-500" />
                </div>
                <p className="mt-3 text-xs text-slate-500">{totals.loanCount.toLocaleString()} active loans across the network</p>
              </div>
              
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">On target</span>
                  <span className={`font-semibold text-slate-700 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.onTargetLoanOutstanding)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-500 font-medium">Overdue (&gt;32 days)</span>
                  <span className={`font-semibold text-rose-600 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.overdueLoanOutstanding)}</span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer network</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{customerCount.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-sky-500" />
              </div>
              <p className="mt-3 text-xs text-slate-500">{csoCount.toLocaleString()} CSOs across {activeBranchCount.toLocaleString()} branches</p>
              <ProgressMeter label="Coverage" total={totalBranchCapacity} value={activeBranchCount} tone="bg-sky-500" />
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total maintenance</p>
                  <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.totalMaintenance)}</p>
                </div>
                <PieChart className="h-8 w-8 text-rose-500" />
              </div>
              <p className="mt-3 text-xs text-slate-500">Combined network maintenance revenue</p>
              <ProgressMeter label="Loan fee share" total={totals.totalMaintenance || 1} value={totals.loanFees} tone="bg-rose-500" />
            </article>

          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Savings Section</h2>
                  <p className="text-sm text-slate-500">Core metrics for customer savings.</p>
                </div>
                <PiggyBank className="h-7 w-7 text-primary" />
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Amount Saved</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.savingsDeposited)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Maintenance on Saving</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.savingsFees)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Withdrawal</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.savingsWithdrawn)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available Balance</dt>
                  <dd className={`mt-2 text-lg font-semibold text-emerald-700 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.availableBalance)}</dd>
                </div>
              </dl>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Loan Section</h2>
                  <p className="text-sm text-slate-500">Performance tracking for the loan portfolio.</p>
                </div>
                <Banknote className="h-7 w-7 text-amber-500" />
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Loan</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanDisbursed)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Paid Back</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanRepaid)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan Maintenance Fee</dt>
                  <dd className={`mt-2 text-lg font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanFees)}</dd>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan Balance</dt>
                  <dd className={`mt-2 text-lg font-semibold text-amber-700 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(totals.loanOutstanding)}</dd>
                </div>
              </dl>
            </article>
          </section>


          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Momentum the last six months</h2>
                  <p className="text-sm text-slate-500">Tracking new savings plans and loan activations.</p>
                </div>
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6">
                {chartData.length ? (
                  <SparkBarChart data={chartData} primaryColor="#0f766e" secondaryColor="#facc15" />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center text-sm text-slate-500">
                    No momentum data available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Cash flow composition</h2>
                  <p className="text-sm text-slate-500">Inflow vs withdrawals vs fees.</p>
                </div>
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Inflow captured</span>
                    <span className={!showSensitive ? "blur-sm" : ""}>{formatCurrency(flowTotals.inflow)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${flowTotals.ratioInflow}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Payout obligations</span>
                    <span className={!showSensitive ? "blur-sm" : ""}>{formatCurrency(flowTotals.outflow)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${flowTotals.ratioOutflow}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Fees retained</span>
                    <span className={!showSensitive ? "blur-sm" : ""}>{formatCurrency(flowTotals.fees)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${flowTotals.ratioFees}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Top CSO collections</h2>
                  <p className="text-sm text-slate-500">Performance driven by total deposits captured.</p>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6">
                {topCsos.length ? (
                  <SparkStackedList items={topCsos} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center text-sm text-slate-500">
                    No CSO data available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Recent plans</h2>
                  <p className="text-sm text-slate-500">Newly activated customer plans.</p>
                </div>
                <PiggyBank className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="mt-6 space-y-4">
                {recentPlans.length ? (
                  recentPlans.map((plan) => (
                    <article key={plan.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">{plan.customer}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            plan.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : plan.status === "completed"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{plan.createdAt}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(plan.deposits - plan.withdrawals)} net
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center text-sm text-slate-500">
                    No recent plans yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
