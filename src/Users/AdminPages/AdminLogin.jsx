import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { loginAdmin, fetchAdminProfile } from "../../redux/slices/adminAuthSlice.jsx";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, status, error } = useSelector((state) => state.adminAuth);
  
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token && status === "succeeded") {
      dispatch(fetchAdminProfile())
        .unwrap()
        .then(() => {
          const redirectTo = location.state?.from || "/admin";
          navigate(redirectTo, { replace: true });
        })
        .catch(() => {
          navigate("/admin", { replace: true });
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

    dispatch(loginAdmin({ email, password }))
      .unwrap()
      .then(() => {
        toast.success("Admin logged in successfully");
      })
      .catch((err) => {
        toast.error(err || "Unable to login");
      });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans">
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-slate-100">
          <div className="flex flex-col justify-center">
            <div className="mb-10 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-slate-900 p-3 text-white">
                  <ShieldCheck className="h-8 w-8" />
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
                Admin Access
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">Sign in to Admin Panel</h2>
              <p className="text-sm text-slate-500">
                Only authorized administrators can access this section.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                  placeholder="admin@hichooserightnig.ent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" university className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formValues.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
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
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-slate-900/20"
              >
                {status === "loading" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authorizing…</span>
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 space-y-4">
              {/* <p>
                Need to register? <Link to="/admin/signup" className="text-slate-900 font-semibold hover:underline">New Admin Registration</Link>
              </p> */}
              <p>
                For security, logout after each session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
