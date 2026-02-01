import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../Users/AdminPages/AdminSidebar";
import AdminNav from "../Users/AdminPages/AdminNav";

const mockAdmin = {
  email: "akeematanda817@gmail.com",
};

export default function AdminController() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-50 md:flex md:overflow-hidden">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        admin={mockAdmin}
      />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <AdminNav
          admin={mockAdmin}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={() => setIsSidebarOpen(false)}
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
