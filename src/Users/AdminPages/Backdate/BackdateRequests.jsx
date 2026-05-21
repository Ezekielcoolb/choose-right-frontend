import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchAdminBackdateRequests, 
  processBackdateRequest 
} from "../../../redux/slices/backdateSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  FileText,
  Search,
  Filter,
  Loader2,
  Check,
  X,
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    used: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const icons = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    used: <Check className="h-3 w-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

export default function BackdateRequests() {
  const dispatch = useDispatch();
  const { requests, status, mutationStatus } = useSelector((state) => state.backdate);
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
    dispatch(fetchAdminBackdateRequests({ 
      status: filter, 
      csoId: csoFilter, 
      search: searchTerm 
    }));
  }, [dispatch, filter, csoFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleProcess = async (id, newStatus) => {
    if (newStatus === "approved" || (newStatus === "rejected" && adminNote)) {
      setProcessingId(id);
      try {
        await dispatch(processBackdateRequest({ id, status: newStatus, adminNote })).unwrap();
        toast.success(`Request ${newStatus} successfully`);
        setAdminNote("");
        setProcessingId(null);
      } catch (error) {
        toast.error(error || "Failed to process request");
        setProcessingId(null);
      }
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Backdate Requests</h1>
              <p className="text-sm text-slate-500">Review and manage CSO requests for past-dated deposits</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </form>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 bg-white w-full sm:w-auto">
                <Users className="h-4 w-4 text-slate-400 min-w-[16px]" />
                <select
                  value={csoFilter}
                  onChange={(e) => setCsoFilter(e.target.value)}
                  className="text-sm bg-transparent focus:outline-none w-full min-w-0"
                >
                  <option value="all">All CSOs</option>
                  {csos?.map((cso) => (
                    <option key={cso._id} value={cso._id}>
                      {cso.firstName} {cso.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Filters - wrapping for mobile */}
          <div className="flex flex-wrap items-center justify-start gap-2 pt-2 sm:pt-0">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex-1 sm:flex-none justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all border ${
                  filter === s 
                    ? "bg-primary text-white border-primary shadow-sm" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="grid gap-6">
          {status === "loading" ? (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400">
              <Clock className="mb-2 h-12 w-12 opacity-20" />
              <p>No requests found for this filter</p>
            </div>
          ) : (
            requests.map((request) => (
              <div 
                key={request._id} 
                className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200"
              >
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* CSO & Customer Info */}
                  <div className="p-6 md:w-1/3 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-slate-100 p-2.5 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Requested by CSO</div>
                        <div className="font-semibold text-slate-800">
                          {request.csoId?.firstName} {request.csoId?.lastName}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-slate-100 p-2.5 text-slate-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer & Plan</div>
                        <div className="font-medium text-slate-700">
                          {request.customerId?.firstName} {request.customerId?.lastName}
                        </div>
                        <div className="text-sm text-slate-500">{request.planId?.planName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Request Content */}
                  <div className="border-t md:border-t-0 md:border-l border-slate-100 p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold">
                          Proposed Date: {new Date(request.proposedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Reason</div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">"{request.reason}"</p>
                    </div>

                    {request.adminNote && (
                      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Admin Note</div>
                        <p className="text-sm text-emerald-700">{request.adminNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {request.status === "pending" && (
                    <div className="border-t md:border-t-0 md:border-l border-slate-100 p-6 md:w-1/4 bg-slate-50/50 backdrop-blur-sm space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Note / Rejection Reason</label>
                        <textarea 
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Optional for approval, required for rejection..."
                          className="w-full h-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(request._id, "approved")}
                          disabled={mutationStatus === "loading" && processingId === request._id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all disabled:opacity-50"
                        >
                          {mutationStatus === "loading" && processingId === request._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcess(request._id, "rejected")}
                          disabled={mutationStatus === "loading" && processingId === request._id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-rose-300 transition-all disabled:opacity-50"
                        >
                          {mutationStatus === "loading" && processingId === request._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 px-6 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
                  {request.processedAt && (
                    <span>Processed: {new Date(request.processedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
