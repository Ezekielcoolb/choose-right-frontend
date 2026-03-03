import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loginManager, fetchManagerProfile, forgotPassword, resetPasswordStatus } from "../../redux/slices/managerAuthSlice.jsx";
import { resetManagerData } from "../../redux/slices/managerDataSlice.jsx";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, X, Loader2 } from "lucide-react";

function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function ManagerLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    token, status, error, 
    forgotPasswordStatus, forgotPasswordError, forgotPasswordMessage 
  } = useSelector((state) => state.managerAuth);
  
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  useEffect(() => {
    if (token && status === "succeeded") {
      dispatch(fetchManagerProfile())
        .unwrap()
        .then(() => {
          const redirectTo = location.state?.from || "/manager";
          navigate(redirectTo, { replace: true });
        })
        .catch(() => {
          navigate("/manager", { replace: true });
        });
    }
  }, [token, status, navigate, location.state, dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const email = formValues.email.trim().toLowerCase();
    const password = formValues.password.trim();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    dispatch(resetManagerData());
    dispatch(loginManager({ email, password }))
      .unwrap()
      .then(() => {
        toast.success("Logged in successfully");
      })
      .catch((err) => {
        toast.error(err || "Unable to login");
      });
  };

  const handleForgotSubmit = (event) => {
    event.preventDefault();
    dispatch(forgotPassword({ email: forgotEmail, newPassword: forgotNewPassword }));
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotEmail("");
    setForgotNewPassword("");
    dispatch(resetPasswordStatus());
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900 font-sans">
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-100">
          <div className="flex flex-col justify-center">
            <div className="mb-10 space-y-2 text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Manager access
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">Sign in to your branch dashboard</h2>
              <p className="text-sm text-slate-500">
                Managers authenticate with their registered email and password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="manager@chooseright.ng"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formValues.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-primary/20"
              >
                {status === "loading" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500">
              <p>
                For security, logout after each session. Need admin support? <a href="mailto:support@chooseright.ng" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">Contact us</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={isForgotModalOpen} title="Reset Password" onClose={closeForgotModal}>
        {forgotPasswordStatus === "succeeded" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {forgotPasswordMessage}
            </div>
            <button
              type="button"
              onClick={closeForgotModal}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">
              Enter your registered email and a new password to reset it.
            </p>
            {forgotPasswordError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {forgotPasswordError}
              </div>
            ) : null}
            <div className="space-y-1">
              <label htmlFor="forgot-email" className="text-xs font-medium text-slate-600">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="manager@chooseright.ng"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="forgot-new-password" className="text-xs font-medium text-slate-600">
                New Password
              </label>
              <div className="relative">
                <input
                  id="forgot-new-password"
                  type={showForgotNewPassword ? "text" : "password"}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showForgotNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={forgotPasswordStatus === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {forgotPasswordStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reset Password
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
