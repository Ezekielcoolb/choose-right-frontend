import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowRight,
  Building2,
  Loader2,
  PieChart,
  PiggyBank,
  Sparkles,
  Users,
} from "lucide-react";
import {
  fetchManagerDashboardOverview,
  fetchManagerDashboardInsights,
  fetchManagerDashboardRecent,
  fetchManagerCustomers,
  fetchManagerSavings,
  fetchManagerLoans,
} from "../../redux/slices/managerDataSlice.jsx";

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

export default function ManagerDashboard() {
  const dispatch = useDispatch();
  const {
    dashboard: { overview, insights, recent },
    customers: customersState,
    savings: savingsState,
    loans: loansState,
  } = useSelector((state) => state.managerData);

  useEffect(() => {
    if (overview.status === "idle") {
      dispatch(fetchManagerDashboardOverview());
    }
    if (insights.status === "idle") {
      dispatch(fetchManagerDashboardInsights());
    }
    if (recent.status === "idle") {
      dispatch(fetchManagerDashboardRecent());
    }
    if (customersState.status === "idle") {
      dispatch(fetchManagerCustomers());
    }
    if (savingsState.status === "idle") {
      dispatch(fetchManagerSavings());
    }
    if (loansState.status === "idle") {
      dispatch(fetchManagerLoans());
    }
  }, [dispatch, overview.status, insights.status, recent.status, customersState.status, savingsState.status, loansState.status]);

  const isLoading =
    overview.status === "idle" ||
    overview.status === "loading" ||
    insights.status === "idle" ||
    insights.status === "loading" ||
    recent.status === "idle" ||
    recent.status === "loading" ||
    customersState.status === "idle" ||
    customersState.status === "loading";

  const emptyTotals = {
    savingsDeposited: 0,
    savingsWithdrawn: 0,
    savingsFees: 0,
    availableBalance: 0,
    loanOutstanding: 0,
    loanDisbursed: 0,
    loanRepaid: 0,
    loanFees: 0,
    savingsCount: 0,
    loanCount: 0,
    totalDeposit: 0,
    totalMaintenance: 0,
  };

  const overviewData = overview.data || {};
  const totals = overviewData.totals || emptyTotals;
  const counts = overviewData.counts || {};

  const monthlyTrend = insights.data?.monthlyTrend || [];
  const topCsos = insights.data?.topCsos || [];
  const recentPlans = recent.data?.recentPlans || [];

  // Calculate totals from granular data
  const savingsItems = savingsState.data || [];
  const loanItems = loansState.data || [];

  const savingsStats = useMemo(() => {
    return savingsItems.reduce(
      (acc, plan) => {
        // Filter out any loans that might have slipped into savings endpoint
        const isLoan = plan.isLoan === true || plan.planType === "loan" || ["approved", "active"].includes((plan.loanDetails?.status || "").toLowerCase());
        if (isLoan) return acc;

        acc.totalDeposited += Number(plan.totalDeposited || 0);
        acc.totalFees += Number(plan.totalFees || 0);
        acc.totalWithdrawn += Number(plan.totalWithdrawn || 0);
        acc.availableBalance += Number(plan.availableBalance || 0);
        return acc;
      },
      { totalDeposited: 0, totalFees: 0, totalWithdrawn: 0, availableBalance: 0 }
    );
  }, [savingsItems]);

  const loanStats = useMemo(() => {
    return loanItems.reduce(
        (acc, plan) => {
             // Logic from ManagerLoans to normalize stats
             const loanDetails = plan?.loanDetails || {};
             const baseAmount = Number(loanDetails.amount ?? loanDetails.requestedAmount ?? plan?.loanAmount ?? (plan?.dailyContribution ? plan.dailyContribution * 30 : 0));
             
             const savingsMaintenanceCandidate = Number(plan.maintenanceFee || 0);
             const recordedMaintenance = Number(plan.totalFees || 0);
             const loanMaintenanceCandidate = Number(loanDetails.maintenanceFee ?? (loanDetails.maintenanceFeePaid ? plan.dailyContribution ?? plan.maintenanceFee ?? 0 : 0));
             const maintenanceFee = Math.max(recordedMaintenance, savingsMaintenanceCandidate + loanMaintenanceCandidate);

             const loanRepaymentTotal = Number(
                loanDetails.totalPaid ?? loanDetails.paid ?? loanDetails.loanPaid ?? loanDetails.amountPaid ?? loanDetails.loanPaidRaw ?? loanDetails.repaymentCollected ?? 0
             );

             const combinedDeposits = Number(plan.totalDeposited || 0) + loanRepaymentTotal;
             const totalPaid = Math.max(0, combinedDeposits - maintenanceFee);
             
             const balance = Number(loanDetails.balance ?? loanDetails.outstanding ?? loanDetails.loanBalance ?? baseAmount - totalPaid);
             const safeBalance = balance < 0 ? 0 : balance;

             acc.totalAmount += baseAmount;
             acc.totalDeposited += Number(plan.totalDeposited || 0); 
             acc.totalPaid += totalPaid;
             acc.totalCollected += combinedDeposits; // Gross amount collected (Principal + Maintenance)
             acc.totalMaintenance += maintenanceFee;
             acc.totalOutstanding += safeBalance;
             acc.count += 1;
             return acc;
        },
        { totalAmount: 0, totalDeposited: 0, totalPaid: 0, totalCollected: 0, totalMaintenance: 0, totalOutstanding: 0, count: 0 }
    );
  }, [loanItems]);

  // Use calculated stats for display
  const totalDeposited = savingsStats.totalDeposited;
  const totalSavingsMaintenance = savingsStats.totalFees;
  const totalSavingsWithdrawn = savingsStats.totalWithdrawn;
  const totalSavingsBalance = savingsStats.availableBalance;

  const totalLoanOutstanding = loanStats.totalOutstanding;
  const totalLoanDisbursed = loanStats.totalAmount; // Approximation of disbursed if all active
  const totalLoanRepaid = loanStats.totalPaid;
  const totalLoanCollected = loanStats.totalCollected;
  const totalLoanFees = loanStats.totalMaintenance;
  const activeLoanCount = loanStats.count;

  // Recalculate flow totals based on new stats
  const flowTotals = computeFlowTotals({
      savingsDeposited: totalDeposited,
      loanRepaid: totalLoanRepaid,
      savingsWithdrawn: totalSavingsWithdrawn,
      loanOutstanding: totalLoanOutstanding,
      savingsFees: totalSavingsMaintenance,
      loanFees: totalLoanFees
  });

  const saverCount = counts.savers ?? totals.savingsCount ?? 0;
  const csoCount = counts.csos ?? 0;
  const customerCount = counts.customers ?? saverCount;
  
  const activeBranchCount = counts.branches ?? 1;

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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
              <Sparkles className="h-4 w-4" /> Manager overview
            </span>
            <h1 className="text-4xl font-semibold leading-tight">Welcome back!</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Monitor savings momentum, loan exposure, and customer coverage to support your CSOs effectively.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold">
                <Activity className="h-4 w-4 text-emerald-300" /> {monthlyTrend.length} month trendline
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 text-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Today&apos;s focus</p>
            <div className="mt-4 space-y-3">
              {/* <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200">Collections captured</span>
                <span className="font-semibold text-emerald-200">{formatCurrency(totalDeposited + totalLoanCollected)}</span>
              </div> */}
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

            <div className="grid gap-6 lg:grid-cols-1">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer network</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{customerCount.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-sky-500" />
                </div>
                <p className="mt-3 text-xs text-slate-500">{csoCount.toLocaleString()} CSOs managed</p>
                <ProgressMeter label="Active CSOs" total={csoCount || 1} value={csoCount} tone="bg-sky-500" />
              </article>
{/* 
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fee portfolio</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalSavingsMaintenance + totalLoanFees)}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-rose-500" />
                </div>
                <p className="mt-3 text-xs text-slate-500">Combined maintenance revenue</p>
                <ProgressMeter label="Loan fee share" total={(totalSavingsMaintenance + totalLoanFees) || 1} value={totalLoanFees} tone="bg-rose-500" />
              </article> */}
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
                  recentPlans.map((plan) => {
                    // Force differentiation of loan vs savings based on status or type
                    const status = plan.status ? plan.status.toLowerCase() : 'active';
                    const isLoan = plan.type === 'loan' || ['pending', 'rejected', 'approved', 'disbursed', 'overpaid'].includes(status);
                    
                    let statusColor = "bg-slate-200 text-slate-600";
                    if (status === "active") statusColor = "bg-emerald-100 text-emerald-700";
                    else if (status === "completed" || status === "disbursed" || status === "closed") statusColor = "bg-sky-100 text-sky-700";
                    else if (status === "pending") statusColor = "bg-amber-100 text-amber-700";
                    else if (status === "rejected") statusColor = "bg-rose-100 text-rose-700";

                    return (
                      <article key={plan.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                            <p className="text-xs text-slate-500">{plan.customer}</p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}
                          >
                            {plan.status || 'Active'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{plan.createdAt}</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(plan.deposits || plan.amount || 0)} {isLoan ? 'loan' : 'net'}
                          </span>
                        </div>
                      </article>
                    );
                  })
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
