import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveLoans } from "../../../redux/slices/adminLoanSlice";
import { Loader2, Eye, Search } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const normalizeLoanStats = (plan) => {
  const loanDetails = plan?.loanDetails || {};
  const baseAmount = Number(
    loanDetails.amount ?? loanDetails.requestedAmount ?? plan?.loanAmount ?? (plan?.dailyContribution ? plan.dailyContribution * 30 : 0),
  );

  const maintenanceFee = Number(plan.totalFees || plan.maintenanceFee || 0);
  const loanFee = Number(
    loanDetails.maintenanceFee ??
      loanDetails.processingFee ??
      loanDetails.serviceCharge ??
      plan?.loanFees ??
      0,
  );

  const loanRepaymentTotal = Number(
    loanDetails.totalPaid ??
      loanDetails.paid ??
      loanDetails.loanPaid ??
      loanDetails.amountPaid ??
      loanDetails.loanPaidRaw ??
      loanDetails.repaymentCollected ??
      0,
  );

  const combinedDeposits = Number(plan.totalDeposited || 0) + loanRepaymentTotal;
  const totalPaid = Math.max(0, combinedDeposits - (maintenanceFee + loanFee));

  const balance = Number(
    loanDetails.balance ?? loanDetails.outstanding ?? loanDetails.loanBalance ?? baseAmount - totalPaid,
  );

  return {
    amount: baseAmount,
    maintenanceFee,
    loanFee,
    totalPaid,
    balance: balance < 0 ? 0 : balance,
  };
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return "—";
  }
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const toTitleCase = (value) => {
  if (!value) return "Unknown";
  return value
    .toString()
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
};

export default function AdminLoans() {
  const dispatch = useDispatch();
  const { activeLoans, status } = useSelector((state) => state.adminLoans);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [csoFilter, setCsoFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchActiveLoans());
  }, [dispatch]);

  const isLoading = status === "loading";

  const enrichedLoans = useMemo(() => {
    return (activeLoans || []).map((plan) => {
      const stats = normalizeLoanStats(plan);
      const statusText = (plan?.loanDetails?.status || plan?.status || "active").toString().toLowerCase();
      const customerName = [plan?.customerId?.firstName, plan?.customerId?.lastName]
        .filter(Boolean)
        .join(" ") || "Unknown";
      const csoFirst = plan?.csoId?.firstName;
      const csoLast = plan?.csoId?.lastName;
      const csoName = [csoFirst, csoLast].filter(Boolean).join(" ") || "Unknown";
      const csoKey = plan?.csoId?._id?.toString() || plan?.csoId?.toString() || "unknown";
      const searchIndex = [plan?.planName, plan?._id, customerName, statusText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        ...plan,
        stats,
        statusText,
        customerName,
        csoName,
        csoKey,
        searchIndex,
      };
    });
  }, [activeLoans]);

  const filteredLoans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedLoans.filter((plan) => {
      const matchesSearch = !term || plan.searchIndex.includes(term);
      const matchesStatus = statusFilter === "all" || plan.statusText === statusFilter.toLowerCase();
      const matchesCso = csoFilter === "all" || plan.csoKey === csoFilter;
      return matchesSearch && matchesStatus && matchesCso;
    });
  }, [enrichedLoans, search, statusFilter, csoFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredLoans.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLoans.length);
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const summary = useMemo(() => {
    return filteredLoans.reduce(
      (acc, plan) => {
        acc.totalAmount += plan.stats.amount;
        acc.totalDeposited += Number(plan.totalDeposited || 0);
        acc.totalMaintenance += plan.stats.maintenanceFee;
        acc.totalLoanFees += plan.stats.loanFee;
        acc.totalPaid += plan.stats.totalPaid;
        acc.totalBalance += plan.stats.balance;
        return acc;
      },
      { totalAmount: 0, totalDeposited: 0, totalMaintenance: 0, totalLoanFees: 0, totalPaid: 0, totalBalance: 0 },
    );
  }, [filteredLoans]);

  const csoOptions = useMemo(() => {
    const map = new Map();
    enrichedLoans.forEach((plan) => {
      if (!plan.csoKey || plan.csoKey === "unknown") return;
      if (!map.has(plan.csoKey)) {
        map.set(plan.csoKey, plan.csoName);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedLoans]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Loans</h1>
        <button
          onClick={() => dispatch(fetchActiveLoans())}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total loans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalAmount)}</p>
          <p className="text-xs text-slate-500">Sum of all loans currently tracked</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalDeposited)}</p>
          <p className="text-xs text-slate-500">Combined deposits collected across plans</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.totalMaintenance + summary.totalLoanFees)}
          </p>
          <p className="text-xs text-slate-500">Combined Maintenance & Loan fees</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total paid</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-xs text-slate-500">Repayments received across all loans</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalBalance)}</p>
          <p className="text-xs text-slate-500">Amount still owed by borrowers</p>
        </article>
      </section>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !filteredLoans.length && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
          No loans match your filters.
        </div>
      )}

      {!isLoading && filteredLoans.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search by plan or customer"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="loan-status-filter" className="text-sm font-medium text-slate-600">
                Status
              </label>
              <select
                id="loan-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <label htmlFor="loan-cso-filter" className="text-sm font-medium text-slate-600">
                CSO
              </label>
              <select
                id="loan-cso-filter"
                value={csoFilter}
                onChange={(event) => {
                  setPage(1);
                  setCsoFilter(event.target.value);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All CSOs</option>
                {csoOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="space-y-4">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">CSO in charge</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Loan amount</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Deposited</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">M. Fee</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Loan Fee</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Total paid</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Balance</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Request date</th>
                    {/* <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Approval date</th> */}
                    {/* <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedLoans.map((plan) => (
                    <tr key={plan._id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{plan.customerName}</div>
                        {/* <div className="text-xs text-slate-400">{plan.customerId?.phone || "—"}</div> */}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{plan.csoName}</div>
                        <div className="text-xs text-slate-400">{plan.csoId?.phone || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{plan.planName}</div>
                        {/* <div className="text-xs text-slate-400">{plan._id}</div> */}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                            plan.statusText,
                          )}`}
                        >
                          {toTitleCase(plan.statusText)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.stats.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.totalDeposited || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-400">
                        {plan.stats.maintenanceFee > 0 ? formatCurrency(plan.stats.maintenanceFee) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-400">
                        {plan.stats.loanFee > 0 ? formatCurrency(plan.stats.loanFee) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.stats.totalPaid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.stats.balance)}
                      </td>
                      
                      <td className="px-4 py-3 text-slate-600">{formatDate(plan.loanDetails?.requestDate)}</td>
                      {/* <td className="px-4 py-3 text-slate-600">{formatDate(plan.loanDetails?.approvalDate)}</td> */}
                      {/* <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLoans.length > pageSize && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {filteredLoans.length ? startIndex + 1 : 0}-{endIndex} of {filteredLoans.length} loans
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <div className="text-xs font-medium text-slate-600">
                      Page {currentPage} of {pageCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                      disabled={currentPage === pageCount}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
