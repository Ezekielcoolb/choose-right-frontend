import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ManagerSidebar from "../Users/ManagerPages/ManagerSidebar";
import ManagerNav from "../Users/ManagerPages/ManagerNav";
import { fetchManagerProfile, logoutManager } from "../redux/slices/managerAuthSlice.jsx";
import { resetManagerData } from "../redux/slices/managerDataSlice.jsx";
import { setAuthToken } from "../api/client";

export default function ManagerController() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    token,
    manager,
    profileStatus,
    profileError,
  } = useSelector((state) => state.managerAuth);

  const isAuthenticating = profileStatus === "loading";
  const hasError = profileStatus === "failed";

  useEffect(() => {
    if (!token) {
      navigate("/manager/login", { replace: true, state: { from: location.pathname } });
    }
  }, [token, navigate, location.pathname]);

  useEffect(() => {
    if (token) {
      if (profileStatus === "idle" && !manager) {
        dispatch(fetchManagerProfile());
      }
    }
  }, [token, profileStatus, manager, dispatch]);

  const handleLogout = () => {
    dispatch(logoutManager());
    dispatch(resetManagerData());
    navigate("/manager/login", { replace: true });
  };

  const managerSummary = useMemo(() => ({
    email: manager?.email,
    branchName: manager?.branchName,
  }), [manager]);

  if (!token) {
    return null;
  }

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Loading manager workspace…</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-600">
          <p className="font-semibold">Unable to load manager profile.</p>
          <p className="mt-2">{profileError || "Please login again."}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <ManagerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        manager={managerSummary}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <ManagerNav
          manager={managerSummary}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
