import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPendingLoans, approveAdminLoan, rejectAdminLoan } from "../../../redux/slices/adminLoanSlice";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

function LoanDetailsModal({ open, plan, onClose }) {
  if (!open || !plan) return null;

  const { loanDetails } = plan;
  const guarantor = loanDetails?.guarantor || {};

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
               <p className="font-semibold">{plan.customerId?.firstName} {plan.customerId?.lastName}</p>
               <p className="text-sm text-slate-500">{plan.customerId?.phone}</p>
               <p className="text-sm text-slate-500">{plan.customerId?.address}</p>
             </div>
             <div className="space-y-1">
               <p className="text-xs font-medium uppercase text-slate-500">Plan</p>
               <p className="font-semibold">{plan.planName}</p>
               <p className="text-sm text-slate-500">Daily: ₦{plan.dailyContribution?.toLocaleString()}</p>
               <p className="text-sm text-slate-500">Request Amount: ₦{(plan.dailyContribution * 30).toLocaleString()}</p>
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
import { BASE_URL } from "../../../api/client";
...
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

export default function AdminNewLoans() {
  const dispatch = useDispatch();
  const { pendingLoans, status, mutationStatus } = useSelector((state) => state.adminLoans);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    dispatch(fetchPendingLoans());
  }, [dispatch]);

  const handleApprove = (id) => {
    if (window.confirm("Are you sure you want to approve this loan?")) {
      dispatch(approveAdminLoan(id))
        .unwrap()
        .then(() => toast.success("Loan approved"))
        .catch((err) => toast.error(err || "Failed to approve"));
    }
  };

  const handleReject = (id) => {
    if (window.confirm("Are you sure you want to reject this loan?")) {
      dispatch(rejectAdminLoan(id))
        .unwrap()
        .then(() => toast.success("Loan rejected"))
        .catch((err) => toast.error(err || "Failed to reject"));
    }
  };

  const isLoading = status === "loading";
  const isMutating = mutationStatus === "loading";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">New Loan Requests</h1>
        <button 
          onClick={() => dispatch(fetchPendingLoans())} 
          className="text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}

      {!isLoading && pendingLoans.length === 0 && (
         <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
            No pending loan requests found.
         </div>
      )}

      {!isLoading && pendingLoans.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Customer</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Plan</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-700">CSO</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingLoans.map((plan) => (
                <tr key={plan._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(plan.loanDetails?.requestDate || plan.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {plan.customerId?.firstName} {plan.customerId?.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{plan.planName}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    ₦{(plan.dailyContribution * 30).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                     {plan.csoId?.firstName} {plan.csoId?.lastName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                         onClick={() => setSelectedPlan(plan)}
                         className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                         title="View Details"
                       >
                         <Eye className="h-4 w-4" />
                       </button>
                       <button
                         onClick={() => handleApprove(plan._id)}
                         disabled={isMutating}
                         className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                         title="Approve"
                       >
                         <CheckCircle2 className="h-4 w-4" />
                       </button>
                       <button
                         onClick={() => handleReject(plan._id)}
                         disabled={isMutating}
                         className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                         title="Reject"
                       >
                         <XCircle className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LoanDetailsModal open={!!selectedPlan} plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </div>
  );
}
