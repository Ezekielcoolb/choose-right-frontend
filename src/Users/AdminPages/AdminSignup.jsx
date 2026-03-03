import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { signupAdmin } from "../../redux/slices/adminAuthSlice.jsx";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, UserPlus, AlertTriangle } from "lucide-react";

export default function AdminSignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.adminAuth);
  
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (formValues.password !== formValues.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formValues.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
    }

    const adminData = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim().toLowerCase(),
      password: formValues.password.trim(),
    };

    dispatch(signupAdmin(adminData))
      .unwrap()
      .then(() => {
        toast.success("Admin registered and logged in");
        navigate("/admin", { replace: true });
      })
      .catch((err) => {
        toast.error(err || "Unable to signup");
      });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans">
      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-slate-100">
          <div className="flex flex-col justify-center">
            <div className="mb-8 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-slate-900 p-3 text-white">
                  <UserPlus className="h-8 w-8" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Admin Registration</h2>
              <p className="text-sm text-slate-500">
                Create a new administrator account.
              </p>
            </div>

            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-bold uppercase tracking-wider">Warning: Single Admin Only</p>
                <p>Registering a new admin will <strong>permanently replace</strong> any existing administrator account. There can only be one admin at a time.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 uppercase">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formValues.firstName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 uppercase">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formValues.lastName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                  placeholder="admin@hichooserightnig.ent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" university className="block text-xs font-semibold text-slate-700 uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formValues.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" university className="block text-xs font-semibold text-slate-700 uppercase">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all"
                  placeholder="Re-enter password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-slate-900/20 mt-4"
              >
                {status === "loading" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing…</span>
                  </div>
                ) : (
                  "Create Admin Account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500">
              <p>
                Already registered? <Link to="/admin/login" className="text-slate-900 font-semibold hover:underline">Sign In Instead</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
