import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchAdminWithdrawalRequests,
  approveAdminWithdrawalRequest,
  rejectAdminWithdrawalRequest,
  clearAdminWithdrawalState,
} from "../../../redux/slices/adminWithdrawalSlice";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Clock3,
  Wallet,
  UserCircle2,
  ArrowLeftRight,
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
            <h2 className="text-lg font-semibold text-slate-900">Withdrawal Request Details</h2>
            <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </header>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <UserCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Customer</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {request.customerId?.firstName} {request.customerId?.lastName}
              </p>
              <p className="text-xs text-slate-500">{request.customerId?.phone || "No phone"}</p>
              <p className="mt-1 text-xs text-slate-500">{request.customerId?.address || "No address"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Plan</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{request.planId?.planName || "Unknown plan"}</p>
              <p className="text-xs text-slate-500">
                Daily Contribution: {formatAmount(request.planId?.dailyContribution || 0)}
              </p>
              <p className="text-xs text-slate-500">Available Balance: {formatAmount(request.planId?.availableBalance || 0)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Request Summary</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">Requested Amount</p>
                <p className="text-base font-semibold text-slate-900">{formatAmount(request.amount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">Requested On</p>
                <p className="text-xs text-slate-600">{formatDate(request.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">Preferred Date</p>
                <p className="text-xs text-slate-600">{formatDate(request.recordedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-slate-500">CSO</p>
                <p className="text-sm font-semibold text-slate-900">
                  {request.csoId?.firstName} {request.csoId?.lastName}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-slate-500">Narration</p>
              <p className="mt-1 text-sm text-slate-700">{request.narration || "No narration provided"}</p>
            </div>

            {request.status !== "pending" ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-500">Processed By</p>
                  <p className="text-sm text-slate-700">{request.processedBy || "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Processed At</p>
                  <p>{formatDate(request.processedAt)}</p>
                </div>
                {request.responseNote ? (
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-500">Response Note</p>
                    <p className="mt-1 text-sm text-slate-700">{request.responseNote}</p>
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

export default function WithdrawalRequest() {
  const dispatch = useDispatch();
  const { items, status, statusFilter, error, mutationStatus, mutationError } = useSelector(
    (state) => state.adminWithdrawals,
  );
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminWithdrawalRequests());
    return () => {
      dispatch(clearAdminWithdrawalState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (mutationError) {
      toast.error(mutationError);
    }
  }, [mutationError]);

  const isLoading = status === "loading";
  const isMutating = mutationStatus === "loading";

  const handleFilterChange = (filter) => {
    if (filter === statusFilter && status === "succeeded") {
      return;
    }
    dispatch(fetchAdminWithdrawalRequests(filter));
  };

  const handleRefresh = () => {
    dispatch(fetchAdminWithdrawalRequests(statusFilter));
  };

  const handleApprove = (requestId) => {
    if (!window.confirm("Approve this withdrawal request?")) {
      return;
    }

    dispatch(approveAdminWithdrawalRequest(requestId))
      .unwrap()
      .then(() => {
        toast.success("Withdrawal approved");
        dispatch(fetchAdminWithdrawalRequests(statusFilter));
      })
      .catch((err) => {
        toast.error(err || "Unable to approve withdrawal");
      });
  };

  const handleReject = (requestId) => {
    const note = window.prompt("Add an optional note for the rejection:");
    if (note === null) {
      return;
    }

    dispatch(rejectAdminWithdrawalRequest({ requestId, note: note || undefined }))
      .unwrap()
      .then(() => {
        toast.success("Withdrawal rejected");
        dispatch(fetchAdminWithdrawalRequests(statusFilter));
      })
      .catch((err) => {
        toast.error(err || "Unable to reject withdrawal");
      });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawal Requests</h1>
          <p className="text-sm text-slate-500">Approve or reject withdrawal requests submitted by CSOs.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['pending', 'approved', 'rejected'].map((filter) => {
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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">
          No {statusFilter} withdrawal requests found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Plan</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">CSO</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((request) => {
                const info = statusConfig[request.status] || statusConfig.pending;
                return (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {request.customerId?.firstName} {request.customerId?.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{request.planId?.planName || "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatAmount(request.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {request.csoId?.firstName} {request.csoId?.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>
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
                        {request.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(request._id)}
                              disabled={isMutating}
                              className="rounded-lg bg-emerald-100 p-2 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(request._id)}
                              disabled={isMutating}
                              className="rounded-lg bg-rose-100 p-2 text-rose-700 transition hover:bg-rose-200 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <WithdrawalDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
    </div>
  );
}
