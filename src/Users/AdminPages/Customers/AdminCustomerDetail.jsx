import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCustomerById, clearCustomerState } from "../../../redux/slices/customersSlice";
import { Loader2, ArrowLeft, Mail, MapPin, Phone, UserCircle, Shield, Wallet2, PiggyBank } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const dateObject = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObject.getTime())) return "—";
  return dateObject.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const pickFirstNumber = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return 0;
};

const deriveLoanInfo = (plan = {}) => {
  const loanDetails = plan.loanDetails || {};
  const planType = (plan.planType || "").toString().toLowerCase();
  const loanStatus = (plan.loanStatus || "").toString().toLowerCase();
  const status = (plan.status || plan.state || loanDetails.status || "").toString().toLowerCase();
  const hasLoanDetails =
    loanDetails &&
    Object.entries(loanDetails).some(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    });

  const statusImpliesLoan = ["pending", "approved", "active", "completed"].includes(loanStatus);

  const isLoanPlan = Boolean(plan.isLoan) || planType === "loan" || hasLoanDetails || statusImpliesLoan;

  if (!isLoanPlan) {
    return {
      isLoanPlan: false,
      status,
      loanAmount: 0,
      loanPaid: 0,
      loanBalance: 0,
      hasActiveLoan: false,
    };
  }

  const loanAmount = pickFirstNumber(
    loanDetails.amount,
    loanDetails.requestedAmount,
    plan.loanAmount,
  );

  const loanPaid = pickFirstNumber(
    loanDetails.totalPaid,
    loanDetails.paid,
    loanDetails.loanPaid,
    loanDetails.amountPaid,
    loanDetails.loanPaidRaw,
    plan.availableBalance,
  );

  let loanBalance = pickFirstNumber(
    loanDetails.balance,
    loanDetails.outstanding,
    loanAmount - loanPaid,
  );

  if (!Number.isFinite(loanBalance)) {
    loanBalance = loanAmount - loanPaid;
  }

  if (!Number.isFinite(loanBalance) || loanBalance < 0) {
    loanBalance = 0;
  }

  return {
    isLoanPlan,
    status,
    loanAmount: loanAmount > 0 ? loanAmount : 0,
    loanPaid: loanPaid > 0 ? loanPaid : 0,
    loanBalance,
    hasActiveLoan: ["active", "approved", "pending"].includes(status),
  };
};

export default function AdminCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedCustomer, mutationStatus, mutationError, savingsPlansByCustomer } = useSelector(
    (state) => state.customers,
  );

  useEffect(() => {
    if (customerId) {
      dispatch(fetchCustomerById({ customerId, admin: true }));
    }
    return () => {
      dispatch(clearCustomerState());
    };
  }, [customerId, dispatch]);

  const plans = savingsPlansByCustomer?.[customerId] || [];
  const savingsSummary = selectedCustomer?.savingsSummary || {};

  const totals = useMemo(() => {
    return plans.reduce(
      (acc, plan) => {
        const loanInfo = deriveLoanInfo(plan);
        const contribution = Number(plan.dailyContribution || 0);
        const totalDeposited = Number(plan.totalDeposited || plan.totalPaid || 0);
        const balance = Number(plan.availableBalance || plan.balance || 0);
        const totalWithdrawn = Number(plan.totalWithdrawn || 0);
        const maintenance = Number(plan.totalFees || plan.maintenanceFee || 0);

        if (loanInfo.isLoanPlan) {
          acc.loanPlans += 1;
          acc.loanDisbursed += loanInfo.loanAmount;
          acc.loanPaid += loanInfo.loanPaid;
          acc.loanBalance += loanInfo.loanBalance;

          if (loanInfo.hasActiveLoan) {
            acc.activeLoanPlans += 1;
            acc.activeLoanPaid += loanInfo.loanPaid;
            acc.activeLoanBalance += loanInfo.loanBalance;
          }
        } else {
          acc.savingsPlans += 1;
          acc.savingsTotal += totalDeposited;
          acc.savingsBalance += balance;
          acc.averageContribution += contribution;
          acc.savingsFees += maintenance;
          acc.savingsWithdrawn += totalWithdrawn;
        }

        acc.totalDeposited += totalDeposited;
        acc.totalBalance += balance;
        acc.totalFees += maintenance;
        acc.totalWithdrawn += totalWithdrawn;

        return acc;
      },
      {
        savingsPlans: 0,
        savingsTotal: 0,
        savingsBalance: 0,
        averageContribution: 0,
        loanPlans: 0,
        loanDisbursed: 0,
        loanPaid: 0,
        loanBalance: 0,
        activeLoanPlans: 0,
        activeLoanPaid: 0,
        activeLoanBalance: 0,
        savingsFees: 0,
        savingsWithdrawn: 0,
        totalDeposited: 0,
        totalBalance: 0,
        totalFees: 0,
        totalWithdrawn: 0,
      },
    );
  }, [plans]);

  const hasLocalPlans = plans.length > 0;

  const savingsMetrics = useMemo(() => {
    if (hasLocalPlans) {
      return {
        activePlans: totals.savingsPlans,
        balance: totals.savingsBalance,
        deposited: totals.savingsTotal,
        fees: totals.savingsFees,
      };
    }

    return {
      activePlans: pickFirstNumber(savingsSummary?.activePlans),
      balance: pickFirstNumber(savingsSummary?.availableBalance),
      deposited: pickFirstNumber(savingsSummary?.totalDeposited),
      fees: pickFirstNumber(savingsSummary?.totalFees),
    };
  }, [hasLocalPlans, totals, savingsSummary]);

  const isLoading = mutationStatus === "loading" && !selectedCustomer;

  return (
    <div className="space-y-6 p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </button>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading customer details…
        </div>
      ) : mutationError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{mutationError}</div>
      ) : !selectedCustomer ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Customer not found.
        </div>
      ) : (
        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 p-6 text-white shadow-xl md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold">
                {(selectedCustomer.firstName || "?").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  <UserCircle className="h-4 w-4" /> Customer profile
                </p>
                <h1 className="text-3xl font-semibold">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h1>
                <p className="text-sm text-white/80">Added {formatDate(selectedCustomer.createdAt)}</p>
              </div>
            </div>
            {/* <div className="grid gap-2 text-right text-xs uppercase tracking-wide text-white/70">
              <span>Customer ID</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                {selectedCustomer._id}
              </span>
            </div> */}
          </header>

          <section className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Savings overview</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active savings plans</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {savingsMetrics.activePlans.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Currently running savings plans</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Savings balance</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {formatCurrency(savingsMetrics.balance)}
                  </p>
                  <p className="text-xs text-slate-500">Available for withdrawal</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {formatCurrency(savingsMetrics.deposited)}
                  </p>
                  <p className="text-xs text-slate-500">Lifetime deposits across plans</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fees</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {formatCurrency(savingsMetrics.fees)}
                  </p>
                  <p className="text-xs text-slate-500">Maintenance charges across plans</p>
                </article>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan overview</h2>
              {totals.loanPlans ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total loan plans</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {(savingsSummary.loanPlans ?? totals.loanPlans).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Loans launched for this customer</p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Principal disbursed</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {formatCurrency(totals.loanDisbursed)}
                      </p>
                      <p className="text-xs text-slate-500">Total amount released as loans</p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount repaid</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {formatCurrency(totals.loanPaid)}
                      </p>
                      <p className="text-xs text-slate-500">Repayments captured so far</p>
                    </article>
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding balance</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {formatCurrency(totals.loanBalance)}
                      </p>
                      <p className="text-xs text-slate-500">Remaining across all active loans</p>
                    </article>
                  </div>
                  {totals.activeLoanPlans > 0 ? (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active loan breakdown</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {totals.activeLoanPlans.toLocaleString()} active loan{totals.activeLoanPlans > 1 ? "s" : ""}
                      </p>
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <p className="font-semibold text-slate-900">
                          Paid so far: {formatCurrency(totals.activeLoanPaid)}
                        </p>
                        <p className="font-semibold text-slate-900">
                          Outstanding balance: {formatCurrency(totals.activeLoanBalance)}
                        </p>
                      </div>
                    </article>
                  ) : null}
                </>
              ) : (
                <article className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  No loan plans recorded for this customer.
                </article>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact information</h2>
              <dl className="grid gap-4">
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Phone className="h-4 w-4" /> Phone number
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{selectedCustomer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Mail className="h-4 w-4" /> Email address
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{selectedCustomer.email || "—"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <MapPin className="h-4 w-4" /> Residential address
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{selectedCustomer.address || "—"}</dd>
                </div>
              </dl>
            </article>

            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Relationship</h2>
              <dl className="grid gap-4">
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Shield className="h-4 w-4" /> Assigned CSO
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {(() => {
                      const cso = selectedCustomer.csoId || selectedCustomer.assignedCso;
                      if (!cso) return "Unassigned";
                      if (typeof cso === "string") return cso;
                      return [cso.firstName, cso.lastName].filter(Boolean).join(" ") || cso.email || "Unassigned";
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Wallet2 className="h-4 w-4" /> Savings plans launched
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {(savingsSummary.totalPlans ?? totals.savingsPlans + totals.loanPlans).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <PiggyBank className="h-4 w-4" /> Loan exposure
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {totals.loanPlans ? `${totals.loanPlans} plan${totals.loanPlans > 1 ? "s" : ""}` : "No active loans"}
                  </dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Latest plans</h2>
                <p className="text-sm text-slate-500">Snapshot of up to five recent savings or loan plans.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/customers/${customerId}/plans`)}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/10"
              >
                View all plans
              </button>
            </header>

            {!plans.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                No plans recorded for this customer yet.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Plan</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Deposited</th>
                      <th className="px-4 py-3 text-right font-semibold">Balance</th>
                      <th className="px-4 py-3 text-left font-semibold">Started</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plans.slice(0, 5).map((plan) => {
                      const loanInfo = deriveLoanInfo(plan);
                      const statusLabel = loanInfo.status
                        ? loanInfo.status.charAt(0).toUpperCase() + loanInfo.status.slice(1)
                        : (plan.status || plan.state || "Active");
                      return (
                        <tr key={plan._id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-900">{plan.planName || plan.planType || "Savings plan"}</td>
                          <td className="px-4 py-3 text-slate-600">{loanInfo.isLoanPlan ? "Loan" : "Savings"}</td>
                          <td className="px-4 py-3 text-slate-600">{statusLabel}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(plan.totalDeposited || plan.totalPaid || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(plan.availableBalance || plan.balance || 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(plan.startDate || plan.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
