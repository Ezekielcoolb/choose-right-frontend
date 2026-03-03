import { useEffect, useMemo, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CsoNav from "../Users/csoPages/csoNav";
import CsoSidebar from "../Users/csoPages/csoSidebar";
import { fetchCsoProfile, logoutCso } from "../redux/slices/csoAuthSlice";
import { recordCsoRemittance } from "../redux/slices/csoSlice";

const getLocalDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const getPreviousBusinessDate = (referenceDate = new Date()) => {
  if (!referenceDate) return null;
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);

  for (let i = 0; i < 7; i += 1) {
    date.setDate(date.getDate() - 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      return new Date(date);
    }
  }

  return null;
};

export default function CsoController() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token, profile, status } = useSelector((state) => state.csoAuth);
  const { remittanceDeadlineCritical, remittanceStatus } = useSelector((state) => state.csos);

  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [remittanceSubmitError, setRemittanceSubmitError] = useState("");

  const remittanceCompliance = useMemo(() => {
    if (!profile?.remittance || !profile.remittance.length) {
      const previousBusinessDate = getPreviousBusinessDate();
      if (!previousBusinessDate) return null;
      return {
        type: "missing",
        formattedDate: previousBusinessDate.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }

    const previousBusinessDate = getPreviousBusinessDate();
    if (!previousBusinessDate) return null;
    const targetKey = getLocalDateKey(previousBusinessDate);

    const matched = profile.remittance.find((entry) => {
      const createdKey = getLocalDateKey(entry?.createdAt || entry?.updatedAt);
      return createdKey === targetKey;
    });

    const formattedDate = previousBusinessDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!matched) {
      return {
        type: "missing",
        formattedDate,
      };
    }

    const collectedNumber = Number(matched.amountCollected || 0);
    const amountPaidNumber = Number(matched.amountPaid || 0);
    const amountRemittedNumber = Number(matched.amountRemitted || 0);

    if (collectedNumber > 0 && (amountPaidNumber <= 0 || amountRemittedNumber <= 0)) {
      return {
        type: "incomplete",
        formattedDate,
        pendingRemittance: {
          _id: matched._id,
          collected: collectedNumber,
          amountPaid: amountPaidNumber,
          amountRemitted: amountRemittedNumber,
          dateKey: targetKey,
          createdAt: matched.createdAt,
          updatedAt: matched.updatedAt,
        },
      };
    }

    return null;
  }, [profile?.remittance]);

  useEffect(() => {
    if (remittanceCompliance?.type === "incomplete") {
      setRemittanceAmount("");
      setRemittanceSubmitError("");
    } else {
      setRemittanceAmount("");
      setRemittanceSubmitError("");
    }
  }, [remittanceCompliance]);

  useEffect(() => {
    if (remittanceCompliance) {
      document.body.classList.add("overflow-hidden");
      return () => {
        document.body.classList.remove("overflow-hidden");
      };
    }
    document.body.classList.remove("overflow-hidden");
    return undefined;
  }, [remittanceCompliance]);

  useEffect(() => {
    if (token && !profile && status === "idle") {
      dispatch(fetchCsoProfile());
    }
  }, [token, profile, status, dispatch]);

  useEffect(() => {
    if (token && profile) {
      setIsSidebarOpen(false);
    }
  }, [token, profile]);

  const handleLogout = () => {
    dispatch(logoutCso());
    navigate("/cso/login", { replace: true });
  };

  const isSubmittingRemittance = remittanceStatus === "loading";

  const handleSubmitPendingRemittance = async (event) => {
    event.preventDefault();
    setRemittanceSubmitError("");

    if (remittanceCompliance?.type !== "incomplete") {
      return;
    }

    if (!profile?._id) {
      setRemittanceSubmitError("CSO profile unavailable. Please try again later.");
      return;
    }

    const pending = remittanceCompliance.pendingRemittance;
    if (!pending) {
      setRemittanceSubmitError("No pending remittance details were found.");
      return;
    }

    const parsedAmount = Number(remittanceAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setRemittanceSubmitError("Enter a valid remittance amount.");
      return;
    }

    const collectedValueRaw = Number(pending.collected ?? 0);
    const collectedValue = Number.isFinite(collectedValueRaw) && collectedValueRaw > 0 ? collectedValueRaw : 0;

    const payload = {
      csoId: profile._id,
      amountCollected: collectedValue,
      amountPaid: parsedAmount,
      amountRemitted: parsedAmount,
      remark: `Remittance submitted by CSO for ${remittanceCompliance.formattedDate}`,
      remittanceId: pending._id || pending.id,
    };

    const resolutionDateSource = pending.dateKey || pending.createdAt || pending.updatedAt;
    if (resolutionDateSource) {
      const parsedDate = new Date(resolutionDateSource);
      if (!Number.isNaN(parsedDate.getTime())) {
        payload.resolutionDate = parsedDate.toISOString();
      } else if (typeof resolutionDateSource === "string") {
        payload.resolutionDate = resolutionDateSource;
      }
    }

    try {
      await dispatch(recordCsoRemittance(payload)).unwrap();
      setRemittanceAmount("");
      setRemittanceSubmitError("");
      dispatch(fetchCsoProfile()).catch(() => {});
    } catch (error) {
      setRemittanceSubmitError(error?.message || "Failed to submit remittance.");
    }
  };

  if (!token) {
    return <Navigate to="/cso/login" replace />;
  }

  if (status === "loading" && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm font-medium">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/cso/login" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <CsoSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <CsoNav
          cso={profile}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onNotificationsClick={() => setIsSidebarOpen(true)}
          onProfile={() => {
            setIsSidebarOpen(false);
            navigate("/cso/profile");
          }}
          onSettings={() => {
            setIsSidebarOpen(false);
            navigate("/cso/settings");
          }}
          onLogout={handleLogout}
          remittanceAlert={remittanceDeadlineCritical}
        />

        {remittanceCompliance ? (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 px-4 py-6">
            <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Remittance Alert</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Action required</h2>
              <p className="mt-4 text-sm text-slate-600">
                {remittanceCompliance.type === "missing"
                  ? `You did not submit remittance for ${remittanceCompliance.formattedDate}. Contact the administrator to proceed.`
                  : `Remittance for ${remittanceCompliance.formattedDate} is incomplete. Please submit yesterday's remittance before continuing.`}
              </p>
              {remittanceCompliance.type === "incomplete" ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Amount collected was recorded, but the paid or remitted amount is still zero.
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Access is locked until an administrator resolves the outstanding remittance.
                </p>
              )}

              {remittanceCompliance.type === "incomplete" ? (
                <form className="mt-6 space-y-5 text-left" onSubmit={handleSubmitPendingRemittance}>
                  <div className="space-y-2">
                    <label htmlFor="pending-remittance-amount" className="text-sm font-semibold text-slate-600">
                      Amount remitted
                    </label>
                    <input
                      id="pending-remittance-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={remittanceAmount}
                      onChange={(event) => setRemittanceAmount(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter the amount you remitted"
                      required
                    />
                    {/* {remittanceCompliance.pendingRemittance?.collected ? (
                      <p className="text-xs text-slate-500">
                        Amount collected: {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(Number(remittanceCompliance.pendingRemittance.collected || 0))}
                      </p>
                    ) : null} */}
                  </div>

                  {remittanceSubmitError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {remittanceSubmitError}
                    </div>
                  ) : null}

                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="submit"
                      disabled={isSubmittingRemittance}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                    >
                      {isSubmittingRemittance ? "Submitting…" : "Submit remittance"}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                    >
                      Log out
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
