import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Search } from "lucide-react";
import { fetchManagerLoans } from "../../redux/slices/managerDataSlice";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// Usage of normalization logic from AdminLoans to ensure consistent calculation
const normalizeLoanStats = (plan) => {
  const loanDetails = plan?.loanDetails || {};
  const baseAmount = Number(
    loanDetails.amount ?? loanDetails.requestedAmount ?? plan?.loanAmount ?? (plan?.dailyContribution ? plan.dailyContribution * 30 : 0),
  );

  const savingsMaintenanceCandidate = Number(plan.maintenanceFee || 0);
  const recordedMaintenance = Number(plan.totalFees || 0);
  const loanMaintenanceCandidate = Number(
    loanDetails.maintenanceFee ??
      (loanDetails.maintenanceFeePaid ? plan.dailyContribution ?? plan.maintenanceFee ?? 0 : 0),
  );
  const maintenanceFee = Math.max(
    recordedMaintenance,
    savingsMaintenanceCandidate + loanMaintenanceCandidate,
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
  const totalPaid = Math.max(0, combinedDeposits - maintenanceFee);

  const balance = Number(
    loanDetails.balance ?? loanDetails.outstanding ?? loanDetails.loanBalance ?? baseAmount - totalPaid,
  );

  return {
    amount: baseAmount,
    maintenanceFee,
    totalPaid,
    balance: balance < 0 ? 0 : balance,
  };
};

export default function ManagerLoansPage() {
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.managerData);
  const { data: items, status, error } = loans;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchManagerLoans());
    }
  }, [status, dispatch]);

  const enrichedLoans = useMemo(() => {
    return (items || []).map((plan) => {
        const stats = normalizeLoanStats(plan);
        const statusText = (plan?.loanDetails?.status || plan?.status || "active").toString().toLowerCase();
        
        return {
            ...plan,
            stats,
            statusText
        };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    
    return enrichedLoans.filter((plan) => {
         const customer = plan.customerId || {};
         const cso = plan.csoId || {};
         const searchIndex = [
            plan.planName,
            customer.firstName,
            customer.lastName,
            customer.phone,
            cso.firstName,
            cso.lastName,
            plan.statusText
         ].filter(Boolean).join(" ").toLowerCase();

         const matchesSearch = !term || searchIndex.includes(term);
         const matchesStatus = statusFilter === "all" || plan.statusText === statusFilter.toLowerCase();
         
         return matchesSearch && matchesStatus;
    });
  }, [enrichedLoans, search, statusFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a,b) => {
         // sort by request date desc
         const da = new Date(a.loanDetails?.requestDate || 0).getTime();
         const db = new Date(b.loanDetails?.requestDate || 0).getTime();
         return db - da;
    });
  }, [filteredItems]);

  const pageCount = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedItems.length);
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
        (acc, plan) => {
            acc.totalAmount += plan.stats.amount;
            acc.totalDeposited += Number(plan.totalDeposited || 0);
            acc.totalMaintenance += plan.stats.maintenanceFee;
            acc.totalPaid += plan.stats.totalPaid;
            acc.totalBalance += plan.stats.balance;
            return acc;
        },
        { totalAmount: 0, totalDeposited: 0, totalMaintenance: 0, totalPaid: 0, totalBalance: 0 }
    );
  }, [filteredItems]);

  const isLoading = status === "loading";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Branch Loans</h1>
            <p className="text-sm text-slate-500">
                Track all loan activity managed by your branch.
            </p>
         </div>
         <button 
           onClick={() => dispatch(fetchManagerLoans())}
           className="text-sm font-semibold text-primary hover:underline"
         >
            Refresh
         </button>
      </header>
       <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total loans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalAmount)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalDeposited)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maintenance fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalMaintenance)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total paid</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalPaid)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalBalance)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
           <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search loans, customers..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-3">
             <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">Status</label>
             <select
               id="status-filter"
               value={statusFilter}
               onChange={(e) => {
                 setPage(1);
                 setStatusFilter(e.target.value);
               }}
               className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
             >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
             </select>
           </div>
        </div>

        <div className="mt-6 overflow-x-auto">
             {isLoading ? (
                <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading loans...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              ) : !filteredItems.length ? (
                 <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                  No loans found.
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                     <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                       <tr>
                         <th className="px-4 py-3 text-left font-semibold">Customer</th>
                         <th className="px-4 py-3 text-left font-semibold">CSO</th>
                         <th className="px-4 py-3 text-left font-semibold">Plan</th>
                         <th className="px-4 py-3 text-left font-semibold">Status</th>
                         <th className="px-4 py-3 text-right font-semibold">Amount</th>
                         <th className="px-4 py-3 text-right font-semibold">Deposited</th>
                         <th className="px-4 py-3 text-right font-semibold">Fees</th>
                         <th className="px-4 py-3 text-right font-semibold">Paid</th>
                         <th className="px-4 py-3 text-right font-semibold">Balance</th>
                         <th className="px-4 py-3 text-left font-semibold">Request Date</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedItems.map(plan => {
                            const customer = plan.customerId || {};
                            const cso = plan.csoId || {};
                            return (
                                <tr key={plan._id} className="hover:bg-slate-50/70 transition">
                                     <td className="px-4 py-3 font-semibold text-slate-900">
                                        {customer.firstName} {customer.lastName}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{cso.firstName} {cso.lastName}</div>
                                        <div className="text-xs text-slate-400">{cso.phone}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                         <div className="font-medium text-slate-900">{plan.planName}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold capitalize
                                         ${["approved", "completed"].includes(plan.statusText) ? "bg-emerald-100 text-emerald-700" : 
                                            plan.statusText === "active" ? "bg-blue-100 text-blue-700" :
                                            "bg-amber-100 text-amber-700"}`}>
                                            {plan.statusText}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.stats.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.totalDeposited)}
                                    </td>
                                     <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.stats.maintenanceFee)}
                                    </td>
                                     <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.stats.totalPaid)}
                                    </td>
                                     <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.stats.balance)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                         {plan.loanDetails?.requestDate ? new Date(plan.loanDetails.requestDate).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            )
                        })}
                     </tbody>
                  </table>
                   {filteredItems.length > pageSize && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-500">
                             Showing {startIndex + 1}-{endIndex} of {filteredItems.length}
                        </span>
                        <div className="flex gap-2">
                             <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs font-medium border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50"
                                >
                                Previous
                                </button>
                                <button
                                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                                disabled={currentPage === pageCount}
                                className="px-3 py-1 text-xs font-medium border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50"
                                >
                                Next
                                </button>
                        </div>
                    </div>
                 )}
                </div>
              )}
        </div>
      </section>
    </div>
  );
}
