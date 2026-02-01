import { Menu, Bell, Search, UserCircle, LogOut } from "lucide-react";

export default function AdminNav({ admin, onToggleSidebar, onLogout }) {
  const adminLabel = admin?.email || "Admin";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-4 px-8 md:flex">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search reports, users, or actions"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <UserCircle className="h-6 w-6 text-slate-400" />
            <span className="hidden md:inline">{adminLabel}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
