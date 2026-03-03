import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Lock, ShieldCheck, UserCircle } from "lucide-react";
import { changeManagerPassword } from "../../redux/slices/managerAuthSlice";

export default function ManagerSettingsPage() {
  const dispatch = useDispatch();
  const { manager } = useSelector((state) => state.managerAuth);
  
  const [passwordForm, setPasswordForm] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
  });
  const [formStatus, setFormStatus] = useState("idle"); // idle, loading, success, error
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
      setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
      // Reset error when user types
      if (formStatus === "error") {
          setFormStatus("idle");
          setFormError("");
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setFormError("");
      setFormStatus("loading");

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setFormError("New passwords do not match.");
          setFormStatus("error");
          return;
      }

      if (passwordForm.newPassword.length < 6) {
          setFormError("Password must be at least 6 characters.");
          setFormStatus("error");
          return;
      }

      try {
           await dispatch(changeManagerPassword({
               currentPassword: passwordForm.currentPassword,
               newPassword: passwordForm.newPassword
           })).unwrap();
           
           setFormStatus("success");
           setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
           
           // Clear success message after 3 seconds
           setTimeout(() => setFormStatus("idle"), 3000);
      } catch (err) {
          setFormError(err || "Failed to update password.");
          setFormStatus("error");
      }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">
            Manage your account preferences and security.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <section className="col-span-1 h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
             <div className="flex flex-col items-center text-center">
                 <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCircle className="h-10 w-10" />
                 </div>
                 <h2 className="text-lg font-bold text-slate-900">
                    {manager?.firstName} {manager?.lastName}
                 </h2>
                 <p className="text-sm text-slate-500">{manager?.email}</p>
                 <div className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {manager?.branchId?.name || "Branch Manager"}
                 </div>
             </div>
             <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Account Details</h3>
                <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-slate-500">Role</dt>
                        <dd className="font-medium text-slate-900 capitalize">{manager?.role || "Manager"}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="font-medium text-slate-900">{manager?.phone || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-500">Joined</dt>
                        <dd className="font-medium text-slate-900">
                            {manager?.createdAt ? new Date(manager.createdAt).toLocaleDateString() : "—"}
                        </dd>
                    </div>
                </dl>
             </div>
          </section>

          {/* Security Form */}
          <section className="col-span-1 md:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                     <Lock className="h-5 w-5" />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-slate-900">Security</h2>
                     <p className="text-sm text-slate-500">Update your login password.</p>
                 </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                 <div>
                     <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                     <input 
                       type="password" 
                       name="currentPassword"
                       value={passwordForm.currentPassword}
                       onChange={handleChange}
                       required
                       className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                     />
                 </div>
                 <div>
                     <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                     <input 
                       type="password" 
                       name="newPassword"
                       value={passwordForm.newPassword}
                       onChange={handleChange}
                       required
                       minLength={6}
                       className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                     />
                 </div>
                 <div>
                     <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
                     <input 
                       type="password" 
                       name="confirmPassword"
                       value={passwordForm.confirmPassword}
                       onChange={handleChange}
                       required
                       minLength={6}
                       className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                     />
                 </div>

                 {formStatus === "error" && (
                     <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                         {formError}
                     </div>
                 )}

                 {formStatus === "success" && (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                          <ShieldCheck className="h-4 w-4" /> Password updated successfully.
                      </div>
                 )}

                 <div className="pt-2">
                     <button
                       type="submit"
                       disabled={formStatus === "loading" || formStatus === "success"}
                       className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         {formStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         Update Password
                     </button>
                 </div>
             </form>
          </section>
      </div>
    </div>
  );
}
