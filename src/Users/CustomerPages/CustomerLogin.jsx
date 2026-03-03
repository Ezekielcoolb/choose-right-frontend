import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginCustomer, resetPassword } from "../../redux/slices/customerAuthSlice";
import { 
  User, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  Smartphone,
  Mail,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function CustomerLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPhone, setIsPhone] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token, passwordStatus, passwordError } = useSelector((state) => state.customerAuth);

  useEffect(() => {
    if (token) {
      navigate("/customer/dashboard");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const result = await dispatch(loginCustomer({ identifier, password }));
    if (loginCustomer.fulfilled.match(result)) {
      toast.success("Welcome back!");
    } else {
      toast.error(result.payload || "Login failed");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetIdentifier || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    const result = await dispatch(resetPassword({ identifier: resetIdentifier, newPassword }));
    if (resetPassword.fulfilled.match(result)) {
      toast.success("Password reset successful. Please login.");
      setIsForgotPassword(false);
      setIdentifier(resetIdentifier);
      setResetIdentifier("");
      setNewPassword("");
    } else {
      toast.error(result.payload || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans selection:bg-primary/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 p-8 md:p-10">
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-primary/10 text-primary mb-6 shadow-sm ring-1 ring-primary/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Customer Portal</h1>
            <p className="mt-3 text-slate-500 font-medium">Please enter your details to access your plans.</p>
          </header>

          <AnimatePresence mode="wait">
            {!isForgotPassword ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Identifier</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        {isPhone ? <Smartphone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                      </div>
                      <input
                        type="text"
                        placeholder={isPhone ? "Enter phone number" : "Enter email address"}
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (/[a-zA-Z]/.test(e.target.value)) setIsPhone(false);
                          else if (/^\+?[0-9]*$/.test(e.target.value)) setIsPhone(true);
                        }}
                        className="w-full h-16 bg-slate-50 border-transparent border-2 focus:border-primary focus:bg-white rounded-3xl pl-14 pr-6 text-slate-900 font-semibold transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      <button 
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-transparent border-2 focus:border-primary focus:bg-white rounded-3xl pl-14 pr-6 text-slate-900 font-semibold transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="relative w-full h-16 bg-slate-900 hover:bg-black text-white rounded-3xl font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    {status === "loading" ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Account Identifier</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter email or phone number"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-transparent border-2 focus:border-cyan-600 focus:bg-white rounded-3xl pl-14 pr-6 text-slate-900 font-semibold transition-all outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Confirm your identity to reset password</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-transparent border-2 focus:border-cyan-600 focus:bg-white rounded-3xl pl-14 pr-6 text-slate-900 font-semibold transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={passwordStatus === "loading"}
                      className="relative w-full h-16 bg-cyan-600 hover:bg-cyan-700 text-white rounded-3xl font-bold text-lg shadow-xl shadow-cyan-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden"
                    >
                      {passwordStatus === "loading" ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Reset Password</span>
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="flex items-center justify-center gap-2 h-12 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-400 font-medium">
              {!isForgotPassword ? "Need help? Contact your CSO representative." : "Securely reset your portal access."}
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
