import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutAdmin, fetchAdminProfile } from "../redux/slices/adminAuthSlice.jsx";
import AdminSidebar from "../Users/AdminPages/AdminSidebar";
import AdminNav from "../Users/AdminPages/AdminNav";

export default function AdminController() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { token, admin, profileStatus } = useSelector((state) => state.adminAuth);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { state: { from: location }, replace: true });
    } else if (!admin && profileStatus === "idle") {
      dispatch(fetchAdminProfile());
    }
  }, [token, admin, profileStatus, navigate, location, dispatch]);

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate("/admin/login", { replace: true });
    setIsSidebarOpen(false);
  };

  if (!token) return null;

  return (
    <div className="h-screen bg-slate-50 md:flex md:overflow-hidden">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        admin={admin || { firstName: "Admin", lastName: "" }}
      />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <AdminNav
          admin={admin || { firstName: "Admin", lastName: "" }}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
