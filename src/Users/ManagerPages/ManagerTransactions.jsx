import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  CalendarDays,
  RefreshCw,
  Search,
  Users,
  Plus,
  ArrowRight,
  ChevronRight,
  Circle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import {
  fetchManagerTransactions,
  fetchManagerRemittances,
  resolveManagerRemittance,
} from "../../redux/slices/managerDataSlice";
import { toast } from "react-hot-toast";

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const getLocalDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

const getDateKey = (value) => {
  const date = getLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const getMonthKey = (value) => {
  const date = getLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 7);
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (reference) => {
  const date = startOfDay(reference);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  date.setDate(date.getDate() - diff);
  return date;
};

const endOfWeek = (reference) => {
  const date = startOfWeek(reference);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ManagerTransactionsPage() {
  const dispatch = useDispatch();

  const { transactions, remittances } = useSelector((state) => state.managerData);
  const { data: transactionItems, status: transactionsStatus, error: transactionsError } = transactions;
  const { data: remittanceItems, status: remittancesStatus, error: remittancesError } = remittances;

  const [activeTab, setActiveTab] = useState("collection");
  const [quickRange, setQuickRange] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resolutions, setResolutions] = useState({});
  const [issueResolutions, setIssueResolutions] = useState({});
  const [isResolving, setIsResolving] = useState({});

  useEffect(() => {
    if (activeTab === "collection" && transactionsStatus === "idle") {
      dispatch(fetchManagerTransactions());
    } else if (activeTab === "remittance" && remittancesStatus === "idle") {
      dispatch(fetchManagerRemittances());
    }
  }, [activeTab, transactionsStatus, remittancesStatus, dispatch]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getDateKey(today), [today]);
  const yesterdayKey = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 1);
    return getDateKey(date);
  }, [today]);
  const thisWeekStart = useMemo(() => startOfWeek(today), [today]);
  const thisWeekEnd = useMemo(() => endOfWeek(today), [today]);

  const matchesQuickRange = (recordedAt, dateKeyProp) => {
    if (!recordedAt) return false;
    const localDate = getLocalDate(recordedAt);

    switch (quickRange) {
      case "today":
        return dateKeyProp === todayKey;
      case "yesterday":
        return dateKeyProp === yesterdayKey;
      case "thisWeek":
        return localDate >= thisWeekStart && localDate <= thisWeekEnd;
      case "custom":
        if (!customStart || !customEnd) return true;
        return (
          localDate >= startOfDay(new Date(customStart)) &&
          localDate <= endOfDay(new Date(customEnd))
        );
      case "all":
      default:
        return true;
    }
  };

  const filteredCollection = useMemo(() => {
    if (activeTab !== "collection") return [];
    
    const items = transactionItems || [];
    const term = searchTerm.trim().toLowerCase();

    return items
      .map((entry) => {
        const recordedAt = entry.recordedAt || entry.createdAt;
        return {
          ...entry,
          localRecordedAt: getLocalDate(recordedAt),
          dateKey: getDateKey(recordedAt),
          monthKey: getMonthKey(recordedAt),
        };
      })
      .filter((entry) => {
        if (!matchesQuickRange(entry.localRecordedAt, entry.dateKey)) return false;
        if (selectedMonth && entry.monthKey !== selectedMonth) return false;
        if (csoFilter !== "all" && (entry.csoId?._id || entry.csoId) !== csoFilter) return false;

        if (term) {
          const customer = entry.customerId || {};
          const plan = entry.planId || {};
          const cso = entry.csoId || {};
          const haystack = [
            customer.firstName,
            customer.lastName,
            customer.phone,
            plan.planName,
            cso.firstName,
            cso.lastName,
            entry.type,
            entry.narration,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.localRecordedAt - a.localRecordedAt);
  }, [activeTab, transactionItems, quickRange, selectedMonth, csoFilter, searchTerm, todayKey, yesterdayKey, thisWeekStart, thisWeekEnd]);

  const filteredRemittance = useMemo(() => {
    if (activeTab !== "remittance") return [];

    const items = remittanceItems || [];
    const term = searchTerm.trim().toLowerCase();

    return items
      .map((entry) => {
        const recordedAt = entry.updatedAt || entry.createdAt;
        const collected = Number(entry.amountCollected || entry.amountRemitted || 0);
        const paid = Number(entry.amountPaid || entry.amountRemitted || 0);
        return {
          ...entry,
          localRecordedAt: getLocalDate(recordedAt),
          dateKey: getDateKey(recordedAt),
          csoPhone: entry.csoPhone,
          monthKey: getMonthKey(recordedAt),
          amountCollected: collected,
          amountPaid: paid,
          resolution: entry.resolution || 0,
          issueResolution: entry.issueResolution || "",
        };
      })
      .filter((entry) => {
        if (!matchesQuickRange(entry.localRecordedAt, entry.dateKey)) return false;
        if (selectedMonth && entry.monthKey !== selectedMonth) return false;
        if (csoFilter !== "all" && (entry.csoId?._id || entry.csoId) !== csoFilter) return false;

        if (term) {
          const haystack = [entry.csoName, entry.remark]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => b.localRecordedAt - a.localRecordedAt);
  }, [activeTab, remittanceItems, quickRange, selectedMonth, csoFilter, searchTerm, todayKey, yesterdayKey, thisWeekStart, thisWeekEnd]);

  const activeData = activeTab === "collection" ? filteredCollection : filteredRemittance;

  const totals = useMemo(() => {
    if (activeTab === "collection") {
      return filteredCollection.reduce(
        (acc, entry) => {
          acc.count += 1;
          acc.amount += Number(entry.amount || 0);
          if (entry.csoId?._id) acc.csoSet.add(entry.csoId._id);
          return acc;
        },
        { count: 0, amount: 0, csoSet: new Set() }
      );
    } else {
      return filteredRemittance.reduce(
        (acc, entry) => {
          acc.count += 1;
          acc.totalCollected += entry.amountCollected;
          acc.totalPaid += entry.amountPaid;
          acc.totalBalance += entry.balance;
          return acc;
        },
        { count: 0, totalCollected: 0, totalPaid: 0, totalBalance: 0 }
      );
    }
  }, [activeTab, filteredCollection, filteredRemittance]);

  const csoOptions = useMemo(() => {
    const map = new Map();
    const items = activeTab === "collection" ? (transactionItems || []) : (remittanceItems || []);
    
    items.forEach((item) => {
      const id = activeTab === "collection" ? item.csoId?._id : item.csoId;
      if (id) {
        const name = activeTab === "collection" ? `${item.csoId.firstName} ${item.csoId.lastName}` : item.csoName;
        map.set(id, name);
      }
    });

    return [{ value: "all", label: "All CSOs" }, ...Array.from(map.entries()).map(([value, label]) => ({ value, label }))];
  }, [activeTab, transactionItems, remittanceItems]);

   useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, quickRange, selectedMonth, customStart, customEnd, csoFilter, searchTerm]);

  const handleResolve = async (entry) => {
    const value = resolutions[entry._id];
    if (value === undefined || value === "") {
        return;
    }

    setIsResolving((prev) => ({ ...prev, [entry._id]: true }));
    try {
      await dispatch(
        resolveManagerRemittance({
          csoId: entry.csoId,
          remittanceId: entry._id,
          resolution: Number(value),
          issueResolution: issueResolutions[entry._id] || "",
        }),
      ).unwrap();
      toast.success("Resolution updated");
      setResolutions((prev) => {
        const next = { ...prev };
        delete next[entry._id];
        return next;
      });
      setIssueResolutions((prev) => {
        const next = { ...prev };
        delete next[entry._id];
        return next;
      });
    } catch (err) {
      toast.error(err || "Failed to update resolution");
    } finally {
      setIsResolving((prev) => ({ ...prev, [entry._id]: false }));
    }
  };

  const totalRecords = activeData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedItems = activeData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isLoading = (activeTab === "collection" ? transactionsStatus : remittancesStatus) === "loading";
  const error = activeTab === "collection" ? transactionsError : remittancesError;

  return (
    <div className="space-y-8 p-0">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Branch Transactions</h1>
          <p className="text-sm text-slate-500">
            Monitor collections and remittances from CSOs within your branch.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                <button
                    onClick={() => setActiveTab("collection")}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        activeTab === "collection" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Collection
                </button>
                <button
                    onClick={() => setActiveTab("remittance")}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        activeTab === "remittance" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                    Remittance
                </button>
            </div>
            <button
                type="button"
                onClick={() => {
                    if (activeTab === "collection") dispatch(fetchManagerTransactions());
                    else dispatch(fetchManagerRemittances());
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary transition"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeTab === "collection" ? (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Collections volume</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.amount)}</p>
              <p className="text-xs text-slate-500">Total amount captured</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Matching entries</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active CSOs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.csoSet.size}</p>
              <p className="text-xs text-slate-500">Unique CSOs recorded</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date scope</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {quickRange === "all" ? "All time" : quickRange === "custom" ? "Custom" : quickRange.charAt(0).toUpperCase() + quickRange.slice(1)}
              </p>
              <p className="text-xs text-slate-500">Current time range</p>
            </article>
          </>
        ) : (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Collections</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalCollected)}</p>
              <p className="text-xs text-slate-500">Declarations by CSOs</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remitted</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalPaid)}</p>
              <p className="text-xs text-slate-500">Amount paid in</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Variance</p>
              <p className="mt-2 text-2xl font-semibold text-amber-600">{formatCurrency(totals.totalBalance)}</p>
              <p className="text-xs text-slate-500">Difference</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Records</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Matching entries</p>
            </article>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick range</span>
            {["today", "yesterday", "thisWeek", "all", "custom"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuickRange(value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  quickRange === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary"
                }`}
              >
                {value === "thisWeek" ? "This week" : value === "all" ? "All time" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </label>

            {quickRange === "custom" && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === "collection" ? "Search customer, plan, CSO..." : "Search CSO or remark..."}
                className="w-full rounded-full border border-slate-200 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Users className="h-4 w-4 text-slate-400" />
              <select
                value={csoFilter}
                onChange={(e) => setCsoFilter(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {csoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {totalRecords.toLocaleString()} record{totalRecords === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading...
            </div>
          ) : !activeData.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center text-sm text-slate-500">
              No entries match your filters.
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {activeTab === "collection" ? (
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">CSO</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Narration</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">CSO</th>
                      <th className="px-4 py-3 text-left">Contact</th>
                      <th className="px-4 py-3 text-right">Resolution</th>
                      <th className="px-4 py-3 text-left">Issue</th>
                      <th className="px-4 py-3 text-left">Remark</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedItems.map((entry, idx) => (
                    <tr key={entry._id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {entry.localRecordedAt?.toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      {activeTab === "collection" ? (
                        <>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{entry.planId?.planName || "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{entry.customerId?.firstName} {entry.customerId?.lastName}</p>
                            <p className="text-xs text-slate-400">{entry.customerId?.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {entry.csoId?.firstName} {entry.csoId?.lastName}
                          </td>
                          <td className="px-4 py-3 capitalize">{entry.type?.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-slate-500">{entry.narration || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(entry.amount)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {[entry.csoName].filter(Boolean).join(" ")}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">{entry.csoPhone}</td>
                          {activeTab === "remittance" && (
                            <>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {entry.resolution > 0 ? (
                                    <span className="font-semibold text-slate-900">{formatCurrency(entry.resolution)}</span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={resolutions[entry._id] ?? ""}
                                        placeholder="Amount"
                                        onChange={(e) => setResolutions((prev) => ({ ...prev, [entry._id]: e.target.value }))}
                                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-left">
                                <div className="flex flex-col gap-1">
                                  {entry.resolution > 0 ? (
                                    <>
                                      <span className="text-sm text-slate-600">{entry.issueResolution || "—"}</span>
                                      <div className="flex items-center gap-1.5">
                                        {Number(entry.amountPaid) !== Number(entry.resolution) ? (
                                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-500">
                                            <AlertTriangle className="h-3 w-3" />
                                            <span>Mismatch</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Matched</span>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={issueResolutions[entry._id] ?? ""}
                                        placeholder="Describe issue"
                                        onChange={(e) => setIssueResolutions((prev) => ({ ...prev, [entry._id]: e.target.value }))}
                                        className="w-40 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                      />
                                      <button
                                        onClick={() => handleResolve(entry)}
                                        disabled={isResolving[entry._id] || !resolutions[entry._id]}
                                        className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition"
                                      >
                                        {isResolving[entry._id] ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Set"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{entry.remark || "—"}</td>
                            </>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-full border border-slate-200 px-2 py-1 outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
