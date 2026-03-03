// Nudge for Vite reload
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Mail,
  Phone,
  PieChart,
  PiggyBank,
  TrendingUp,
  User,
  Loader2,
} from "lucide-react";
import { fetchManagerCustomerDetail } from "../../redux/slices/managerDataSlice.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toTitleCase = (value) => {
  if (!value) return "—";
  const text = value.toString();
  if (!text.length) return "—";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function ManagerCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedCustomer, customerPlans } = useSelector((state) => state.managerData);

  useEffect(() => {
    if (id) {
      dispatch(fetchManagerCustomerDetail(id));
    }
  }, [dispatch, id]);

  const customer = selectedCustomer.data;
  const status = selectedCustomer.status;
  const error = selectedCustomer.error;

  const decoratedPlans = useMemo(() => {
    return customerPlans.map((plan) => {
      const isLoanPlan = Boolean(plan.loanDetails || plan.planType === "loan");
      const statusText = (plan.status || plan.state || plan.loanDetails?.status || "active").toLowerCase();
      const deposits = Number(plan.totalDeposited || plan.totalPaid || 0);
      const balance = Number(plan.availableBalance || plan.balance || 0);
      const loanBalance = Number(plan.loanDetails?.balance || plan.loanDetails?.outstanding || 0);

      return {
        ...plan,
        isLoanPlan,
        statusText,
        deposits,
        balance,
        loanBalance,
      };
    });
  }, [customerPlans]);

  const loanMetrics = useMemo(() => {
    const loans = decoratedPlans.filter((p) => p.isLoanPlan);
    return {
      totalBorrowed: loans.reduce((acc, p) => acc + (p.loanDetails?.amount || 0), 0),
      totalOutstanding: loans.reduce((acc, p) => acc + p.loanBalance, 0),
      count: loans.length,
    };
  }, [decoratedPlans]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-600">Failed to load customer details</p>
          <p className="mt-1 text-xs text-rose-500">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate("/manager/customers")}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </button>
          <h1 className="text-3xl font-semibold text-slate-900">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Customer ID: {customer._id}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Joined {formatDate(customer.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              customer.status === "active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {customer.status || "Active"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact info card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Contact information</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Phone number</p>
                <p className="text-sm font-semibold text-slate-900">{customer.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Email address</p>
                <p className="max-w-[180px] overflow-hidden text-ellipsis text-sm font-semibold text-slate-900">
                  {customer.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Assigned CSO</p>
                <p className="text-sm font-semibold text-slate-900">{customer.csoName || "Assigned CSO"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Financial overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <PiggyBank className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600">Total Savings</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(customer.savingsSummary?.availableBalance || 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across {customer.savingsSummary?.activePlans || 0} active plans
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-amber-600">Loan Balance</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(loanMetrics.totalOutstanding)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Outstanding from {loanMetrics.count} loans
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <PieChart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Savings performance</h3>
                  <p className="text-xs text-slate-500">Accumulated growth and contributions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(customer.savingsSummary?.totalDeposited || 0)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total deposited</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Recent plans list */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Active plans</h2>
          <button
            type="button"
            onClick={() => navigate(`/manager/customers/${id}/plans`)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all plans
          </button>
        </div>
        <div className="mt-4 divide-y divide-slate-50">
          {!decoratedPlans.length ? (
            <div className="py-12 text-center text-sm text-slate-400">No active plans found for this customer.</div>
          ) : (
            decoratedPlans.slice(0, 5).map((plan) => (
              <div key={plan._id} className="group flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${
                      plan.isLoanPlan ? "bg-amber-500 shadow-amber-200" : "bg-emerald-500 shadow-emerald-200"
                    } shadow-lg shadow-opacity-30`}
                  >
                    {plan.isLoanPlan ? <TrendingUp className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 transition group-hover:text-primary">
                      {plan.planName || "Untitled plan"}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {toTitleCase(plan.planType)} • Started {formatDate(plan.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(plan.isLoanPlan ? plan.loanBalance : plan.balance)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/manager/customers/${id}/plans/${plan._id}`)}
                    className="rounded-full bg-slate-50 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-primary"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
