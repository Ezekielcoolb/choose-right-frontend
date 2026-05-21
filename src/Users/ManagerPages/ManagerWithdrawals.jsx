import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchManagerWithdrawals,
  fetchManagerCsos,
} from "../../redux/slices/managerDataSlice";
import {
  Loader2,
  Eye,
  Clock3,
  Wallet,
  UserCircle2,
  ArrowLeftRight,
  Search,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700",
  },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatAmount(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function WithdrawalDetailsModal({ request, onClose }) {
  if (!request) return null;

  const statusInfo = statusConfig[request.status] || statusConfig.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Withdrawal Details
            </h2>
            <p className="text-xs text-slate-500">
              {formatDate(request.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </header>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <UserCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Customer
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {request.customerId?.firstName} {request.customerId?.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {request.customerId?.phone || "No phone"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {request.customerId?.address || "No address"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Plan
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {request.planId?.planName || "Unknown plan"}
              </p>
              <p className="text-xs text-slate-500">
                Daily Contribution:{" "}
                {formatAmount(request.planId?.dailyContribution || 0)}
              </p>
              <p className="text-xs text-slate-500">
                Available Balance:{" "}
                {formatAmount(request.planId?.availableBalance || 0)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Request Summary
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Requested Amount
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {formatAmount(request.amount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Requested On
                </p>
                <p className="text-xs text-slate-600">
                  {formatDate(request.createdAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Preferred Date
                </p>
                <p className="text-xs text-slate-600">
                  {formatDate(request.recordedAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">
                  CSO
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {request.csoId?.firstName} {request.csoId?.lastName}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Narration
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {request.narration || "No narration provided"}
              </p>
            </div>

            {request.status !== "pending" ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-500">Processed By</p>
                  <p className="text-sm text-slate-700">
                    {request.processedBy || "—"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Processed At</p>
                  <p>{formatDate(request.processedAt)}</p>
                </div>
                {request.responseNote ? (
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-500">
                      Response Note
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {request.responseNote}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function ManagerWithdrawals() {
  const dispatch = useDispatch();
  const { withdrawals, csos } = useSelector((state) => state.managerData);
  const {
    data: withdrawalData,
    status,
    error,
  } = withdrawals;
  const { data: csoList } = csos;

  const items = withdrawalData?.items || [];
  const total = withdrawalData?.total || 0;
  const page = withdrawalData?.page || 1;
  const pages = withdrawalData?.pages || 0;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Date Filter States
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [specificMonth, setSpecificMonth] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  useEffect(() => {
    dispatch(
      fetchManagerWithdrawals({ status: statusFilter, page: 1, limit: pageSize }),
    );
    dispatch(fetchManagerCsos());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, statusFilter]);

  const isLoading = status === "loading";

  const fetchRequests = (overrides = {}) => {
    dispatch(
      fetchManagerWithdrawals({
        status: overrides.status || statusFilter,
        csoId: overrides.csoId !== undefined ? overrides.csoId : csoFilter,
        search: overrides.search !== undefined ? overrides.search : searchTerm,
        dateRange:
          overrides.dateRange !== undefined ? overrides.dateRange : dateRange,
        startDate:
          overrides.startDate !== undefined ? overrides.startDate : startDate,
        endDate: overrides.endDate !== undefined ? overrides.endDate : endDate,
        specificDate:
          overrides.specificDate !== undefined
            ? overrides.specificDate
            : specificDate,
        specificMonth:
          overrides.specificMonth !== undefined
            ? overrides.specificMonth
            : specificMonth,
        page: overrides.page || page,
        limit: overrides.limit || pageSize,
      }),
    );
  };

  const handleDateRangeChange = (range, additionalOverrides = {}) => {
    setDateRange(range);
    fetchRequests({ dateRange: range, page: 1, ...additionalOverrides });
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      setSpecificDate("");
      setSpecificMonth("");
      handleDateRangeChange("custom", {
        startDate,
        endDate,
        specificDate: "",
        specificMonth: "",
      });
    }
  };

  const clearDateFilters = () => {
    setDateRange("all");
    setStartDate("");
    setEndDate("");
    setSpecificDate("");
    setSpecificMonth("");
    fetchRequests({
      dateRange: "all",
      startDate: "",
      endDate: "",
      specificDate: "",
      specificMonth: "",
      page: 1,
    });
  };

  const handleFilterChange = (filter) => {
    if (filter === statusFilter && status === "succeeded") return;
    setStatusFilter(filter);
    fetchRequests({ status: filter, page: 1 });
  };

  const handleCsoFilterChange = (csoId) => {
    setCsoFilter(csoId);
    fetchRequests({ csoId, page: 1 });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchRequests({ search: value, page: 1 });
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  const handlePrevPage = () => {
    if (page > 1) fetchRequests({ page: page - 1 });
  };

  const handleNextPage = () => {
    if (page < pages) fetchRequests({ page: page + 1 });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    fetchRequests({ limit: newSize, page: 1 });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Withdrawal Requests
          </h1>
          <p className="text-sm text-slate-500">
            View withdrawal requests submitted by CSOs in your branch.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["pending", "approved", "rejected"].map((filter) => {
            const info = statusConfig[filter];
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? `${info.className} shadow-sm`
                    : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Clock3 className="h-4 w-4" />
                <span className="capitalize">{filter}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDateFilters(!showDateFilters)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              showDateFilters || dateRange !== "all"
                ? "bg-primary text-white shadow-md"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Date Filter</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showDateFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={handleSearch}
              className="rounded-full border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 bg-white">
            <Users className="h-4 w-4 text-slate-400" />
            <select
              value={csoFilter}
              onChange={(e) => handleCsoFilterChange(e.target.value)}
              className="text-sm bg-transparent focus:outline-none"
            >
              <option value="all">All CSOs</option>
              {csoList?.map((cso) => (
                <option key={cso._id} value={cso._id}>
                  {cso.firstName} {cso.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showDateFilters && (
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "All Time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "This Week", value: "thisWeek" },
              { label: "This Month", value: "thisMonth" },
              { label: "This Year", value: "thisYear" },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => handleDateRangeChange(range.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  dateRange === range.value
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {range.label}
              </button>
            ))}
            <button
              onClick={clearDateFilters}
              className="ml-auto text-xs font-semibold text-rose-600 hover:underline"
            >
              Clear All Date Filters
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Specific Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSpecificDate(val);
                    if (val) {
                      setSpecificMonth("");
                      setStartDate("");
                      setEndDate("");
                      handleDateRangeChange("specificDate", {
                        specificDate: val,
                        specificMonth: "",
                        startDate: "",
                        endDate: "",
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Specific Month
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="month"
                  value={specificMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSpecificMonth(val);
                    if (val) {
                      setSpecificDate("");
                      setStartDate("");
                      setEndDate("");
                      handleDateRangeChange("specificMonth", {
                        specificMonth: val,
                        specificDate: "",
                        startDate: "",
                        endDate: "",
                      });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Custom Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-4 text-sm focus:border-primary focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-4 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleCustomDateChange}
                  disabled={!startDate || !endDate}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">
          No {statusFilter} withdrawal requests found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  {statusFilter === "pending" ? "Created" : "Processed"}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Plan
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  CSO
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((request) => {
                const info =
                  statusConfig[request.status] || statusConfig.pending;
                return (
                  <tr
                    key={request._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(
                        request.status === "pending"
                          ? request.createdAt
                          : request.processedAt,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {request.customerId
                        ? `${request.customerId.firstName} ${request.customerId.lastName}`
                        : "No Customer"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {request.planId?.planName || "No Plan"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatAmount(request.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {request.csoId
                        ? `${request.csoId.firstName} ${request.csoId.lastName}`
                        : "No CSO"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        {info.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(request)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold normal-case text-slate-600">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Rows per page
              </span>
              <select
                value={pageSize}
                onChange={(event) =>
                  handlePageSizeChange(Number(event.target.value))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              {total === 0 ? (
                "No requests to display"
              ) : (
                <>
                  Showing {((page - 1) * pageSize + 1).toLocaleString()}–
                  {Math.min(page * pageSize, total).toLocaleString()} of{" "}
                  {total.toLocaleString()} request{total === 1 ? "" : "s"}
                </>
              )}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                >
                  Previous
                </button>
                <span>
                  Page {page.toLocaleString()} of {pages.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={page >= pages}
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WithdrawalDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
