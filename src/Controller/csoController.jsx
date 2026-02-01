import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CsoNav from "../Users/csoPages/csoNav";
import CsoSidebar from "../Users/csoPages/csoSidebar";
import { fetchCsoProfile, logoutCso } from "../redux/slices/csoAuthSlice";

export default function CsoController() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { token, profile, status } = useSelector((state) => state.csoAuth);
  const { remittanceDeadlineCritical } = useSelector((state) => state.csos);

  useEffect(() => {
    if (token && !profile && status === "idle") {
      dispatch(fetchCsoProfile());
    }
  }, [token, profile, status, dispatch]);

  const handleLogout = () => {
    dispatch(logoutCso());
    navigate("/cso/login", { replace: true });
  };

  if (!token) {
    return <Navigate to="/cso/login" state={{ from: location }} replace />;
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

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
