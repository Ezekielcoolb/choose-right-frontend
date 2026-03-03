// Nudge for Vite reload
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  Loader2,
  PieChart,
  PiggyBank,
  Search,
  Users,
  Wallet,
  MoreVertical,
} from "lucide-react";
import { fetchManagerCustomers, fetchManagerCsos } from "../../redux/slices/managerDataSlice.jsx";

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const toTitleCase = (value) => {
  if (!value) return "—";
  const text = value.toString();
  if (!text.length) return "—";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const PaginationControls = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:text-sm ${className}`}>
      <span>Page {currentPage} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function ManagerCustomers() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { customers: customersState, csos: csosState } = useSelector((state) => state.managerData);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    dispatch(fetchManagerCsos());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      fetchManagerCustomers({
        search: debouncedSearch,
        csoId: filter === "all" ? "" : filter,
        page,
        limit: PAGE_SIZE,
      }),
    );
  }, [dispatch, debouncedSearch, filter, page]);

  const items = customersState.data?.items || [];
  const csos = csosState.data || [];
  const status = customersState.status;
  const error = customersState.error;
  const serverPagination = customersState.data?.pagination || { total: 0, page: 1, pages: 1 };

  const summary = customersState.data?.summary || {
    total: 0,
    activePlans: 0,
    totalDeposited: 0,
    availableBalance: 0,
  };

  if (status === "loading" && !rawCustomers.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Customer Directory</h1>
        <p className="text-sm text-slate-500">Manage and oversee all customers within your branch.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customers</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{summary.total.toLocaleString()}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PieChart className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Plans</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{summary.activePlans?.toLocaleString() || 0}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <PiggyBank className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Deposited</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{formatCurrency(summary.totalDeposited)}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Balance</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{formatCurrency(summary.availableBalance)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
              >
                <option value="all">All CSOs</option>
                {csos.map((cso) => (
                  <option key={cso._id} value={cso._id}>
                    {cso.firstName} {cso.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto min-h-[350px] pb-20">
          {status === "failed" ? (
            <div className="py-20 text-center text-rose-600 font-medium">{error}</div>
          ) : !items.length ? (
            <div className="py-20 text-center text-slate-400 font-medium">No customers found matching your criteria.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-right">Plans</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((customer, index) => (
                  <tr key={customer._id} className="group transition hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-400 group-hover:bg-primary group-hover:text-white transition">
                          {customer.firstName?.[0]}{customer.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-primary transition">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: {customer._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 font-medium">{customer.phone}</p>
                      <p className="text-xs text-slate-400">{customer.email || "No email"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-slate-600">{customer.savingsSummary?.totalPlans || 0}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tabular-nums">
                        {customer.savingsSummary?.activePlans || 0} active
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(customer.savingsSummary?.availableBalance || 0)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === customer._id ? null : customer._id)}
                          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeDropdown === customer._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                            <div className={`absolute right-0 z-20 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 ${
                              index >= items.length - 2 && index > 0
                                ? "bottom-full mb-2 origin-bottom-right" 
                                : "mt-2 origin-top-right"
                            }`}>
                              <button
                                onClick={() => navigate(`/manager/customers/${customer._id}`)}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                View Detailed Profile
                              </button>
                              <button
                                onClick={() => navigate(`/manager/customers/${customer._id}/plans`)}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                View All Plans
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <PaginationControls
          currentPage={serverPagination.page}
          totalPages={serverPagination.pages}
          onPageChange={setPage}
          className="mt-6"
        />
      </section>
    </div>
  );
}
