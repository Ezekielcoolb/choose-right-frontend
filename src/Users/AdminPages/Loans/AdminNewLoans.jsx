import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchPendingLoans, 
  approveAdminLoan, 
  rejectAdminLoan, 
  approveMultipleLoans, 
  rejectMultipleLoans,
  clearAdminLoanState 
} from "../../../redux/slices/adminLoanSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare,
  Square,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

function LoanDetailsModal({ open, plan, onClose }) {
  if (!open || !plan) return null;

  const loanDetails = plan.loanRequest || plan.loanDetails || {};
  const guarantor = loanDetails?.guarantor || {};

  const BASE_URL = "https://api.hichooseright.com"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Loan Request Details</h2>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
             <span className="sr-only">Close</span>
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6">
           <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-1">
               <p className="text-xs font-medium uppercase text-slate-500">Customer</p>
               <p className="font-semibold">{plan.customerId ? `${plan.customerId.firstName} ${plan.customerId.lastName}` : "No Customer"}</p>
               <p className="text-sm text-slate-500">{plan.customerId?.phone}</p>
               <p className="text-sm text-slate-500">{plan.customerId?.address}</p>
             </div>
             <div className="space-y-1">
               <p className="text-xs font-medium uppercase text-slate-500">Plan</p>
               <p className="font-semibold">{plan.planName}</p>
               <p className="text-sm text-slate-500">Daily: ₦{plan.dailyContribution?.toLocaleString()}</p>
               <p className="text-sm text-slate-500">Request Amount: ₦{(loanDetails.amount || plan.dailyContribution * 30).toLocaleString()}</p>
             </div>
           </div>

           <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-slate-900">Guarantor Information</h3>
              <div className="grid gap-3 text-sm">
                 <p><span className="text-slate-500">Name:</span> {guarantor.name}</p>
                 <p><span className="text-slate-500">Phone:</span> {guarantor.phone}</p>
                 <p><span className="text-slate-500">Address:</span> {guarantor.address}</p>
                 <p><span className="text-slate-500">Relationship:</span> {guarantor.relationship}</p>
              </div>
           </div>

           <div>
             <h3 className="mb-3 font-semibold text-slate-900">Customer Signature</h3>
             {loanDetails?.customerSignature ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                   <img src={`${BASE_URL}${loanDetails.customerSignature}`} alt="Customer Signature" className="h-40 object-contain mx-auto" />
                </div>
             ) : (
                <p className="text-sm italic text-slate-500">No signature provided</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AdminNewLoans() {
  const dispatch = useDispatch();
  const { pendingLoans, status, total, page, pages, mutationStatus } = useSelector((state) => state.adminLoans);
  const { items: csos } = useSelector((state) => state.csos);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [csoFilter, setCsoFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    dispatch(fetchPendingLoans({ 
      search: debouncedSearch, 
      csoId: csoFilter, 
      page: 1, 
      limit: pageSize 
    }));
  }, [dispatch, debouncedSearch, csoFilter, pageSize]);

  // Fetch loans handler (for manual refresh)
  const fetchLoans = useCallback(() => {
    dispatch(fetchPendingLoans({ 
      search: debouncedSearch, 
      csoId: csoFilter, 
      page, 
      limit: pageSize 
    }));
  }, [dispatch, debouncedSearch, csoFilter, page, pageSize]);


  useEffect(() => {
    dispatch(fetchCsos());
    return () => {
      dispatch(clearAdminLoanState());
    };
  }, [dispatch]);

  // Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingLoans.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingLoans.map(p => p._id));
    }
  };

  // Bulk Handlers
  const handleBulkApprove = () => {
    if (window.confirm(`Approve ${selectedIds.length} selected loans?`)) {
      dispatch(approveMultipleLoans(selectedIds))
        .unwrap()
        .then((res) => {
          toast.success(res.message);
          setSelectedIds([]);
          fetchLoans();
        })
        .catch((err) => toast.error(err));
    }
  };

  const handleBulkReject = () => {
    const note = window.prompt(`Add an optional note for rejecting ${selectedIds.length} loans:`);
    if (note !== null) {
      dispatch(rejectMultipleLoans({ planIds: selectedIds, note }))
        .unwrap()
        .then((res) => {
          toast.success(res.message);
          setSelectedIds([]);
          fetchLoans();
        })
        .catch((err) => toast.error(err));
    }
  };

  // Single Action Handlers
  const handleApprove = (id) => {
    if (window.confirm("Approve this loan request?")) {
      dispatch(approveAdminLoan(id))
        .unwrap()
        .then(() => {
          toast.success("Loan approved");
          fetchLoans();
        })
        .catch((err) => toast.error(err));
    }
  };

  const handleReject = (id) => {
    const note = window.prompt("Add an optional note for the rejection:");
    if (note !== null) {
      dispatch(rejectAdminLoan(id))
        .unwrap()
        .then(() => {
          toast.success("Loan rejected");
          fetchLoans();
        })
        .catch((err) => toast.error(err));
    }
  };

  // Pagination Handlers
  const handlePrev = () => {
    if (page > 1) {
      dispatch(fetchPendingLoans({ search: searchTerm, csoId: csoFilter, page: page - 1, limit: pageSize }));
    }
  };

  const handleNext = () => {
    if (page < pages) {
      dispatch(fetchPendingLoans({ search: searchTerm, csoId: csoFilter, page: page + 1, limit: pageSize }));
    }
  };

  const isLoading = status === "loading";
  const isMutating = mutationStatus === "loading";

  return (
    <div className="relative min-h-screen space-y-6 pb-24 p-6 bg-slate-50/30">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Loan Requests</h1>
          <p className="text-sm text-slate-500">Manage and process incoming loan applications.</p>
        </div>
        <button 
          onClick={fetchLoans}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-4 lg:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={csoFilter}
            onChange={(e) => setCsoFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border-0 py-2.5 pl-10 pr-10 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <option value="all">All CSOs</option>
            {csos.map((cso) => (
              <option key={cso._id} value={cso._id}>
                {cso.firstName} {cso.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-slate-900/95 px-6 py-3 shadow-2xl backdrop-blur ring-1 ring-white/10">
          <span className="text-sm font-medium text-white">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Selected
            </button>
            <button
              onClick={handleBulkReject}
              disabled={isMutating}
              className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      {isLoading && pendingLoans.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-slate-200 py-16">
          <div className="rounded-full bg-slate-50 p-4">
             <Filter className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No loan requests found</h3>
          <p className="mt-1 text-sm text-slate-500 text-center max-w-xs">
            Try adjusting your filters or search term to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 px-4 py-4">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary transition-colors">
                      {selectedIds.length === pendingLoans.length && pendingLoans.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-4 font-semibold text-slate-900">Date Requested</th>
                  <th className="px-4 py-4 font-semibold text-slate-900">Customer</th>
                  <th className="px-4 py-4 font-semibold text-slate-900">Plan Name</th>
                  <th className="px-4 py-4 font-semibold text-slate-900">Requested Amount</th>
                  <th className="px-4 py-4 font-semibold text-slate-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingLoans.map((plan) => {
                  const isSelected = selectedIds.includes(plan._id);
                  const loanInfo = plan.loanRequest || plan.loanDetails || {};
                  
                  return (
                    <tr key={plan._id} className={`transition-colors hover:bg-slate-50/80 ${isSelected ? "bg-primary/5 shadow-[inset_4px_0_0] shadow-primary" : ""}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(plan._id)} className="text-slate-400 hover:text-primary transition-colors">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        {new Date(loanInfo.requestDate || plan.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {plan.customerId ? `${plan.customerId.firstName} ${plan.customerId.lastName}` : "No Customer"}
                          </span>
                          <span className="text-xs text-slate-500">{plan.customerId?.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                           <span className="text-slate-900 font-medium">{plan.planName}</span>
                           <span className="text-xs text-slate-500">{plan.csoId ? `CSO: ${plan.csoId.firstName} ${plan.csoId.lastName}` : "No CSO"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          ₦{(loanInfo.amount || plan.dailyContribution * 30).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button
                             onClick={() => setSelectedPlan(plan)}
                             className="group flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
                             title="View Details"
                           >
                             <Eye className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => handleApprove(plan._id)}
                             disabled={isMutating}
                             className="flex items-center justify-center rounded-lg bg-emerald-100 p-2 text-emerald-700 transition-all hover:bg-emerald-200 disabled:opacity-50"
                             title="Quick Approve"
                           >
                             <CheckCircle2 className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => handleReject(plan._id)}
                             disabled={isMutating}
                             className="flex items-center justify-center rounded-lg bg-rose-100 p-2 text-rose-700 transition-all hover:bg-rose-200 disabled:opacity-50"
                             title="Quick Reject"
                           >
                             <XCircle className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-sm font-medium text-slate-600">
                {total === 0 ? "No results" : `Showing ${((page - 1) * pageSize + 1).toLocaleString()} to ${Math.min(page * pageSize, total).toLocaleString()} of ${total.toLocaleString()}`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-semibold text-slate-900">
                  {page} <span className="text-slate-400">/</span> {pages}
                </div>
                <button
                  onClick={handleNext}
                  disabled={page >= pages || isLoading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoanDetailsModal open={!!selectedPlan} plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </div>
  );
}

