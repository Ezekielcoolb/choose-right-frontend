import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminContributionUpdates,
  processAdminContributionUpdate,
} from "../../../redux/slices/contributionUpdateSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  TrendingUp,
  Search,
  Loader2,
  Check,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const icons = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || ""}`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

export default function ContributionUpdates() {
  const dispatch = useDispatch();
  const { requests, status, mutationStatus } = useSelector(
    (state) => state.contributionUpdate
  );
  const { items: csos } = useSelector((state) => state.csos);

  const [filter, setFilter] = useState("pending");
  const [csoFilter, setCsoFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    dispatch(fetchCsos());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchAdminContributionUpdates({
        status: filter,
        csoId: csoFilter,
        search: searchTerm,
      })
    );
  }, [dispatch, filter, csoFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleProcess = async (id, newStatus) => {
    if (newStatus === "approved" || (newStatus === "rejected" && adminNote)) {
      setProcessingId(id);
      try {
        await dispatch(
          processAdminContributionUpdate({ requestId: id, status: newStatus, adminNote })
        ).unwrap();
        toast.success(
          newStatus === "approved"
            ? "Contribution update approved. Daily amount updated."
            : "Contribution update request rejected."
        );
        setProcessingId(null);
        setAdminNote("");
        dispatch(
          fetchAdminContributionUpdates({
            status: filter,
            csoId: csoFilter,
            search: searchTerm,
          })
        );
      } catch (err) {
        toast.error(err || "Failed to process request");
        setProcessingId(null);
      }
    } else if (newStatus === "rejected" && !adminNote) {
      toast.error("Please provide a rejection reason in the admin note field.");
    }
  };

  const isLoading = status === "loading";
  const filterOptions = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Contribution Update Requests
          </h1>
          <p className="text-sm text-slate-500">
            Review and approve CSO requests to update daily contribution amounts.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Users className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={csoFilter}
            onChange={(e) => setCsoFilter(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All CSOs</option>
            {(csos || []).map((cso) => (
              <option key={cso._id} value={cso._id}>
                {cso.firstName} {cso.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === option.value
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !requests.length ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <TrendingUp className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            No contribution update requests found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isProcessing =
              processingId === request._id && mutationStatus === "loading";
            const isPending = request.status === "pending";
            const customerName = request.customerId
              ? `${request.customerId.firstName} ${request.customerId.lastName}`
              : "Unknown Customer";
            const csoName = request.csoId
              ? `${request.csoId.firstName} ${request.csoId.lastName}`
              : "Unknown CSO";
            const planName = request.planId?.planName || "—";
            const currentAmount = request.planId?.dailyContribution;

            return (
              <div
                key={request._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {customerName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      CSO: {csoName}
                    </p>
                    <p className="text-xs text-slate-500">Plan: {planName}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {currentAmount != null && (
                        <span className="text-xs text-slate-500">
                          Current:{" "}
                          <span className="font-medium text-slate-700">
                            {formatCurrency(currentAmount)}
                          </span>
                        </span>
                      )}
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Proposed: {formatCurrency(request.proposedAmount)}
                      </span>
                    </div>
                    {request.adminNote && (
                      <p className="mt-1 text-xs text-slate-500 italic">
                        Note: {request.adminNote}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Submitted:{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-64">
                      <textarea
                        placeholder="Admin note (required for rejection)…"
                        rows={2}
                        value={processingId === request._id ? adminNote : ""}
                        onChange={(e) => {
                          setProcessingId(request._id);
                          setAdminNote(e.target.value);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(request._id, "approved")}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcess(request._id, "rejected")}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isPending && request.processedAt && (
                  <p className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    Processed:{" "}
                    {new Date(request.processedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
