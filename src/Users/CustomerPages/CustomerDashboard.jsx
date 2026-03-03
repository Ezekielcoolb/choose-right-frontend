import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMyPlans } from "../../redux/slices/customerDataSlice";
import { 
  Loader2, 
  Plus, 
  ArrowUpRight, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  PiggyBank,
  LogOut,
  User as UserIcon,
  Lock,
  X,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { logoutCustomer, changePassword } from "../../redux/slices/customerAuthSlice";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { plans } = useSelector((state) => state.customerData);
  const { customer, passwordStatus } = useSelector((state) => state.customerAuth);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    dispatch(fetchMyPlans());
  }, [dispatch]);

  const savingsPlans = plans.data.filter(p => p.planType !== 'loan');
  const loanPlans = plans.data.filter(p => p.planType === 'loan');

  const savingsStats = savingsPlans.reduce((acc, p) => {
    acc.deposited += (p.totalDeposited || 0);
    acc.withdrawn += (p.totalWithdrawn || 0);
    acc.balance += (p.availableBalance || 0);
    return acc;
  }, { deposited: 0, withdrawn: 0, balance: 0 });

  const loanStats = loanPlans.reduce((acc, p) => {
    const amount = p.loanDetails?.amount || p.lastLoanRequestAmount || 0;
    const maintenanceFee = p.totalFees || 0;
    const paid = Math.max(0, (p.totalDeposited || 0) - maintenanceFee);
    const balance = Math.max(0, amount - paid);
    acc.amount += amount;
    acc.balance += balance;
    return acc;
  }, { amount: 0, balance: 0 });

  const handleLogout = () => {
    dispatch(logoutCustomer());
    navigate("/customer/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    const result = await dispatch(changePassword({ currentPassword, newPassword }));
    if (changePassword.fulfilled.match(result)) {
      toast.success("Password updated successfully");
      setIsChangePasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.payload || "Failed to update password");
    }
  };

  if (plans.status === "loading" && !plans.data.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Header / Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
              <PieChart className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all shadow-lg"
            >
              <Lock className="w-3.5 h-3.5" />
              Security
            </button>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{customer?.firstName} {customer?.lastName}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer?.phone}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {/* Welcome Section */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {customer?.firstName || "Customer"}</h1>
          <p className="text-slate-500 font-medium mt-1">Here is a summary of your financial health.</p>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-10">
          <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PiggyBank className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Deposited</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(plans.summary?.totalDeposited)}</h2>
          </article>

          <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Savings Balance</p>
            <h2 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(savingsStats.balance)}</h2>
          </article>

          <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6 rotate-45" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Withdrawal</p>
            <h2 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(savingsStats.withdrawn)}</h2>
          </article>

           <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserIcon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Plans</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{plans.summary?.activePlans || 0}</h2>
          </article>

          <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Loan Amount</p>
            <h2 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(loanStats.amount)}</h2>
          </article>

          <article className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Loan Balance</p>
            <h2 className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(loanStats.balance)}</h2>
          </article>

         

          <article className="bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:scale-150 transition-transform" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Records</p>
            <h2 className="text-2xl font-bold text-white mt-1 relative z-10">{plans.summary?.totalPlans || 0}</h2>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-white/50 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All time activity
            </div>
          </article>
        </section>

        {/* Plans Listing */}
        {/* Plans Listing */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
          {/* Savings Plans */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-500" />
                Savings Plans
              </h3>
            </div>

            {savingsPlans.length === 0 ? (
              <div className="bg-white rounded-[40px] border border-dashed border-slate-200 py-10 text-center">
                <p className="text-slate-400 font-semibold text-lg">No active savings plans.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {savingsPlans.map((plan, idx) => (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/customer/plans/${plan._id}`)}
                    className="bg-slate-900 rounded-[40px] p-8 shadow-xl border border-slate-800 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {plan.planType}
                      </span>
                      <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>

                    <h4 className="text-2xl font-bold text-white mb-2 tracking-tight line-clamp-1">{plan.planName}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-6">ID: {plan._id.slice(-8).toUpperCase()}</p>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deposited</p>
                        <p className="text-base font-bold text-white">{formatCurrency(plan.totalDeposited)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Maint. Fee</p>
                        <p className="text-base font-bold text-white">{formatCurrency(plan.totalFees)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Withdrawn</p>
                        <p className="text-base font-bold text-white">{formatCurrency(plan.totalWithdrawn)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Balance</p>
                        <p className="text-base font-bold text-emerald-400">{formatCurrency(plan.availableBalance)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Loan Plans */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                Loan Plans
              </h3>
            </div>

            {loanPlans.length === 0 ? (
              <div className="bg-white rounded-[40px] border border-dashed border-slate-200 py-10 text-center">
                <p className="text-slate-400 font-semibold text-lg">No active loan plans.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {loanPlans.map((plan, idx) => {
                  const loanAmount = plan.loanDetails?.amount || plan.lastLoanRequestAmount || 0;
                  const maintenanceFee = plan.totalFees || 0;
                  const amountPaid = Math.max(0, (plan.totalDeposited || 0) - maintenanceFee);
                  const loanBalance = Math.max(0, loanAmount - amountPaid);

                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/customer/plans/${plan._id}`)}
                      className="bg-slate-900 rounded-[40px] p-8 shadow-xl border border-slate-800 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {plan.planType}
                        </span>
                        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>

                      <h4 className="text-2xl font-bold text-white mb-2 tracking-tight line-clamp-1">{plan.planName}</h4>
                      <p className="text-sm font-medium text-slate-500 mb-6">ID: {plan._id.slice(-8).toUpperCase()}</p>

                      <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-slate-800">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Loan Amount</p>
                          <p className="text-base font-bold text-white">{formatCurrency(loanAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Maint. Fee</p>
                          <p className="text-base font-bold text-white">{formatCurrency(maintenanceFee)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Amount Paid</p>
                          <p className="text-base font-bold text-emerald-400">{formatCurrency(amountPaid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Loan Balance</p>
                          <p className="text-base font-bold text-rose-400">{formatCurrency(loanBalance)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isChangePasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsChangePasswordModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Security Settings</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update account password</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </header>

              <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-transparent border-2 focus:border-primary focus:bg-white rounded-2xl pl-12 pr-6 text-slate-900 font-semibold transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-transparent border-2 focus:border-primary focus:bg-white rounded-2xl pl-12 pr-6 text-slate-900 font-semibold transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-transparent border-2 focus:border-primary focus:bg-white rounded-2xl pl-12 pr-6 text-slate-900 font-semibold transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordStatus === "loading"}
                  className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {passwordStatus === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
