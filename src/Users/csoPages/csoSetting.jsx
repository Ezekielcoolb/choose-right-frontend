import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { changeCsoPassword } from "../../redux/slices/csoAuthSlice";
import { toast } from "react-hot-toast";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function CsoSettingsPage() {
  const dispatch = useDispatch();
  const { passwordStatus, passwordError, passwordMessage } = useSelector((state) => state.csoAuth);

  const [formValues, setFormValues] = useState(initialForm);
  const [touched, setTouched] = useState({});

  const isSubmitting = passwordStatus === "loading";

  useEffect(() => {
    if (passwordStatus === "succeeded") {
      toast.success(passwordMessage || "Password changed successfully");
      setFormValues(initialForm);
      setTouched({});
    }
    if (passwordStatus === "failed" && passwordError) {
      toast.error(passwordError);
    }
  }, [passwordStatus, passwordError, passwordMessage]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    const errors = {};
    if (!formValues.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }
    if (!formValues.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (formValues.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    }
    if (formValues.newPassword !== formValues.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const errors = validate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Object.keys(errors).length > 0) {
      setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }

    dispatch(
      changeCsoPassword({
        currentPassword: formValues.currentPassword,
        newPassword: formValues.newPassword,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Security</h1>
          <p className="text-sm text-slate-500">Update your password regularly to keep your account secure.</p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          <div>
            <label htmlFor="currentPassword" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <KeyRound className="h-4 w-4 text-slate-400" /> Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formValues.currentPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-2 w-full rounded-2xl border px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                touched.currentPassword && errors.currentPassword ? "border-rose-300" : "border-slate-200"
              }`}
              placeholder="Enter your current password"
            />
            {touched.currentPassword && errors.currentPassword ? (
              <p className="mt-1 text-xs text-rose-600">{errors.currentPassword}</p>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formValues.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-2 w-full rounded-2xl border px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  touched.newPassword && errors.newPassword ? "border-rose-300" : "border-slate-200"
                }`}
                placeholder="Create a strong password"
              />
              {touched.newPassword && errors.newPassword ? (
                <p className="mt-1 text-xs text-rose-600">{errors.newPassword}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">Minimum 8 characters. Use a mix of letters, numbers, and symbols.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-2 w-full rounded-2xl border px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  touched.confirmPassword && errors.confirmPassword ? "border-rose-300" : "border-slate-200"
                }`}
                placeholder="Retype new password"
              />
              {touched.confirmPassword && errors.confirmPassword ? (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Update password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
