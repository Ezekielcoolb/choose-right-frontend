import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Search } from "lucide-react";
import { fetchManagerSavings } from "../../redux/slices/managerDataSlice";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function ManagerSavingsPage() {
  const dispatch = useDispatch();
  const { savings } = useSelector((state) => state.managerData);
  const { data: items, status, error } = savings;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchManagerSavings());
    }
  }, [status, dispatch]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    
    // items is an array of plans
    const allPlans = items || [];
    
    return allPlans.filter((plan) => {
        // Filter out loan plans if they appear here, typically we want savings plans
        // AdminSavings explicitly filtered based on planType or isLoan.
        // managerDataController.js getManagedSavingsPlans only populates savings plans?
        // Let's check backend logic:
        /*
         const match = ...
         const plans = await SavingsPlan.find(match)...
         There is no explicit filter for isLoan: false in getManagedSavingsPlans, 
         BUT getManagedLoans HAS explicit filter.
         So getManagedSavingsPlans MIGHT return loans too.
         I should filter them out on client side to mirror AdminSavings logic if needed.
         AdminSavings: 
           if (plan?.isLoan) return false;
           if (["approved", "active"].includes(loanStatus)) return false;
        */
        const loanStatus = (plan?.loanDetails?.status || "").toLowerCase();
        if (plan?.isLoan === true) return false;
        if (plan?.planType === "loan") return false;
        if (["approved", "active", "completed"].includes(loanStatus)) return false;

        const customer = plan.customerId || {};
        const cso = plan.csoId || {};
        
        const searchIndex = [
            plan.planName,
            customer.firstName,
            customer.lastName,
            customer.phone,
            cso.firstName, 
            cso.lastName
        ].filter(Boolean).join(" ").toLowerCase();

        const matchesSearch = !term || searchIndex.includes(term);
        const matchesStatus = statusFilter === "all" || (plan.status || "").toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const summary = useMemo(() => {
    return filteredItems.reduce(
        (acc, plan) => {
            acc.totalDeposited += Number(plan.totalDeposited || 0);
            acc.totalFees += Number(plan.totalFees || 0);
            acc.totalWithdrawn += Number(plan.totalWithdrawn || 0);
            acc.availableBalance += Number(plan.availableBalance || 0);
            return acc;
        },
        { totalDeposited: 0, totalFees: 0, totalWithdrawn: 0, availableBalance: 0 }
    );
  }, [filteredItems]);

  const isLoading = status === "loading";

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Branch Savings</h1>
        <p className="text-sm text-slate-500">
            Monitor all savings plans managed within your branch.
        </p>
      </header>

      {/* <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalDeposited)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maintenance fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalFees)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalWithdrawn)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available balance</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(summary.availableBalance)}</p>
        </article>
      </section> */}

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
              placeholder="Search plans, customers..."
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
             </select>
           </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading savings plans...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : !filteredItems.length ? (
             <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No savings plans found.
            </div>
          ) : (
             <div className="space-y-4">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Plan</th>
                            <th className="px-4 py-3 text-left font-semibold">Customer</th>
                            <th className="px-4 py-3 text-left font-semibold">CSO</th>
                            <th className="px-4 py-3 text-right font-semibold">Deposited</th>
                            <th className="px-4 py-3 text-right font-semibold">Fees</th>
                            <th className="px-4 py-3 text-right font-semibold">Withdrawn</th>
                            <th className="px-4 py-3 text-right font-semibold">Available</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedItems.map((plan) => {
                            const customer = plan.customerId || {};
                            const cso = plan.csoId || {};
                            return (
                                <tr key={plan._id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                        {plan.planName || "Unnamed Plan"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{customer.firstName} {customer.lastName}</div>
                                        <div className="text-xs text-slate-400">{customer.phone}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                         <div className="font-medium text-slate-900">{cso.firstName} {cso.lastName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.totalDeposited)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.totalFees)}
                                    </td>
                                     <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatCurrency(plan.totalWithdrawn)}
                                    </td>
                                     <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                        {formatCurrency(plan.availableBalance)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                             plan.status === "active"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : plan.status === "completed"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-slate-200 text-slate-600"
                                        }`}>
                                            {plan.status || "Unknown"}
                                        </span>
                                    </td>
                                </tr>
                            );
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
