import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { fetchMaintenanceFees } from "../../redux/slices/adminReportSlice";
import { fetchCsos } from "../../redux/slices/csoSlice";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Maintenance() {
  const dispatch = useDispatch();
  const { maintenanceFees } = useSelector((state) => state.adminReport);
  const csos = useSelector((state) => state.csos);

  const [filters, setFilters] = useState({
    timeframe: "month",
    specificMonth: "",
    csoId: "",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    dispatch(fetchCsos());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMaintenanceFees(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to page 1 on filter change
      // If setting a timeframe, clear specificMonth, and vice-versa
      ...(name === "timeframe" && value !== "" ? { specificMonth: "" } : {}),
      ...(name === "specificMonth" && value !== "" ? { timeframe: "" } : {}),
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const statsCards = [
    {
      label: "Maintenance Fees",
      value: formatCurrency(maintenanceFees.totals.totalMaintenance),
      icon: PiggyBank,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Loan Fees",
      value: formatCurrency(maintenanceFees.totals.totalLoanFees),
      icon: CreditCard,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
    },
    {
      label: "Grand Total",
      value: formatCurrency(maintenanceFees.totals.grandTotal),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/5",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Analysis Report</h1>
          <p className="text-sm text-slate-500">Comprehensive overview of collections and service fees</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60 sticky top-4 z-10 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            value={filters.timeframe}
            onChange={(e) => handleFilterChange("timeframe", e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="">Specific Month</option>
          </select>
        </div>

        {!filters.timeframe && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              value={filters.specificMonth}
              onChange={(e) => handleFilterChange("specificMonth", e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 min-w-[220px] focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Users className="h-4 w-4 text-slate-400" />
          <select
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            value={filters.csoId}
            onChange={(e) => handleFilterChange("csoId", e.target.value)}
          >
            <option value="">All CSOs in Charge</option>
            {(csos.items || []).map((cso) => (
              <option key={cso._id} value={cso._id}>
                {cso.firstName} {cso.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statsCards.map((card, idx) => (
          <div key={idx} className="group rounded-3xl p-6 bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${card.bg} ${card.color} mb-5 group-hover:scale-110 transition-transform`}>
              <card.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-black mt-2 text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Entries Table */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5">Customer Profile</th>
                <th className="px-8 py-5">Fee Specification</th>
                <th className="px-8 py-5">Classification</th>
                <th className="px-8 py-5">Fee Amount</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right">CSO Responsible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceFees.status === "loading" ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="font-bold text-slate-400">Fetching latest fee records...</p>
                    </div>
                  </td>
                </tr>
              ) : maintenanceFees.entries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 rounded-full bg-slate-50 text-slate-300">
                        <Filter className="h-8 w-8" />
                      </div>
                      <p className="font-bold text-slate-400">No records match your filters</p>
                      <button 
                        onClick={() => setFilters({ timeframe: "month", specificMonth: "", csoId: "", page: 1, limit: 20 })}
                        className="text-primary text-sm font-bold hover:underline mt-2"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                maintenanceFees.entries.map((entry) => (
                  <tr key={entry._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {entry.customerId?.firstName?.[0]}{entry.customerId?.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {entry.customerId?.firstName} {entry.customerId?.lastName}
                          </div>
                          <div className="text-xs font-semibold text-slate-400">{entry.customerId?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-700">{entry.planId?.planName}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase">{entry.planId?.planType} plan</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-tighter ${
                        entry.narration === "Loan Maintenance Fee" 
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {entry.narration}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-lg text-slate-900">{formatCurrency(entry.amount)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-500">{formatDate(entry.recordedAt)}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-bold text-slate-800">
                        {entry.csoId?.firstName} {entry.csoId?.lastName}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {entry.csoId?.branchName || "Main Branch"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 px-8 py-6">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Displaying <span className="text-slate-900">{(filters.page - 1) * filters.limit + 1}</span> - <span className="text-slate-900">
              {Math.min(filters.page * filters.limit, maintenanceFees.pagination.total)}
            </span> of <span className="text-slate-900">{maintenanceFees.pagination.total}</span> records
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-sm font-black text-slate-900 bg-white border border-slate-200 h-11 px-4 flex items-center rounded-2xl shadow-sm">
              Page {filters.page} of {maintenanceFees.pagination.pages || 1}
            </div>
            <button
              disabled={filters.page >= (maintenanceFees.pagination.pages || 1)}
              onClick={() => handlePageChange(filters.page + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
