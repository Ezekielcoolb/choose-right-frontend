import { useMemo, useState } from "react";
import { Menu, Bell, LogOut, User, Settings, AlarmClock } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// const API_BASE_URL = "https://api.betterlifeloan.com";

function getInitials(firstName, lastName) {
  const initialOne = firstName?.[0] ?? "";
  const initialTwo = lastName?.[0] ?? "";
  const combined = `${initialOne}${initialTwo}`.trim();
  if (combined.length > 0) {
    return combined.toUpperCase();
  }
  return "CS";
}

export default function CsoNav({
  cso,
  onToggleSidebar,
  onNotificationsClick,
  onProfile,
  onSettings,
  onLogout,
  remittanceAlert,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fullName = useMemo(() => {
    const name = [cso?.firstName, cso?.lastName].filter(Boolean).join(" ");
    return name || "Customer Service Officer";
  }, [cso?.firstName, cso?.lastName]);

  const avatarContent = useMemo(() => {
    if (cso?.profileImg) {
      return (
        <img
          src={`${API_BASE_URL}${cso.profileImg}`}
          alt={fullName}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    }

    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {getInitials(cso?.firstName, cso?.lastName)}
      </span>
    );
  }, [cso?.profileImg, cso?.firstName, cso?.lastName, fullName]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Welcome back
            </p>
            <h1 className="text-lg font-semibold text-slate-900">{fullName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {remittanceAlert ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 animate-pulse">
              <AlarmClock className="h-4 w-4" />
              Remittance due tonight
            </div>
          ) : null}
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span
              className={`absolute right-2 top-2 inline-flex h-2 w-2 rounded-full ${
                remittanceAlert ? "bg-rose-500 animate-ping" : "bg-primary"
              }`}
            />
          </button>

          <div
            className="relative flex items-center gap-2"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {avatarContent}
              <div className="hidden flex-col text-left text-sm text-slate-700 sm:flex">
                <span className="font-semibold leading-none">{fullName}</span>
                <span className="text-xs text-slate-500">{cso?.branchName || "CSO"}</span>
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex flex-col py-2 text-sm text-slate-600">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onProfile?.();
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSettings?.();
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
