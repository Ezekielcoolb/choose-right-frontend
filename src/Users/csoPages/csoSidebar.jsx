import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Wallet,
  PieChart,
  ClipboardList,
  LayoutDashboard,
  User,
  X,
} from "lucide-react";

const baseLinkClasses =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const baseIconClasses = "h-5 w-5";

function navItems() {
  return [
    { label: "Home", to: "/cso", icon: Home },
    { label: "Customers", to: "/cso/customers", icon: User },
    { label: "Products", to: "/cso/products", icon: ClipboardList },
    { label: "Collections", to: "/cso/collection", icon: Wallet },
    { label: "Dashboard", to: "/cso/dashboard", icon: LayoutDashboard },
    // { label: "Products", to: "/cso/wallet", icon: PieChart },
    { label: "Profile", to: "/cso/profile", icon: User },
  ];
}

export default function CsoSidebar({ isOpen, onClose }) {
  const items = useMemo(navItems, []);

  const renderLinks = (orientation = "vertical") => (
    <nav
      className={
        orientation === "horizontal"
          ? "flex items-center justify-around gap-1"
          : "space-y-1"
      }
    >
      {items.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) =>
            [
              orientation === "horizontal"
                ? "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium"
                : baseLinkClasses,
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")
          }
          onClick={onClose}
        >
          <Icon className={orientation === "horizontal" ? "h-5 w-5" : baseIconClasses} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-full w-full flex-col px-4 py-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              CSO Menu
            </p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto pr-2">{renderLinks()}</div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl transition-all duration-200 lg:hidden ${
          isOpen ? "max-h-[80vh] rounded-t-3xl" : "max-h-[4.5rem]"
        }`}
        aria-label="CSO navigation"
      >
        {isOpen && (
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Quick Navigation</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {isOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-4">{renderLinks()}</div>
        )}

        <div className="flex items-center justify-around gap-1 border-t border-slate-200 px-3 py-2 sm:hidden">
          {renderLinks("horizontal")}
        </div>
      </aside>
    </>
  );
}
