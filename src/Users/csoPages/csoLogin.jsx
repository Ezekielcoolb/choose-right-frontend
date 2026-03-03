import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginCso, forgotPassword, resetPasswordStatus } from "../../redux/slices/csoAuthSlice";
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


const initialFormState = {
  identifier: "",
  password: "",
};

export default function CsoLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { token, status, error, passwordStatus, passwordError, passwordMessage } = useSelector(
    (state) => state.csoAuth,
  );

  const [formValues, setFormValues] = useState(initialFormState);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  const from = useMemo(() => location.state?.from?.pathname || "/cso", [location.state]);


  useEffect(() => {
    if (token && status === "succeeded") {
      navigate(from, { replace: true });
    }
  }, [token, status, navigate, from]);

  if (token && status !== "failed") {
    return <Navigate to={from} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(loginCso(formValues));
  };

  const handleForgotSubmit = (event) => {
    event.preventDefault();
    dispatch(forgotPassword({ identifier: forgotIdentifier, newPassword: forgotNewPassword }));
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotIdentifier("");
    setForgotNewPassword("");
    dispatch(resetPasswordStatus());
  };


  const showIdentifierError = touched.identifier && !formValues.identifier.trim();
  const showPasswordError = touched.password && !formValues.password.trim();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">CSO Portal</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your work ID or registered email to access your dashboard.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {error ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-600">
                Work ID or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                value={formValues.identifier}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  showIdentifierError ? "border-rose-300" : "border-slate-200"
                }`}
                placeholder="e.g. CSO-0012 or cso@email.com"
              />
              {showIdentifierError ? (
                <p className="text-xs text-rose-500">Please enter your work ID or email.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formValues.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-xl border px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    showPasswordError ? "border-rose-300" : "border-slate-200"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {showPasswordError ? <p className="text-xs text-rose-500">Password is required.</p> : null}
            </div>


            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {status === "loading" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              ) : null}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Need help? Contact your branch supervisor to reset your credentials.
        </p>
      </div>

      <Modal open={isForgotModalOpen} title="Reset Password" onClose={closeForgotModal}>
        {passwordStatus === "succeeded" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordMessage}
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
              Enter your Work ID or registered Email and a new password to reset it.
            </p>
            {passwordError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {passwordError}
              </div>
            ) : null}
            <div className="space-y-1">
              <label htmlFor="forgot-identifier" className="text-xs font-medium text-slate-600">
                Work ID or Email
              </label>
              <input
                id="forgot-identifier"
                type="text"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. CSO-0012"
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
              disabled={passwordStatus === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {passwordStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reset Password
            </button>
          </form>

        )}
      </Modal>
    </div>

  );
}
