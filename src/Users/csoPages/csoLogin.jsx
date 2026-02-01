import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginCso } from "../../redux/slices/csoAuthSlice";

const initialFormState = {
  identifier: "",
  password: "",
};

export default function CsoLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { token, status, error } = useSelector((state) => state.csoAuth);

  const [formValues, setFormValues] = useState(initialFormState);
  const [touched, setTouched] = useState({});

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
                <Link to="#" className="text-xs font-semibold text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formValues.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  showPasswordError ? "border-rose-300" : "border-slate-200"
                }`}
                placeholder="Enter your password"
              />
              {showPasswordError ? (
                <p className="text-xs text-rose-500">Password is required.</p>
              ) : null}
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
    </div>
  );
}
