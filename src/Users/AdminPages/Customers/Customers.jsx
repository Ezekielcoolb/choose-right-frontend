import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCustomers, deleteCustomer } from "../../../redux/slices/customersSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import { Loader2, MoreVertical, Search, Trash2, AlertTriangle } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function AdminCustomers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error, pagination, mutationStatus, mutationError } = useSelector((state) => state.customers);
  const { items: csos, status: csoStatus } = useSelector((state) => state.csos);

  const [searchTerm, setSearchTerm] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCustomers({ admin: true }));
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (csoStatus === "idle") {
      dispatch(fetchCsos());
    }
  }, [csoStatus, dispatch]);

  useEffect(() => {
    if (!openMenuId) return undefined;

    const handleClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [openMenuId]);

  const csoDirectory = useMemo(() => {
    const map = new Map();
    (csos || []).forEach((cso) => {
      const id = cso?._id?.toString();
      if (!id) return;
      const name = [cso.firstName, cso.lastName].filter(Boolean).join(" ") || cso.fullName || cso.email || "CSO";
      map.set(id, {
        name,
        phone: cso.phone || "—",
        email: cso.email || "—",
      });
    });
    return map;
  }, [csos]);

  const decoratedCustomers = useMemo(() => {
    return (items || []).map((customer) => {
      const firstName = customer?.firstName || "";
      const lastName = customer?.lastName || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || customer?.fullName || "Unknown";
      const searchIndex = [fullName, customer?.phone, customer?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const rawCso = customer?.csoId || customer?.assignedCso || customer?.cso;
      let csoId = "";
      let csoName = "Unassigned";
      if (typeof rawCso === "string") {
        csoId = rawCso;
      } else if (typeof rawCso === "object" && rawCso) {
        csoId = rawCso._id?.toString() || "";
        csoName = [rawCso.firstName, rawCso.lastName].filter(Boolean).join(" ") || rawCso.fullName || csoName;
      }
      if (csoId && csoDirectory.has(csoId)) {
        csoName = csoDirectory.get(csoId).name;
      }

      const summary = customer?.savingsSummary || {};

      return {
        ...customer,
        fullName,
        csoId,
        csoName,
        searchIndex,
        activePlans: Number(summary.activePlans || 0),
        totalDeposited: Number(summary.totalDeposited || 0),
        availableBalance: Number(summary.availableBalance || 0),
        totalFees: Number(summary.totalFees || 0),
        totalWithdrawn: Number(summary.totalWithdrawn || 0),
      };
    });
  }, [items, csoDirectory]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return decoratedCustomers.filter((customer) => {
      const matchesSearch = !term || customer.searchIndex.includes(term);
      const matchesCso = csoFilter === "all" || customer.csoId === csoFilter;
      return matchesSearch && matchesCso;
    });
  }, [decoratedCustomers, searchTerm, csoFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCustomers.length);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const aggregated = useMemo(() => {
    return filteredCustomers.reduce(
      (acc, customer) => {
        acc.totalDeposited += customer.totalDeposited;
        acc.availableBalance += customer.availableBalance;
        acc.totalFees += customer.totalFees;
        acc.totalWithdrawn += customer.totalWithdrawn;
        acc.activePlans += customer.activePlans;
        return acc;
      },
      { totalDeposited: 0, availableBalance: 0, totalFees: 0, totalWithdrawn: 0, activePlans: 0 },
    );
  }, [filteredCustomers]);

  const isLoading = status === "loading";
  const isDeleting = mutationStatus === "loading" && customerToDelete;

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await dispatch(deleteCustomer({ customerId: customerToDelete._id, admin: true })).unwrap();
      closeDeleteModal();
    } catch (deleteError) {
      // Error is handled via mutationError in state
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
          <p className="text-sm text-slate-500">Monitor every customer on the platform and drill into their plans in one click.</p>
        </div>
        <div className="flex gap-4 text-sm text-slate-500">
          <div>
            <p className="text-xs uppercase tracking-wide">Customers</p>
            <p className="text-lg font-semibold text-slate-900">{pagination?.total ?? items.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Active plans</p>
            <p className="text-lg font-semibold text-slate-900">{aggregated.activePlans.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Total deposited</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(aggregated.totalDeposited)}</p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder="Search by customer name or contact"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="customer-cso-filter" className="text-sm font-medium text-slate-600">
              CSO
            </label>
            <select
              id="customer-cso-filter"
              value={csoFilter}
              onChange={(event) => {
                setPage(1);
                setCsoFilter(event.target.value);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All CSOs</option>
              {(csos || [])
                .map((cso) => ({
                  id: cso?._id?.toString() || "",
                  name: [cso.firstName, cso.lastName].filter(Boolean).join(" ") || cso.fullName || cso.email || "Unnamed CSO",
                }))
                .filter((option) => option.id)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading customers…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : !filteredCustomers.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
              No customers match your filters.
            </div>
          ) : (
            <div className="space-y-4">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold">CSO</th>
                    <th className="px-4 py-3 text-right font-semibold">Active plans</th>
                    <th className="px-4 py-3 text-right font-semibold">Total deposited</th>
                    <th className="px-4 py-3 text-right font-semibold">Total fees</th>
                    <th className="px-4 py-3 text-right font-semibold">Total withdrawn</th>
                    <th className="px-4 py-3 text-right font-semibold">Available balance</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer._id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {(customer.fullName || "?").charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{customer.fullName}</p>
                            {/* <p className="text-xs text-slate-400">{customer._id}</p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{customer.phone || "—"}</p>
                        <p className="text-xs text-slate-400">{customer.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{customer.csoName}</p>
                        {/* <p className="text-xs text-slate-400">{customer.csoId || "—"}</p> */}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{customer.activePlans}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(customer.totalDeposited)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(customer.totalFees)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(customer.totalWithdrawn)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(customer.availableBalance)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId((prev) => (prev === customer._id ? null : customer._id));
                            }}
                            aria-label="Open customer actions"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {openMenuId === customer._id ? (
                            <div
                              role="menu"
                              onClick={(event) => event.stopPropagation()}
                              className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                            >
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                onClick={() => {
                                  navigate(`/admin/customers/${customer._id}`);
                                  setOpenMenuId(null);
                                }}
                              >
                                View details
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                onClick={() => {
                                  navigate(`/admin/customers/${customer._id}/plans`);
                                  setOpenMenuId(null);
                                }}
                              >
                                View plans
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setShowDeleteModal(true);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete customer
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCustomers.length > pageSize ? (
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {filteredCustomers.length ? startIndex + 1 : 0}-{endIndex} of {filteredCustomers.length} customers
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="font-medium text-slate-600">Page {currentPage} of {pageCount}</span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                      disabled={currentPage === pageCount}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total deposited</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(aggregated.totalDeposited)}</p>
          <p className="text-xs text-slate-500">Combined deposits across filtered customers</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total withdrawn</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(aggregated.totalWithdrawn)}</p>
          <p className="text-xs text-slate-500">Withdrawals recorded for filtered customers</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(aggregated.totalFees)}</p>
          <p className="text-xs text-slate-500">Maintenance charges including loan fees</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(aggregated.availableBalance)}</p>
          <p className="text-xs text-slate-500">Funds currently accessible</p>
        </article>
      </section>

      {showDeleteModal && customerToDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-rose-100 p-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Delete customer?</h2>
                <p className="text-sm text-slate-600">
                  This will permanently remove {customerToDelete.fullName} and all associated savings plans and records. This action cannot be undone.
                </p>
                {mutationError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{mutationError}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomer}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-500 bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete customer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
