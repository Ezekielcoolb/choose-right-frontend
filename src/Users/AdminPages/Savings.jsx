import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Search, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { fetchAdminSavingsPlans } from "../../redux/slices/savingsSlice";
import { fetchCsos } from "../../redux/slices/csoSlice";

const numberFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
});

const formatCurrency = (value) => numberFormatter.format(Number(value || 0));

export default function AdminSavingsPage() {
  const dispatch = useDispatch();
  const {
    adminPlans,
    adminPlansStatus,
    adminPlansError,
  } = useSelector((state) => state.savings);
  const { items: csos, status: csosStatus } = useSelector((state) => state.csos);

  const [showSensitive, setShowSensitive] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [csoFilter, setCsoFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (adminPlansStatus === "idle") {
      dispatch(fetchAdminSavingsPlans());
    }
  }, [adminPlansStatus, dispatch]);

  useEffect(() => {
    if (csosStatus === "idle") {
      dispatch(fetchCsos());
    }
  }, [csosStatus, dispatch]);

  const plans = useMemo(() => {
    const items = adminPlans || [];
    return items.filter((plan) => {
      const loanStatus = (plan?.loanDetails?.status || "").toLowerCase();
      if (plan?.isLoan) {
        return false;
      }
      if (["approved", "active"].includes(loanStatus)) {
        return false;
      }
      return true;
    });
  }, [adminPlans]);

  const csoById = useMemo(() => {
    const map = new Map();
    (csos || []).forEach((cso) => {
      if (cso?._id) {
        map.set(cso._id, cso);
      }
    });
    return map;
  }, [csos]);

  const enrichedPlans = useMemo(() => {
    if (!plans.length) return [];
    return plans.map((plan) => {
      const cso = plan.cso || csoById.get(plan.csoId) || {};
      const customer = plan.customer || {};
      const csoNameParts = [cso.firstName, cso.lastName].filter(Boolean);
      const customerNameParts = [customer.firstName, customer.lastName].filter(Boolean);
      const searchTokens = [
        plan.planName,
        plan._id,
        plan.status,
        plan.totalDeposited,
        plan.totalWithdrawn,
        plan.availableBalance,
        customerNameParts.join(" "),
        customer.phone,
        customer.email,
      ]
        .map((value) => (value === null || value === undefined ? "" : value.toString().toLowerCase()))
        .filter(Boolean);

      return {
        ...plan,
        csoName: csoNameParts.join(" ") || cso.name || cso.fullName || "Unknown CSO",
        csoPhone: cso.phone,
        csoId: cso._id || plan.csoId,
        customerName:
          plan.customerName
          || customerNameParts.join(" ")
          || customer.fullName
          || customer.name
          || "Unknown customer",
        customerPhone: customer.phone,
        searchIndex: searchTokens.join(" "),
      };
    });
  }, [plans, csoById]);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedPlans.filter((plan) => {
      const matchesSearch = !term || (plan.searchIndex || "").includes(term);

      const matchesStatus =
        statusFilter === "all" || (plan.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesCso = csoFilter === "all" || (plan.csoId && plan.csoId.toString() === csoFilter);

      return matchesSearch && matchesStatus && matchesCso;
    });
  }, [enrichedPlans, search, statusFilter, csoFilter]);

  const totalItems = filteredPlans.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const pagedPlans = useMemo(
    () => filteredPlans.slice(startIndex, endIndex || filteredPlans.length),
    [filteredPlans, startIndex, endIndex],
  );

  const displayStart = totalItems ? startIndex + 1 : 0;
  const displayEnd = totalItems ? endIndex : 0;

  const csoOptions = useMemo(() => {
    return Array.from(csoById.values())
      .map((cso) => ({
        id: cso._id,
        name: [cso.firstName, cso.lastName].filter(Boolean).join(" ") || cso.name || "Unnamed CSO",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [csoById]);

  const summary = useMemo(
    () =>
      filteredPlans.reduce(
        (acc, plan) => {
          acc.totalDeposited += Number(plan.totalDeposited || 0);
          acc.totalMaintenanceFees += Number(plan.totalFees || 0);
          acc.totalWithdrawn += Number(plan.totalWithdrawn || 0);
          acc.availableBalance += Number(plan.availableBalance || 0);
          return acc;
        },
        { totalDeposited: 0, totalMaintenanceFees: 0, totalWithdrawn: 0, availableBalance: 0 },
      ),
    [filteredPlans],
  );

  const isLoading = adminPlansStatus === "loading" || adminPlansStatus === "idle";
  const isCsosLoading = csosStatus === "loading" || csosStatus === "idle";
  const isTableLoading = isLoading || isCsosLoading;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold text-slate-900">Savings overview</h1>
          <p className="text-sm text-slate-500">
            Monitor all savings plans across CSOs, track fees, and review available balances from a single dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          title={showSensitive ? "Hide sensitive values" : "Show sensitive values"}
        >
          {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showSensitive ? "Hide Values" : "Show Values"}
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
          <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(summary.totalDeposited)}</p>
          <p className="text-xs text-slate-500">Aggregate savings volume across all plans</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maintenance fees</p>
          <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(summary.totalMaintenanceFees)}</p>
          <p className="text-xs text-slate-500">Total maintenance fees charged on all plans</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
          <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(summary.totalWithdrawn)}</p>
          <p className="text-xs text-slate-500">Amount customers have already collected</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available balance</p>
          <p className={`mt-2 text-2xl font-semibold text-slate-900 ${!showSensitive ? "blur-sm" : ""}`}>{formatCurrency(summary.availableBalance)}</p>
          <p className="text-xs text-slate-500">Current balance available across all savers</p>
        </article>
      </section>

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
            <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
            <label htmlFor="cso-filter" className="text-sm font-medium text-slate-600">
              CSO
            </label>
            <select
              id="cso-filter"
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
          {isTableLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading savings plans…
            </div>
          ) : adminPlansError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {adminPlansError}
            </div>
          ) : !filteredPlans.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center text-sm text-slate-500">
              No savings plans match your filters.
            </div>
          ) : (
            <div className="space-y-4">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">CSO in charge</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Deposited</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Maintenance fees</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Withdrawn</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Available</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pagedPlans.map((plan) => (
                    <tr key={plan._id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{plan.planName || "Unnamed plan"}</div>
                        {/* <div className="text-xs text-slate-400">{plan._id}</div> */}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {plan.customerName || plan.customer?.fullName || plan.customerId || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-400">{plan.customerPhone || plan.customer?.phone || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{plan.csoName}</div>
                        <div className="text-xs text-slate-400">{plan.csoPhone || "—"}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.totalDeposited || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.totalFees || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(plan.totalWithdrawn || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(plan.availableBalance || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            plan.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : plan.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {plan.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalItems > pageSize && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {displayStart}-{displayEnd} of {totalItems} plans
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
          )}
</div>
        </section>

      <footer className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Need deeper insights?</p>
            <p className="text-xs text-slate-500">Review individual CSOs to inspect their customer lists, plans, and collections.</p>
          </div>
          <a
            href="/admin/cso"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Manage CSOs <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}
