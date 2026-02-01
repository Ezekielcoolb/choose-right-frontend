import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CalendarDays, CalendarRange, RefreshCw, Search, Users } from "lucide-react";

import { fetchCsos } from "../../../redux/slices/csoSlice";

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
                  <th className="px-4 py-3 text-left font-semibold">Remark</th>
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
                    <td className="px-4 py-3 text-slate-500">{entry.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

