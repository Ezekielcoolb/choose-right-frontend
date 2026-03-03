import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CalendarDays, CalendarRange, RefreshCw, Search, Users, AlertTriangle, CheckCircle, Plus, Minus, X, Trash2 } from "lucide-react";

import { fetchCsos, adjustCsoRemittance, deleteCsoRemittance } from "../../../redux/slices/csoSlice";

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const toLocalDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

const dateKey = (value) => {
  const date = toLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const monthKey = (value) => {
  const date = toLocalDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 7);
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfWeek = (value) => {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  date.setDate(date.getDate() - diff);
  return date;
};

const endOfWeek = (value) => {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
};

const extractName = (cso) => {
  if (!cso) return "Unknown CSO";
  const first = cso.firstName || cso.firstname || "";
  const last = cso.lastName || cso.lastname || "";
  const full = cso.fullName || cso.name || `${first} ${last}`.trim();
  return full || "Unnamed CSO";
};

export default function AdminRemittancePage() {
  const dispatch = useDispatch();
  const { items: csos, status, error } = useSelector((state) => state.csos);

  const [quickRange, setQuickRange] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustingEntry, setAdjustingEntry] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustAction, setAdjustAction] = useState("");
  const [deletingEntry, setDeletingEntry] = useState(null);


  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCsos());
    }
  }, [status, dispatch]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => dateKey(today), [today]);
  const yesterdayKey = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 1);
    return dateKey(date);
  }, [today]);
  const thisWeekStart = useMemo(() => startOfWeek(today), [today]);
  const thisWeekEnd = useMemo(() => endOfWeek(today), [today]);

  const entries = useMemo(() => {
    if (!Array.isArray(csos) || !csos.length) return [];

    const result = [];

    csos.forEach((cso) => {
      const csoEntries = Array.isArray(cso.remittance) ? cso.remittance : [];
      if (!csoEntries.length) return;

      csoEntries.forEach((item, index) => {
        const recordedAt = item.updatedAt || item.createdAt;
        const localDate = toLocalDate(recordedAt);
        const collected = Number(item.amountCollected || item.amountRemitted || 0);
        const paid = Number(item.amountPaid || item.amountRemitted || 0);
        const balance = collected - paid;

        result.push({
          id: `${cso._id}-${index}`,
          csoId: cso._id,
          csoName: extractName(cso),
          csoPhone: cso.phone || cso.phoneNumber || "—",
          amountCollected: Number.isFinite(collected) ? collected : 0,
          amountPaid: Number.isFinite(paid) ? paid : 0,
          balance: Number.isFinite(balance) ? balance : 0,
          resolution: item.resolution || 0,
          issueResolution: item.issueResolution || "",
          remark: item.remark || "",
          recordedAt: localDate,
          dateKey: dateKey(recordedAt),
          monthKey: monthKey(recordedAt),
        });
      });
    });

    return result.sort((a, b) => {
      if (!a.recordedAt || !b.recordedAt) return 0;
      return b.recordedAt - a.recordedAt;
    });
  }, [csos]);

  const matchesQuickRange = (entry) => {
    if (!entry.recordedAt) return false;

    switch (quickRange) {
      case "today":
        return entry.dateKey === todayKey;
      case "yesterday":
        return entry.dateKey === yesterdayKey;
      case "thisWeek":
        return entry.recordedAt >= thisWeekStart && entry.recordedAt <= thisWeekEnd;
      case "custom":
        if (!customStart || !customEnd) return true;
        return (
          entry.recordedAt >= startOfDay(new Date(customStart)) &&
          entry.recordedAt <= endOfDay(new Date(customEnd))
        );
      case "all":
      default:
        return true;
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      if (csoFilter !== "all" && entry.csoId !== csoFilter) {
        return false;
      }

      if (selectedMonth && entry.monthKey !== selectedMonth) {
        return false;
      }

      if (!matchesQuickRange(entry)) {
        return false;
      }

      if (!term) return true;

      const haystack = [entry.csoName, entry.csoPhone, entry.remark]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [entries, csoFilter, selectedMonth, matchesQuickRange, searchTerm]);

  const totals = useMemo(
    () =>
      filteredEntries.reduce(
        (acc, entry) => {
          acc.count += 1;
          acc.totalCollected += entry.amountCollected;
          acc.totalPaid += entry.amountPaid;
          acc.totalBalance += entry.balance;
          return acc;
        },
        { count: 0, totalCollected: 0, totalPaid: 0, totalBalance: 0 },
      ),
    [filteredEntries],
  );

  const monthOptions = useMemo(() => {
    const keys = new Set();
    entries.forEach((entry) => {
      if (entry.monthKey) keys.add(entry.monthKey);
    });
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({ value, label: value }));
  }, [entries]);

  const csoOptions = useMemo(() => {
    return [{ value: "all", label: "All CSOs" }, ...entries.reduce((acc, entry) => {
      if (!acc.some((option) => option.value === entry.csoId)) {
        acc.push({ value: entry.csoId, label: entry.csoName });
      }
      return acc;
    }, [])];
  }, [entries]);

  const isLoading = status === "loading" || status === "idle";

  const handleAdjust = async () => {
    if (!adjustingEntry || !adjustAmount || !adjustAction) return;
    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount <= 0) return;

    await dispatch(
      adjustCsoRemittance({
        csoId: adjustingEntry.csoId,
        remittanceId: adjustingEntry.remittanceId,
        amount,
        action: adjustAction,
      }),
    );

    setAdjustingEntry(null);
    setAdjustAmount("");
    setAdjustAction("");
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    await dispatch(
      deleteCsoRemittance({
        csoId: deletingEntry.csoId,
        remittanceId: deletingEntry.remittanceId,
      }),
    );
    setDeletingEntry(null);
  };


  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Remittance overview</p>
          <h1 className="text-3xl font-semibold text-slate-900">CSO remittance</h1>
          <p className="text-sm text-slate-500">
            Verify remittance submissions, identify gaps, and reconcile collections against payments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchCsos())}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className="h-4 w-4" /> Refresh data
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remittance records</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totals.count.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Entries matching your current filters</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount collected</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalCollected)}</p>
          <p className="text-xs text-slate-500">Declared cash received by CSOs</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount remitted</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalPaid)}</p>
          <p className="text-xs text-slate-500">Cash paid into head office</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding variance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalBalance)}</p>
          <p className="text-xs text-slate-500">Difference between collected and remitted</p>
        </article>
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
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  quickRange === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {value === "thisWeek"
                  ? "This week"
                  : value === "all"
                    ? "All time"
                    : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {quickRange === "custom" ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <span className="text-xs uppercase tracking-wide text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by CSO or remark"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Users className="h-4 w-4 text-slate-400" /> CSO
              <select
                value={csoFilter}
                onChange={(event) => setCsoFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {csoOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value || "all"}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {filteredEntries.length.toLocaleString()} record{filteredEntries.length === 1 ? "" : "s"} in view
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading remittance…
            </div>
          ) : !filteredEntries.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
              No remittance entries match your filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">CSO</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-right font-semibold">Collected</th>
                  <th className="px-4 py-3 text-right font-semibold">Remitted</th>
                  <th className="px-4 py-3 text-right font-semibold">Variance</th>
                  <th className="px-4 py-3 text-right font-semibold">Manager Resolution</th>
                  <th className="px-4 py-3 text-left font-semibold">Issue</th>
                  <th className="px-4 py-3 text-center font-semibold text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {entry.recordedAt
                        ? `${entry.recordedAt.toLocaleDateString()} • ${entry.recordedAt.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{entry.csoName}</td>
                    <td className="px-4 py-3 text-slate-500">{entry.csoPhone || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(entry.amountCollected)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(entry.amountPaid)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-600">
                      {formatCurrency(entry.balance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {entry.resolution > 0 ? formatCurrency(entry.resolution) : "—"}
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
                          <span className="text-xs text-slate-400 italic">No resolution set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const parts = entry.id.split("-");
                            const cso = csos.find(c => c._id === entry.csoId);
                            const remId = cso.remittance[Number(parts[1])]?._id;
                            setAdjustingEntry({
                              csoId: entry.csoId,
                              remittanceId: remId,
                              csoName: entry.csoName
                            });
                            setAdjustAction("add");
                          }}
                          className="p-1 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                          title="Add Remittance"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const parts = entry.id.split("-");
                            const cso = csos.find(c => c._id === entry.csoId);
                            const remId = cso.remittance[Number(parts[1])]?._id;
                            setAdjustingEntry({
                              csoId: entry.csoId,
                              remittanceId: remId,
                              csoName: entry.csoName
                            });
                            setAdjustAction("subtract");
                          }}
                          className="p-1 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                          title="Subtract Remittance"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const parts = entry.id.split("-");
                            const cso = csos.find((c) => c._id === entry.csoId);
                            const remId = cso.remittance[Number(parts[1])]?._id;
                            setDeletingEntry({
                              csoId: entry.csoId,
                              remittanceId: remId,
                              csoName: entry.csoName,
                              date: entry.recordedAt,
                              amount: entry.amountPaid,
                            });
                          }}
                          className="p-1 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                          title="Delete Remittance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Adjustment Modal */}
      {adjustingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 capitalize">
                {adjustAction} Remittance
              </h3>
              <button
                onClick={() => setAdjustingEntry(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              Adjusting remittance for <span className="font-semibold text-slate-700">{adjustingEntry.csoName}</span>. 
              The amount will be {adjustAction === 'add' ? 'added to' : 'subtracted from'} the remitted total.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAdjustingEntry(null)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={!adjustAmount || Number(adjustAmount) <= 0 || (status === 'loading')}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                    adjustAction === 'add' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center mb-4 text-rose-500">
              <div className="p-3 rounded-full bg-rose-50">
                <Trash2 className="h-8 w-8" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Confirm Deletion
            </h3>
            
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete the remittance of <span className="font-semibold text-slate-700">{formatCurrency(deletingEntry.amount)}</span> for <span className="font-semibold text-slate-700">{deletingEntry.csoName}</span> recorded on {deletingEntry.date?.toLocaleDateString()}? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEntry(null)}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                No, cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={status === 'loading'}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Yes, delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


