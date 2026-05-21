import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  UserCircle2,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  MenuSquare,
  Wallet,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const primaryNav = [
  { label: "Dashboard", to: "/manager", icon: LayoutDashboard },
  { label: "CSOs", to: "/manager/csos", icon: UserCircle2 },
  { label: "Savings", to: "/manager/savings", icon: PiggyBank },
  { label: "Loans", to: "/manager/loans", icon: CreditCard },
  { label: "Customers", to: "/manager/customers", icon: Users },
];

const transactionNav = [
  { label: "Transactions", to: "/manager/transactions", icon: ArrowLeftRight },
  { label: "Withdrawals", to: "/manager/withdrawals", icon: Wallet },
];

const secondaryNav = [
  { label: "Settings", to: "/manager/settings", icon: Settings },
];

const linkBaseClasses = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActiveClasses = "bg-primary/10 text-primary";
const linkInactiveClasses = "text-slate-500 hover:bg-slate-100 hover:text-slate-900";

function SidebarSection({ title, items, onNavigate }) {
  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      ) : null}
      <nav className="space-y-1">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end
            className={({ isActive }) =>
              [linkBaseClasses, isActive ? linkActiveClasses : linkInactiveClasses].join(" ")
            }
            onClick={onNavigate}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function ManagerSidebar({ isOpen = false, onClose, manager }) {
  const [reportsOpen, setReportsOpen] = useState(true);
  const managerLabel = manager?.email || "Manager";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white shadow-xl transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-5">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                Mg
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900">Manager Portal</p>
                <p className="text-xs text-slate-500">{managerLabel}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 md:hidden"
            >
              Close
            </button>
          </div>

          <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 py-6">
            <SidebarSection title="Overview" items={primaryNav} onNavigate={onClose} />

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setReportsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <span className="flex items-center gap-3">
                  <MenuSquare className="h-5 w-5" />
                  <span>Transactions & Remittance</span>
                </span>
                {reportsOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {reportsOpen && (
                <nav className="ml-8 space-y-1">
                  {transactionNav.map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={label}
                      to={to}
                      end
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive ? linkActiveClasses : linkInactiveClasses,
                        ].join(" ")
                      }
                      onClick={onClose}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>

            <SidebarSection title="" items={secondaryNav} onNavigate={onClose} />
          </div>

          <div className="border-t border-slate-200 px-4 py-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Branch Leadership</p>
              <p className="mt-1 text-xs text-slate-500">Monitor performance and empower your CSOs.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
