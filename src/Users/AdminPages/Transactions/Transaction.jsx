import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CalendarDays, Filter, RefreshCw, Search } from "lucide-react";

import { AllTransactionTable } from "./AllTransaction";
import { fetchAdminSavingsPlans } from "../../../redux/slices/savingsSlice";
import { fetchActiveLoans } from "../../../redux/slices/adminLoanSlice";
import { fetchCsos } from "../../../redux/slices/csoSlice";
import { fetchCustomers } from "../../../redux/slices/customersSlice";
import { fetchDashboardOverview } from "../../../redux/slices/adminDashboardSlice";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const getMonthKey = (value) => {
  if (!value) return null;
  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) return null;
  const year = candidate.getFullYear();
  const month = String(candidate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const formatMonthLabel = (key) => {
  if (!key) return "—";
  const [year, month] = key.split("-").map((token) => Number.parseInt(token, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month)) return "—";
  const date = new Date(year, month - 1, 1);
  return monthFormatter.format(date);
};

const pickEntityId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value?._id) return value._id;
  return null;
};

const extractName = (entity) => {
  if (!entity) {
    return { name: "", phone: "" };
  }

  if (typeof entity === "string") {
    return { name: entity, phone: "" };
  }

  const first = entity.firstName || entity.firstname || "";
  const last = entity.lastName || entity.lastname || "";
  const fullName = entity.fullName || entity.name || `${first} ${last}`.trim();

  return {
    name: fullName || "",
    phone: entity.phone || entity.phoneNumber || "",
  };
};

const resolveCustomerMeta = (plan, customersById) => {
  if (plan.customerName || plan.customerPhone) {
    return {
      id: pickEntityId(plan.customerId),
      name: plan.customerName || "Unknown customer",
      phone: plan.customerPhone || "—",
    };
  }

  const direct = extractName(plan.customer || plan.customerId);
  if (direct.name) {
    return {
      id: pickEntityId(plan.customerId),
      name: direct.name,
      phone: direct.phone || "—",
    };
  }

  const customerId = pickEntityId(plan.customerId);
  if (customerId && customersById.has(customerId)) {
    const resolved = extractName(customersById.get(customerId));
    if (resolved.name) {
      return { id: customerId, name: resolved.name, phone: resolved.phone || "—" };
    }
  }

  return { id: null, name: "Unknown customer", phone: "—" };
};

const resolveCsoMeta = (plan, csosById) => {
  const csoCandidate = plan.cso || plan.csoId;
  const direct = extractName(csoCandidate);
  const csoId = pickEntityId(plan.csoId || plan.cso);

  if (direct.name) {
    return { id: csoId, name: direct.name, phone: direct.phone || "—" };
  }

  if (csoId && csosById.has(csoId)) {
    const resolved = extractName(csosById.get(csoId));
    if (resolved.name) {
      return { id: csoId, name: resolved.name, phone: resolved.phone || "—" };
    }
  }

  return { id: csoId, name: "—", phone: "—" };
};

const isLoan = (plan) => {
  if (!plan) return false;
  const status = (plan.loanStatus || plan.status || "").toLowerCase();
  const type = (plan.planType || "").toLowerCase();
  // Only classify as Loan if it's explicitly approved, active, or in a terminal "paid" state.
  // Pending and Rejected requests should stay as Savings.
  return (
    ["approved", "active", "completed", "disbursed", "repaid"].includes(status) ||
    plan.isLoan === true ||
    type === "loan"
  );
};

const deriveLoanMetrics = (plan) => {
  const loanDetails = plan?.loanDetails || {};

  const amount = Number(
    loanDetails.amount ??
      loanDetails.requestedAmount ??
      loanDetails.principal ??
      plan?.loanAmount ??
      plan?.loanDetails?.principal ??
      0,
  );

  const totalPaid = Number(
    loanDetails.totalPaid ??
      loanDetails.repaymentCollected ??
      loanDetails.paid ??
      loanDetails.loanPaid ??
      plan?.totalPaid ??
      plan?.totalDeposited ??
      0,
  );

  const loanFees = Number(
    loanDetails.maintenanceFee ??
      loanDetails.processingFee ??
      loanDetails.serviceCharge ??
      plan?.loanFees ??
      0,
  );
  
  const mFee = Number(plan.totalFees || plan.maintenanceFee || 0);
  const totalFeesOnLoan = loanFees + mFee;
  
  // Net Principal Repayment = Total Paid - All Fees associated with the loan
  const netPaid = Math.max(0, totalPaid - totalFeesOnLoan);
  const balanceCandidate = amount - netPaid;

  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    totalPaid: Number.isFinite(totalPaid) && totalPaid > 0 ? totalPaid : 0,
    balance: Number.isFinite(balanceCandidate) ? Math.max(balanceCandidate, 0) : 0,
    loanFees: Number.isFinite(loanFees) && loanFees > 0 ? loanFees : 0,
  };
};

const aggregateTotals = (records) =>
  records.reduce(
    (acc, record) => {
      acc.deposited += record.deposited;
      acc.withdrawn += record.withdrawn;
      acc.savingsBalance += record.savingsBalance;
      acc.loanAmount += record.loanAmount;
      acc.loanBalance += record.loanBalance;
      acc.maintenanceFees += record.maintenanceFees;
      acc.loanFees += record.loanFees;
      acc.totalFees += record.totalFees;
      return acc;
    },
    {
      deposited: 0,
      withdrawn: 0,
      savingsBalance: 0,
      loanAmount: 0,
      loanBalance: 0,
      maintenanceFees: 0,
      loanFees: 0,
      totalFees: 0,
    },
  );

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminTransactionsPage() {
  const dispatch = useDispatch();

  const { adminPlans, adminPlansStatus, adminPlansError } = useSelector((state) => state.savings);
  const { activeLoans, status: loansStatus, error: loansError } = useSelector((state) => state.adminLoans);
  const { items: csos, status: csosStatus, error: csosError } = useSelector((state) => state.csos);
  const { items: customers, status: customersStatus, error: customersError } = useSelector(
    (state) => state.customers,
  );
  const { overview: dashboardOverview } = useSelector((state) => state.adminDashboard) || {};

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [csoFilter, setCsoFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!dashboardOverview || dashboardOverview.status === "idle") {
      dispatch(fetchDashboardOverview());
    }
  }, [dashboardOverview, dispatch]);

  useEffect(() => {
    if (adminPlansStatus === "idle") {
      dispatch(fetchAdminSavingsPlans());
    }
  }, [adminPlansStatus, dispatch]);

  useEffect(() => {
    if (loansStatus === "idle") {
      dispatch(fetchActiveLoans());
    }
  }, [loansStatus, dispatch]);

  useEffect(() => {
    if (csosStatus === "idle") {
      dispatch(fetchCsos());
    }
  }, [csosStatus, dispatch]);

  useEffect(() => {
    if (customersStatus === "idle") {
      dispatch(fetchCustomers({ admin: true }));
    }
  }, [customersStatus, dispatch]);

  const refreshData = useCallback(() => {
    dispatch(fetchAdminSavingsPlans());
    dispatch(fetchActiveLoans());
    dispatch(fetchCsos());
    dispatch(fetchCustomers({ admin: true }));
  }, [dispatch]);

  const customersById = useMemo(() => {
    const map = new Map();
    (customers || []).forEach((customer) => {
      if (customer?._id) {
        map.set(customer._id, customer);
      }
    });
    return map;
  }, [customers]);

  const csosById = useMemo(() => {
    const map = new Map();
    (csos || []).forEach((cso) => {
      if (cso?._id) {
        map.set(cso._id, cso);
      }
    });
    return map;
  }, [csos]);

  const savingsRecords = useMemo(() => {
    return (adminPlans || [])
      .filter((plan) => !isLoan(plan))
      .map((plan) => {
      const customer = resolveCustomerMeta(plan, customersById);
      const cso = resolveCsoMeta(plan, csosById);

      const monthKey = getMonthKey(plan.startDate || plan.createdAt || plan.updatedAt);
      const maintenanceFees = Number(plan.totalFees || plan.maintenanceFee || 0);

      return {
        id: `savings-${plan._id}`,
        planId: plan._id,
        planName: plan.planName || "Savings plan",
        planCode: plan.planCode || plan._id,
        isLoanPlan: false,
        customerName: customer.name,
        customerPhone: customer.phone || "—",
        csoId: cso.id,
        csoName: cso.name,
        csoPhone: cso.phone || "—",
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        deposited: Number(plan.totalDeposited || 0),
        withdrawn: Number(plan.totalWithdrawn || 0),
        savingsBalance: Number(plan.availableBalance || plan.balance || 0),
        loanAmount: 0,
        loanBalance: 0,
        maintenanceFees,
        loanFees: 0,
        totalFees: maintenanceFees,
      };
    });
  }, [adminPlans, customersById, csosById]);

  const loanRecords = useMemo(() => {
    return (activeLoans || [])
      .filter((plan) => isLoan(plan))
      .map((plan) => {
      const customer = resolveCustomerMeta(plan, customersById);
      const cso = resolveCsoMeta(plan, csosById);
      const metrics = deriveLoanMetrics(plan);

      const monthKey =
        getMonthKey(plan.loanDetails?.startDate) ||
        getMonthKey(plan.loanDetails?.requestDate) ||
        getMonthKey(plan.createdAt) ||
        getMonthKey(plan.updatedAt);

      const maintenanceFees = Number(plan.totalFees || plan.maintenanceFee || 0);
      const loanFees = metrics.loanFees;

      return {
        id: `loan-${plan._id}`,
        planId: plan._id,
        planName: plan.planName || "Loan plan",
        planCode: plan.planCode || plan._id,
        isLoanPlan: true,
        customerName: customer.name,
        customerPhone: customer.phone || "—",
        csoId: cso.id,
        csoName: cso.name,
        csoPhone: cso.phone || "—",
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        deposited: metrics.totalPaid,
        withdrawn: Number(plan.totalWithdrawn || 0),
        savingsBalance: 0,
        loanAmount: metrics.amount,
        loanBalance: metrics.balance,
        maintenanceFees,
        loanFees,
        totalFees: maintenanceFees + loanFees,
      };
    });
  }, [activeLoans, customersById, csosById]);

  const allRecords = useMemo(() => {
    return [...savingsRecords, ...loanRecords];
  }, [savingsRecords, loanRecords]);

  const monthOptions = useMemo(() => {
    const keys = new Set();
    allRecords.forEach((record) => {
      if (record.monthKey) {
        keys.add(record.monthKey);
      }
    });
    const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
    return [{ value: "all", label: "All months" }, ...sorted.map((value) => ({ value, label: formatMonthLabel(value) }))];
  }, [allRecords]);

  const csoOptions = useMemo(() => {
    const pairs = new Map();
    allRecords.forEach((record) => {
      if (record.csoId && record.csoName) {
        pairs.set(record.csoId, record.csoName);
      }
    });
    const options = Array.from(pairs.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: "all", label: "All CSOs" }, ...options];
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allRecords.filter((record) => {
      const matchesType =
        typeFilter === "all" || (typeFilter === "savings" && !record.isLoanPlan) || (typeFilter === "loan" && record.isLoanPlan);

      const matchesMonth = selectedMonth === "all" || record.monthKey === selectedMonth;

      const matchesCso = csoFilter === "all" || record.csoId === csoFilter;

      const matchesSearch =
        !term ||
        [record.planName, record.planCode, record.customerName, record.csoName]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(term));

      return matchesType && matchesMonth && matchesCso && matchesSearch;
    });
  }, [allRecords, typeFilter, selectedMonth, csoFilter, searchTerm]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const monthCompare = (b.monthKey || "").localeCompare(a.monthKey || "");
      if (monthCompare !== 0) return monthCompare;
      if (a.csoName && b.csoName && a.csoName !== b.csoName) {
        return a.csoName.localeCompare(b.csoName);
      }
      return a.planName.localeCompare(b.planName);
    });
  }, [filteredRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, typeFilter, csoFilter, searchTerm]);

  const totalRecords = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / (pageSize || 1)));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedRecords.slice(startIndex, startIndex + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value) || PAGE_SIZE_OPTIONS[0];
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (canGoPrev) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }
  };

  const filteredTotals = useMemo(() => aggregateTotals(sortedRecords), [sortedRecords]);
  const overallTotals = useMemo(() => aggregateTotals(allRecords), [allRecords]);

  const isLoading =
    adminPlansStatus === "loading" ||
    loansStatus === "loading" ||
    csosStatus === "loading" ||
    customersStatus === "loading";

  const hasError = adminPlansError || loansError || csosError || customersError;

  const dashboardTotals = dashboardOverview?.data || {};
  const isFiltered = selectedMonth !== "all" || csoFilter !== "all" || searchTerm !== "" || typeFilter !== "all";

  const displayTotals = isFiltered ? filteredTotals : {
    deposited: dashboardTotals.totalDeposit || (Number(dashboardTotals.savingsDeposited || 0) + Number(dashboardTotals.loanRepaid || 0)) || overallTotals.deposited,
    withdrawn: dashboardTotals.savingsWithdrawn || overallTotals.withdrawn,
    savingsBalance: dashboardTotals.availableBalance || overallTotals.savingsBalance,
    loanBalance: dashboardTotals.loanOutstanding || overallTotals.loanBalance,
    totalFees: dashboardTotals.totalMaintenance || (Number(dashboardTotals.savingsFees || 0) + Number(dashboardTotals.loanFees || 0)) || overallTotals.totalFees,
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Financial overview</p>
          <h1 className="text-3xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">
            Review savings and loan performance by month, including deposits, withdrawals, fees, and outstanding balances.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshData}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className="h-4 w-4" /> Refresh data
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deposited</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(displayTotals.deposited)}</p>
          <p className="text-xs text-slate-500">Gross inflow (Savings + Loans)</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Withdrawn</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(displayTotals.withdrawn)}</p>
          <p className="text-xs text-slate-500">Savings paid out to customers</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Savings balance</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(displayTotals.savingsBalance)}</p>
          <p className="text-xs text-slate-500">Current available savings</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outstanding loans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(displayTotals.loanBalance)}</p>
          <p className="text-xs text-slate-500">Principal balance remaining</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Total fees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(displayTotals.totalFees)}</p>
          <p className="text-xs text-primary/60">Combined revenue from fees</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by plan, customer, or CSO"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All plans</option>
                <option value="savings">Savings only</option>
                <option value="loan">Loans only</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={csoFilter}
                onChange={(event) => setCsoFilter(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {csoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {sortedRecords.length.toLocaleString()} plan{sortedRecords.length === 1 ? "" : "s"} in view
          </div>
        </div>

        <div className="mt-6">
          {hasError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {adminPlansError || loansError || csosError || customersError}
            </div>
          ) : isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading transactions…
            </div>
          ) : !sortedRecords.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
              No transactions match your filters.
            </div>
          ) : (
            <>
              <AllTransactionTable
                plans={paginatedRecords}
                formatCurrency={formatCurrency}
                page={currentPage}
                pageSize={pageSize}
                totalCount={totalRecords}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Page {Math.min(currentPage, totalPages).toLocaleString()} of {totalPages.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={!canGoPrev}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={!canGoNext}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Overall totals</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Deposited</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(overallTotals.deposited)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Withdrawn</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(overallTotals.withdrawn)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Maintenance fees</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(overallTotals.maintenanceFees)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Loan fees</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(overallTotals.loanFees)}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Totals represent all loaded plans, regardless of the selected filters above.
        </div>
      </section>
    </div>
  );
}

