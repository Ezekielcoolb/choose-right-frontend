// Nudge for Vite reload
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Filter, Search, TrendingUp, TrendingDown } from "lucide-react";
import { fetchManagerCustomerDetail } from "../../redux/slices/managerDataSlice.jsx";

const PAGE_SIZE = 10;

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

const toTitleCase = (value) => {
  if (!value) return "—";
  const stringValue = value.toString();
  if (!stringValue.length) return "—";
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
};

const PaginationControls = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages <= 1) return null;

  const goToPrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:text-sm ${className}`}
    >
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToPrev}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const PLAN_FILTERS = [
  { value: "all", label: "All plans" },
  { value: "savings", label: "Savings plans" },
  { value: "loan", label: "Loan plans" },
  { value: "completed", label: "Completed" },
];

export default function ManagerCustomerPlans() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedCustomer, customerPlans } = useSelector((state) => state.managerData);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(fetchManagerCustomerDetail(id));
    }
  }, [dispatch, id]);

  const decoratedPlans = useMemo(() => {
    return customerPlans.map((plan) => {
      const isLoanPlan = Boolean(plan.loanDetails || plan.planType === "loan");
      const status = (plan.status || plan.state || plan.loanDetails?.status || "active").toLowerCase();
      const deposits = Number(plan.totalDeposited || plan.totalPaid || 0);
      const maintenance = Number(plan.totalFees || plan.maintenanceFee || 0);
      const balance = Number(plan.availableBalance || plan.balance || 0);
      const loanBalance = Number(plan.loanDetails?.balance || plan.loanDetails?.outstanding || 0);
      const withdrawn = Number(plan.totalWithdrawn || plan.withdrawnAmount || 0);
      const startDate = plan.startDate || plan.createdAt;

      return {
        ...plan,
        isLoanPlan,
        status,
        deposits,
        maintenance,
        balance,
        loanBalance,
        withdrawn,
        startDate,
        searchIndex: [plan.planName, plan.planType, plan._id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [customerPlans]);

  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return decoratedPlans.filter((plan) => {
      const matchesSearch = !term || plan.searchIndex.includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "savings" && !plan.isLoanPlan) ||
        (filter === "loan" && plan.isLoanPlan) ||
        (filter === "completed" && plan.status === "completed");
      return matchesSearch && matchesFilter;
    });
  }, [decoratedPlans, filter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm]);

  const pagination = useMemo(() => {
    const total = filteredPlans.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PAGE_SIZE;

    return {
      total,
      totalPages,
      current,
      items: filteredPlans.slice(start, start + PAGE_SIZE),
    };
  }, [filteredPlans, page]);

  const visiblePlans = pagination.items;

  const summary = useMemo(() => {
    return filteredPlans.reduce(
      (acc, plan) => {
        acc.totalDeposits += plan.deposits;
        acc.totalBalance += plan.isLoanPlan ? plan.loanBalance : plan.balance;
        acc.totalWithdrawn += plan.isLoanPlan ? 0 : plan.withdrawn;
        if (plan.isLoanPlan) {
          acc.loanPlans += 1;
          acc.loanExposure += plan.loanBalance;
        } else {
          acc.savingsPlans += 1;
        }
        return acc;
      },
      { totalDeposits: 0, totalBalance: 0, totalWithdrawn: 0, loanPlans: 0, loanExposure: 0, savingsPlans: 0 },
    );
  }, [filteredPlans]);

  const loading = selectedCustomer.status === "loading" && !decoratedPlans.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to customer
          </button>
          <h1 className="text-3xl font-semibold text-slate-900">Customer plans</h1>
          <p className="text-sm text-slate-500">
            Comprehensive list of savings and loan plans owned by {selectedCustomer.data ? `${selectedCustomer.data.firstName} ${selectedCustomer.data.lastName}` : "this customer"}.
          </p>
        </div>
        <div className="grid gap-2 text-right text-xs uppercase tracking-wide text-slate-500">
          <span>Customer ID</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
            {id}
          </span>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposits</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalDeposits)}</p>
          <p className="text-xs text-slate-500">Across filtered plans</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Savings plans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.savingsPlans.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Active savings products</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loan plans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.loanPlans.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Loans currently in view</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalWithdrawn)}</p>
          <p className="text-xs text-slate-500">Savings collected by this customer</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {PLAN_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filter === item.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                }`}
              >
                <Filter className="h-3.5 w-3.5" /> {item.label}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by plan name"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading plans…
            </div>
          ) : selectedCustomer.status === "failed" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {selectedCustomer.error}
            </div>
          ) : !filteredPlans.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No plans match your filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Deposited</th>
                  <th className="px-4 py-3 text-right font-semibold">Withdrawn</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 text-left font-semibold">Start date</th>
                  <th className="px-4 py-3 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePlans.map((plan) => (
                  <tr
                    key={plan._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{plan.planName || "Savings plan"}</p>
                      <p className="text-xs text-slate-400">{plan._id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${
                          plan.isLoanPlan ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {plan.isLoanPlan ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                        {plan.isLoanPlan ? "Loan" : "Savings"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{toTitleCase(plan.status)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(plan.deposits)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {plan.isLoanPlan ? "—" : formatCurrency(plan.withdrawn)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(plan.isLoanPlan ? plan.loanBalance : plan.balance)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(plan.startDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/manager/customers/${id}/plans/${plan._id}`)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PaginationControls
            currentPage={pagination.current}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </div>
      </section>

    </div>
  );
}
