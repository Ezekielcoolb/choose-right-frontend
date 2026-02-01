import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import AdminTransactionsPage from "./Transaction";
import AdminCollectionsPage from "./Collection";
import AdminRemittancePage from "./Remittance";

const TABS = [
  { value: "transactions", label: "Transactions" },
  { value: "collections", label: "Collections" },
  { value: "remittance", label: "Remittance" },
];

export const AllTransactionTable = ({ plans, formatCurrency }) => {
  if (!plans?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center text-sm text-slate-500">
        No transactions match this filter range.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Plan</th>
            <th className="px-4 py-3 text-left font-semibold">Customer</th>
            <th className="px-4 py-3 text-left font-semibold">CSO</th>
            <th className="px-4 py-3 text-left font-semibold">Month</th>
            <th className="px-4 py-3 text-right font-semibold">Deposited</th>
            <th className="px-4 py-3 text-right font-semibold">Withdrawn</th>
            <th className="px-4 py-3 text-right font-semibold">Savings balance</th>
            <th className="px-4 py-3 text-right font-semibold">Loan amount</th>
            <th className="px-4 py-3 text-right font-semibold">Loan balance</th>
            <th className="px-4 py-3 text-right font-semibold">Maintenance fees</th>
            <th className="px-4 py-3 text-right font-semibold">Loan fees</th>
            <th className="px-4 py-3 text-right font-semibold">Total fees</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {plans.map((plan) => (
            <tr key={plan.id} className="transition hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      plan.isLoanPlan ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {plan.isLoanPlan ? (
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {plan.isLoanPlan ? "Loan" : "Savings"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{plan.planName || "Unnamed plan"}</p>
                    <p className="text-xs text-slate-400">{plan.planCode || plan.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{plan.customerName || "Unknown customer"}</p>
                <p className="text-xs text-slate-400">{plan.customerPhone || "—"}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{plan.csoName || "—"}</p>
                <p className="text-xs text-slate-400">{plan.csoPhone || "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{plan.monthLabel}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.deposited)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.withdrawn)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600">
                {formatCurrency(plan.savingsBalance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.loanAmount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-600">
                {formatCurrency(plan.loanBalance)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.maintenanceFees)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.loanFees)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(plan.totalFees)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <td colSpan={12} className="px-4 py-3 text-left">
              Showing {plans.length.toLocaleString()} plan{plans.length === 1 ? "" : "s"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default function AllTransactionsDashboard() {
  const [activeTab, setActiveTab] = useState("transactions");

  const content = useMemo(() => {
    switch (activeTab) {
      case "collections":
        return <AdminCollectionsPage />;
      case "remittance":
        return <AdminRemittancePage />;
      case "transactions":
      default:
        return <AdminTransactionsPage />;
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                activeTab === tab.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <div>{content}</div>
    </div>
  );
}

