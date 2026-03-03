import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSavingsPlans } from "../../../redux/slices/savingsSlice";
import { fetchCustomers } from "../../../redux/slices/customersSlice";
import { Loader2, PiggyBank, CreditCard, TrendingUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;

const getLoanStatus = (plan) => plan.loanDetails?.status || plan.loanStatus || plan.status || "Unknown";

const getLoanBalance = (plan) => (plan.loanDetails?.amount || 0) - (plan.availableBalance || 0);

const extractNameFragments = (entity) => {
  if (!entity) return "";
  if (typeof entity === "string") {
    if (/^[a-f\d]{24}$/i.test(entity)) {
      return "";
    }
    return entity;
  }
  const fullName = entity.fullName || entity.name;
  if (fullName) return fullName;
  const combined = `${entity.firstName || ""} ${entity.lastName || ""}`.trim();
  if (combined) return combined;
  return "";
};

const getCustomerName = (plan, customersById = new Map()) => {
  if (!plan) return "Unknown";
  const explicit = plan.customerName || extractNameFragments(plan.customer) || extractNameFragments(plan.customerId);
  if (explicit) return explicit;

  const rawId = typeof plan.customerId === "string" ? plan.customerId : plan.customerId?._id || plan.customer?._id;
  if (rawId && customersById.has(rawId)) {
    const resolved = extractNameFragments(customersById.get(rawId));
    if (resolved) return resolved;
  }

  return "Unknown";
};

const getPlanCustomerId = (plan) => {
  if (!plan) return null;
  if (typeof plan.customerId === "string") return plan.customerId;
  if (plan.customerId?._id) return plan.customerId._id;
  if (plan.customer?._id) return plan.customer._id;
  return null;
};

const matchesSearchTerm = (plan, term, customersById) => {
  if (!term.trim()) return true;
  const lookup = term.toLowerCase();
  return (
    (plan.planName || "").toLowerCase().includes(lookup) ||
    getCustomerName(plan, customersById).toLowerCase().includes(lookup)
  );
};

const isLoanOverdue = (plan) => {
  if (!plan.isLoan) return false;
  const firstPaymentDate = plan.loanDetails?.firstPaymentDate || plan.loanDetails?.startDate;
  if (!firstPaymentDate) return false;
  const start = new Date(firstPaymentDate);
  if (Number.isNaN(start.getTime())) return false;
  const diff = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 30 && !["completed", "closed"].includes((plan.status || "").toLowerCase());
};

const TableHeader = ({ columns }) => (
  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
    <tr>
      {columns.map((column) => (
        <th key={column} className="px-4 py-3 text-left font-semibold">
          {column}
        </th>
      ))}
    </tr>
  </thead>
);

const SavingsRow = ({ plan, customersById, onViewPlan }) => (
  <tr className="border-b border-slate-100 text-sm text-slate-600">
    <td className="px-4 py-3 font-semibold text-slate-900">{plan.planName || "Unnamed plan"}</td>
    <td className="px-4 py-3">{getCustomerName(plan, customersById)}</td>
    <td className="px-4 py-3">{plan.status || "Unknown"}</td>
    <td className="px-4 py-3">{formatCurrency(plan.dailyContribution)}</td>
    <td className="px-4 py-3">{formatCurrency(plan.maintenanceFee ?? plan.dailyContribution)}</td>
    <td className="px-4 py-3">{formatCurrency(plan.totalDeposited)}</td>
    <td className="px-4 py-3">{formatCurrency(plan.availableBalance)}</td>
    <td className="px-4 py-3 text-right">
      <button
        type="button"
        onClick={() => onViewPlan(plan)}
        className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
      >
        View plan
      </button>
    </td>
  </tr>
);

const LoanRow = ({ plan, customersById, onViewPlan }) => {
  const maintenanceFee = Number(plan.maintenanceFee ?? plan.dailyContribution ?? 0);
  const loanMaintenanceFeeRaw =
    plan.loanDetails?.maintenanceFee ??
    (plan.loanDetails?.maintenanceFeePaid ? plan.dailyContribution ?? 0 : 0);
  const loanMaintenanceFee = Number(loanMaintenanceFeeRaw || 0);
  const combinedFees = maintenanceFee + loanMaintenanceFee;

  return (
    <tr className="border-b border-slate-100 text-sm text-slate-600">
      <td className="px-4 py-3 font-semibold text-slate-900">{plan.planName || "Loan plan"}</td>
      <td className="px-4 py-3">{getCustomerName(plan, customersById)}</td>
      <td className="px-4 py-3">{getLoanStatus(plan)}</td>
      <td className="px-4 py-3">{formatCurrency(plan.loanDetails?.amount)}</td>
      <td className="px-4 py-3">{formatCurrency(plan.availableBalance)}</td>
      <td className="px-4 py-3">{formatCurrency(getLoanBalance(plan))}</td>
      <td className="px-4 py-3">{formatCurrency(combinedFees)}</td>
      <td className="px-4 py-3">{isLoanOverdue(plan) ? "Overdue" : "On track"}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onViewPlan(plan)}
          className="inline-flex items-center rounded-full border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-500 hover:bg-indigo-50"
        >
          View loan
        </button>
      </td>
    </tr>
  );
};

const EmptyState = ({ message }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
    {message}
  </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 sm:text-sm">
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 px-3 py-1 transition enabled:hover:border-primary/40 enabled:hover:text-primary disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function ProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { plansById, plansStatus, plansError } = useSelector((state) => state.savings);
  const { items: customerItems, status: customersStatus } = useSelector((state) => state.customers);

  const [activeTab, setActiveTab] = useState("savings");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingsFilter, setSavingsFilter] = useState("all");
  const [loanFilter, setLoanFilter] = useState("all");
  const [savingsPage, setSavingsPage] = useState(1);
  const [loansPage, setLoansPage] = useState(1);

  useEffect(() => {
    if (plansStatus === "idle") {
      dispatch(fetchSavingsPlans());
    }
  }, [plansStatus, dispatch]);
  useEffect(() => {
    if (customersStatus === "idle") {
      dispatch(fetchCustomers());
    }
  }, [customersStatus, dispatch]);
  useEffect(() => {
    setSavingsPage(1);
  }, [searchTerm, savingsFilter]);
  useEffect(() => {
    setLoansPage(1);
  }, [searchTerm, loanFilter]);
  useEffect(() => {
    if (activeTab === "savings") {
      setSavingsPage(1);
    } else {
      setLoansPage(1);
    }
  }, [activeTab]);

  const plans = useMemo(() => Object.values(plansById || {}), [plansById]);
  const customersById = useMemo(() => {
    const map = new Map();
    (customerItems || []).forEach((customer) => {
      if (customer?._id) {
        map.set(customer._id, customer);
      }
    });
    return map;
  }, [customerItems]);

  const filteredSavings = useMemo(() => {
    return plans
      .filter((plan) => !plan.isLoan)
      .filter((plan) => matchesSearchTerm(plan, searchTerm, customersById))
      .filter((plan) => {
        if (savingsFilter === "all") return true;
        if (savingsFilter === "active") return (plan.status || "").toLowerCase() === "active";
        return (plan.status || "").toLowerCase() !== "active";
      });
  }, [plans, savingsFilter, searchTerm, customersById]);

  const filteredLoans = useMemo(() => {
    return plans
      .filter((plan) => {
        if (plan.isLoan) return true;
        const status = (plan.loanStatus || "").toLowerCase();
        return ["pending", "rejected"].includes(status);
      })
      .filter((plan) => matchesSearchTerm(plan, searchTerm, customersById))
      .filter((plan) => {
        if (loanFilter === "all") return true;
        const baseStatus = (plan.status || "").toLowerCase();
        const loanStatus = (plan.loanDetails?.status || plan.loanStatus || "").toLowerCase();
        if (loanFilter === "active") return baseStatus === "active";
        if (loanFilter === "rejected") return loanStatus === "rejected";
        if (loanFilter === "completed") return ["completed", "closed"].includes(baseStatus);
        if (loanFilter === "overdue") return isLoanOverdue(plan);
        return true;
      });
  }, [plans, loanFilter, searchTerm, customersById]);

  const pagedSavings = useMemo(() => {
    const total = filteredSavings.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(savingsPage, totalPages);
    const start = (current - 1) * PAGE_SIZE;
    return {
      total,
      totalPages,
      current,
      items: filteredSavings.slice(start, start + PAGE_SIZE),
    };
  }, [filteredSavings, savingsPage]);

  const pagedLoans = useMemo(() => {
    const total = filteredLoans.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(loansPage, totalPages);
    const start = (current - 1) * PAGE_SIZE;
    return {
      total,
      totalPages,
      current,
      items: filteredLoans.slice(start, start + PAGE_SIZE),
    };
  }, [filteredLoans, loansPage]);

  const handleViewPlan = useCallback(
    (plan) => {
      const customerId = getPlanCustomerId(plan);
      if (!customerId) return;
      navigate(`/cso/customers/${customerId}`, { state: { focusPlanId: plan._id } });
    },
    [navigate],
  );

  const savingsSummary = useMemo(() => {
    return filteredSavings.reduce(
      (acc, plan) => {
        acc.totalDeposited += Number(plan.totalDeposited || 0);
        acc.totalFees += Number(plan.totalFees || 0);
        acc.totalWithdrawn += Number(plan.totalWithdrawn || 0);
        acc.remainingBalance += Number(plan.availableBalance || 0);
        return acc;
      },
      { totalDeposited: 0, totalFees: 0, totalWithdrawn: 0, remainingBalance: 0 },
    );
  }, [filteredSavings]);

  const loanSummary = useMemo(() => {
    return filteredLoans.reduce(
      (acc, plan) => {
        const principal = Number(plan.loanDetails?.amount || 0);
        const repaid = Number(plan.availableBalance || 0);
        const balance = Math.max(principal - repaid, 0);
        acc.totalDisbursed += principal;
        acc.totalRepaid += repaid;
        acc.totalOutstanding += Number.isFinite(balance) ? balance : 0;
        return acc;
      },
      { totalDisbursed: 0, totalRepaid: 0, totalOutstanding: 0 },
    );
  }, [filteredLoans]);

  const isLoading = plansStatus === "loading";

  return (
    <div className="space-y-8 px-3 pb-16 sm:px-0">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products overview</h1>
          <p className="text-sm text-slate-500">Monitor every savings and loan managed by your CSO team.</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-600">
            {[
              { value: "savings", label: "Savings", icon: PiggyBank },
              { value: "loans", label: "Loans", icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition ${
                    isActive ? "bg-white text-primary shadow" : "hover:bg-white/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by plan or customer"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeTab === "savings" ? (
            <>
              {/* <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total saved</p>
                <p className="mt-2 text-xl font-bold text-emerald-700">{formatCurrency(savingsSummary.totalDeposited)}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Maintenance fees</p>
                <p className="mt-2 text-xl font-bold text-amber-700">{formatCurrency(savingsSummary.totalFees)}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Total withdrawn</p>
                <p className="mt-2 text-xl font-bold text-rose-700">{formatCurrency(savingsSummary.totalWithdrawn)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining balance</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(savingsSummary.remainingBalance)}</p>
              </div> */}
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total disbursed</p>
                <p className="mt-2 text-xl font-bold text-indigo-700">{formatCurrency(loanSummary.totalDisbursed)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Amount repaid</p>
                <p className="mt-2 text-xl font-bold text-emerald-700">{formatCurrency(loanSummary.totalRepaid)}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Outstanding balance</p>
                <p className="mt-2 text-xl font-bold text-rose-700">{formatCurrency(loanSummary.totalOutstanding)}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <TrendingUp className="h-4 w-4 text-primary" />
            {activeTab === "savings" ? "Savings plans" : "Loan plans"}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            {activeTab === "savings" ? (
              <>
                <button
                  type="button"
                  onClick={() => setSavingsFilter("all")}
                  className={`rounded-full px-3 py-1 transition ${
                    savingsFilter === "all" ? "bg-primary text-white" : "bg-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSavingsFilter("active")}
                  className={`rounded-full px-3 py-1 transition ${
                    savingsFilter === "active" ? "bg-primary text-white" : "bg-slate-100"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setSavingsFilter("completed")}
                  className={`rounded-full px-3 py-1 transition ${
                    savingsFilter === "completed" ? "bg-primary text-white" : "bg-slate-100"
                  }`}
                >
                  Completed
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoanFilter("all")}
                  className={`rounded-full px-3 py-1 transition ${
                    loanFilter === "all" ? "bg-indigo-500 text-white" : "bg-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setLoanFilter("active")}
                  className={`rounded-full px-3 py-1 transition ${
                    loanFilter === "active" ? "bg-indigo-500 text-white" : "bg-slate-100"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setLoanFilter("rejected")}
                  className={`rounded-full px-3 py-1 transition ${
                    loanFilter === "rejected" ? "bg-indigo-500 text-white" : "bg-slate-100"
                  }`}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  onClick={() => setLoanFilter("completed")}
                  className={`rounded-full px-3 py-1 transition ${
                    loanFilter === "completed" ? "bg-indigo-500 text-white" : "bg-slate-100"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setLoanFilter("overdue")}
                  className={`rounded-full px-3 py-1 transition ${
                    loanFilter === "overdue" ? "bg-indigo-500 text-white" : "bg-slate-100"
                  }`}
                >
                  Overdue
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 sm:overflow-hidden">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading plans…
            </div>
          ) : plansError ? (
            <div className="px-4 py-6 text-sm text-rose-600">{plansError}</div>
          ) : activeTab === "savings" ? (
            filteredSavings.length ? (
              <table className="w-full min-w-[940px] table-auto">
                <TableHeader columns={["Plan", "Customer", "Status", "Daily target", "Maintenance fee", "Total deposited", "Available", "Actions"]} />
                <tbody>
                  {pagedSavings.items.map((plan) => (
                    <SavingsRow key={plan._id} plan={plan} customersById={customersById} onViewPlan={handleViewPlan} />
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No savings plans match the current filters." />
            )
          ) : filteredLoans.length ? (
            <table className="w-full min-w-[980px] table-auto">
              <TableHeader columns={["Plan", "Customer", "Status", "Principal", "Paid", "Balance", "Fees", "Position", "Plan"]} />
              <tbody>
                {pagedLoans.items.map((plan) => (
                  <LoanRow key={plan._id} plan={plan} customersById={customersById} onViewPlan={handleViewPlan} />
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No loan plans match the current filters." />
          )}
          <PaginationControls
            currentPage={activeTab === "savings" ? pagedSavings.current : pagedLoans.current}
            totalPages={activeTab === "savings" ? pagedSavings.totalPages : pagedLoans.totalPages}
            onPageChange={activeTab === "savings" ? setSavingsPage : setLoansPage}
          />
        </div>
      </section>
    </div>
  );
}
