import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  PiggyBank,
  CreditCard,
  Wallet,
  Banknote,
  CalendarDays,
  ArrowUpRight,
  MapPin,
  TimerReset,
  Target,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { fetchCsoProfile, fetchCsoDashboardDetail } from "../../redux/slices/csoAuthSlice";
import { fetchCustomers } from "../../redux/slices/customersSlice";
import { fetchSavingsPlans } from "../../redux/slices/savingsSlice";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const getLocalDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthKey = (value) => {
  const dateKey = getLocalDateKey(value);
  return dateKey ? dateKey.slice(0, 7) : null;
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey || typeof monthKey !== "string") {
    return "All months";
  }
  const [year, month] = monthKey.split("-");
  const numericYear = Number(year);
  const numericMonth = Number(month) - 1;
  const date = new Date(numericYear, numericMonth >= 0 ? numericMonth : 0, 1);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
};

const extractEntryMonthKey = (entry) => getMonthKey(entry?.recordedAt || entry?.createdAt || entry?.updatedAt);

const getUniqueMonthsForEntries = (entriesList = []) => {
  const monthSet = new Set();
  entriesList.forEach((entry) => {
    const monthKey = extractEntryMonthKey(entry);
    if (monthKey) {
      monthSet.add(monthKey);
    }
  });
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};


const formatTimeAgo = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
};

const computeLoanOutstanding = (plan) => {
  const principal = Number(plan?.loanDetails?.amount || 0);
  const repaid = Number(plan?.availableBalance || 0);
  const outstanding = principal - repaid;
  return outstanding > 0 ? outstanding : 0;
};

export default function CsoDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    profile,
    status: profileStatus,
    dashboardCustomers,
    dashboardPlans,
    dashboardEntries,
  } = useSelector((state) => state.csoAuth);

  const [dashboardMonth, setDashboardMonth] = useState("all");

  useEffect(() => {
    dispatch(fetchCsoProfile());
    dispatch(fetchCsoDashboardDetail());
  }, [dispatch]);

  const customers = dashboardCustomers || [];
  const plans = dashboardPlans || [];
  const entries = dashboardEntries || [];

  const plansById = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => {
      if (plan?._id) map.set(plan._id.toString(), plan);
    });
    return map;
  }, [plans]);

  const uniqueMonths = useMemo(() => getUniqueMonthsForEntries(entries), [entries]);

  const dashboardStats = useMemo(() => {
    const isLoan = (p) => {
      const status = (p.loanStatus || "").toLowerCase();
      return ["approved", "active", "completed"].includes(status);
    };

    const stats = {
      savings: { deposited: 0, withdrawn: 0, fees: 0, balance: 0, count: 0, dailyTarget: 0 },
      loans: { disbursed: 0, paidBack: 0, fees: 0, balance: 0, count: 0 },
      totalCustomers: customers.length,
      totalRemitted: profile?.remittance?.length
        ? profile.remittance.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)
        : 0,
    };

    const filteredEntries =
      dashboardMonth === "all"
        ? entries
        : entries.filter((e) => extractEntryMonthKey(e) === dashboardMonth);

    filteredEntries.forEach((entry) => {
      const planId = entry.planId?._id || entry.planId;
      const plan = planId ? plansById.get(planId.toString()) : null;
      if (!plan) return;

      const type = (entry.type || "").toLowerCase();
      const amount = Number(
        entry.amount ||
          entry.amountPaid ||
          entry.amountCollected ||
          entry.withdrawalAmount ||
          0,
      );
      const fee = Number(entry.fee || 0);

      if (isLoan(plan)) {
        if (type.includes("repayment") || type === "deposit") {
          stats.loans.paidBack += amount;
        }
        if (type === "fee") {
          stats.loans.fees += amount;
        } else {
          stats.loans.fees += fee;
        }
      } else {
        if (type === "deposit") {
          stats.savings.deposited += amount;
        } else if (type.includes("withdraw")) {
          stats.savings.withdrawn += amount;
        }
        if (type === "fee") {
          stats.savings.fees += amount;
        } else {
          stats.savings.fees += fee;
        }
      }
    });

    plans.forEach((plan) => {
      if (isLoan(plan)) {
        stats.loans.count += 1;
        stats.loans.balance += Number(plan.loanDetails?.balance || plan.availableBalance || 0);

        const planMonth = getMonthKey(plan.startDate || plan.createdAt);
        if (dashboardMonth === "all" || planMonth === dashboardMonth) {
          stats.loans.disbursed += Number(plan.loanDetails?.amount || plan.loanAmount || 0);
        }
      } else {
        stats.savings.count += 1;
        stats.savings.balance += Number(plan.availableBalance || 0);
        stats.savings.dailyTarget += Number(plan.dailyContribution || 0);
      }
    });

    return stats;
  }, [customers, entries, plans, plansById, profile?.remittance, dashboardMonth]);

  const activeSavings = plans.filter(
    (plan) => !plan.isLoan && (plan.status || "").toLowerCase() === "active",
  ).length;
  const activeLoans = plans.filter(
    (plan) => plan.isLoan && (plan.status || "").toLowerCase() === "active",
  ).length;

  const overdueLoans = plans.filter((plan) => {
    if (!plan.isLoan) return false;
    const status = (plan.loanDetails?.status || plan.loanStatus || plan.status || "").toLowerCase();
    const firstPaymentDate = plan.loanDetails?.firstPaymentDate || plan.loanDetails?.startDate;
    if (!firstPaymentDate) return false;
    const date = new Date(firstPaymentDate);
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 30 && !["completed", "closed"].includes(status);
  }).length;

  const portfolioBreakdown = useMemo(() => {
    const totalPlans = plans.length || 1;
    const sections = [
      {
        label: "Savings",
        value: plans.filter((p) => !p.isLoan).length,
        subtitle: `${activeSavings} active`,
        color: "bg-emerald-500",
      },
      {
        label: "Loans",
        value: plans.filter((p) => p.isLoan).length,
        subtitle: `${activeLoans} active`,
        color: "bg-indigo-500",
      },
    ];
    return sections.map((section) => ({
      ...section,
      percent: Math.round((section.value / totalPlans) * 100),
    }));
  }, [activeLoans, activeSavings, plans]);

  const topCustomers = useMemo(() => {
    if (!customers.length) return [];
    return [...customers]
      .sort((a, b) => {
        const balanceA = Number(a?.savingsSummary?.availableBalance || 0);
        const balanceB = Number(b?.savingsSummary?.availableBalance || 0);
        return balanceB - balanceA;
      })
      .slice(0, 5);
  }, [customers]);

  const remittances = useMemo(() => {
    const records = profile?.remittance || [];
    if (!records.length) return [];
    return [...records]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 4);
  }, [profile?.remittance]);

  const isLoading = profileStatus === "loading";

  if (isLoading && !profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary/90 px-6 py-8 text-white shadow-xl">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-6 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              <ShieldCheck className="h-4 w-4" /> CSO Command Center
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Welcome back{profile?.firstName ? `, ${profile.firstName}` : ""}
            </h1>
            <p className="max-w-2xl text-sm text-white/80">
              Monitor collections, stay ahead of your loan exposure, and keep every saver on target.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5 text-primary/80" />
                <span className="text-white/60">Filter month:</span>
                <select
                  value={dashboardMonth}
                  onChange={(e) => setDashboardMonth(e.target.value)}
                  className="bg-transparent font-semibold focus:outline-none"
                >
                  <option value="all" className="bg-slate-800 text-white">All months</option>
                  {uniqueMonths.map((m) => (
                    <option key={m} value={m} className="bg-slate-800 text-white">
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              {profile?.branchName && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                  <MapPin className="h-3.5 w-3.5 text-primary/80" /> {profile.branchName}
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Customers", "Products"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (label === "Customers") navigate("/cso");
                  if (label === "Products") navigate("/cso/products");
                }}
                className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-left transition hover:border-white/40 hover:bg-white/20"
              >
                <span className="text-sm font-semibold uppercase tracking-wide text-white/70">{label}</span>
                <span className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                  Go to {label}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Savings Section */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Savings Section</h2>
          <div className="h-[1px] flex-1 bg-slate-100 mx-4" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Saved</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(dashboardStats.savings.deposited)}</p>
            <p className="mt-1 text-xs text-slate-400">{dashboardStats.savings.count} active plans</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maintenance Fees</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 text-rose-600">{formatCurrency(dashboardStats.savings.fees)}</p>
            <p className="mt-1 text-xs text-slate-400">Deducted from savings</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Withdrawn</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(dashboardStats.savings.withdrawn)}</p>
            <p className="mt-1 text-xs text-slate-400">Cash paid out</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available Balance</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(dashboardStats.savings.balance)}</p>
            <p className="mt-1 text-xs text-slate-400">Net portfolio liquidity</p>
          </div>
        </div>
      </div> */}

      {/* Loan Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Loan Section</h2>
          <div className="h-[1px] flex-1 bg-slate-100 mx-4" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Disbursed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(dashboardStats.loans.disbursed)}</p>
            <p className="mt-1 text-xs text-slate-400">{dashboardStats.loans.count} total loans</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan Fees</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 text-indigo-600">{formatCurrency(dashboardStats.loans.fees)}</p>
            <p className="mt-1 text-xs text-slate-400">Interest & processing</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Repaid</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(dashboardStats.loans.paidBack)}</p>
            <p className="mt-1 text-xs text-slate-400">Recovered capital</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loan Balance</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{formatCurrency(dashboardStats.loans.balance)}</p>
            <p className="mt-1 text-xs text-slate-400">Outstanding exposure</p>
          </div>
        </div>
      </div>


      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio snapshot</p>
              <h2 className="text-xl font-semibold text-slate-900">Savings &amp; loan mix</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/cso/products")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              Manage products
              <ChevronRight className="h-4 w-4" />
            </button>
          </header>

          <div className="grid gap-4">
            {portfolioBreakdown.map((section) => (
              <div key={section.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-12 rounded-full ${section.color}`} />
                    <p className="text-sm font-semibold text-slate-600">{section.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">{section.percent}%</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{section.subtitle}</span>
                  <span>{section.value.toLocaleString()} plan{section.value === 1 ? "" : "s"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`${section.color} h-full rounded-full`}
                    style={{ width: `${section.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus area</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-primary shadow-sm">
                <Target className="h-4 w-4" /> {formatCurrency(dashboardStats.savings.dailyTarget)} in daily commitments
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-amber-600 shadow-sm">
                <TimerReset className="h-4 w-4" /> {overdueLoans} overdue loan{overdueLoans === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </article>

        <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remittance history</p>
              <h2 className="text-xl font-semibold text-slate-900">Recent settlements</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {remittances.length} tracked
            </span>
          </header>

          {remittances.length ? (
            <ul className="space-y-4">
              {remittances.map((item) => (
                <li key={item._id || item.createdAt} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.amountPaid)}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-slate-500">{formatDate(item.createdAt)}</p>
                    <p className="mt-1 text-slate-400">{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Remittance records will appear once you submit your first payment.
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/cso/collection")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Go to collections
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer spotlight</p>
              <h2 className="text-xl font-semibold text-slate-900">Top available balances</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/cso")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
            >
              View all customers
              <ChevronRight className="h-4 w-4" />
            </button>
          </header>

          {topCustomers.length ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full table-auto text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Active plans</th>
                    <th className="px-4 py-3 text-left">Total saved</th>
                    <th className="px-4 py-3 text-left">Available</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {topCustomers.map((customer) => {
                    const summary = customer.savingsSummary || {};
                    return (
                      <tr key={customer._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-900">{customer.firstName} {customer.lastName}</td>
                        <td className="px-4 py-3">{summary.activePlans ?? 0}</td>
                        <td className="px-4 py-3">{formatCurrency(summary.totalDeposited)}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(summary.availableBalance)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/cso/customers/${customer._id}`)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                          >
                            Manage
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Once customers start saving, their balances will appear here.
            </div>
          )}
        </article>

        <article className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rapid insights</p>
            <h2 className="text-xl font-semibold text-slate-900">Quick health checklist</h2>
          </header>

          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800">{activeSavings} savings plan{activeSavings === 1 ? "" : "s"} on track</p>
                <p className="text-xs text-slate-500">
                  Keep collecting {formatCurrency(dashboardStats.savings.dailyTarget)} daily to maintain momentum.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className={`mt-1 h-2 w-2 rounded-full ${overdueLoans ? "bg-amber-500" : "bg-emerald-500"}`} />
              <div>
                <p className="font-semibold text-slate-800">{overdueLoans} overdue loan{overdueLoans === 1 ? "" : "s"}</p>
                <p className="text-xs text-slate-500">
                  Review repayment plans and follow up with borrowers before remittance cut-off.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
              <div>
                <p className="font-semibold text-slate-800">{customers.length} customer relationship{customers.length === 1 ? "" : "s"}</p>
                <p className="text-xs text-slate-500">
                  Strengthen retention by scheduling check-ins with your highest balance savers.
                </p>
              </div>
            </li>
          </ul>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
            <p className="font-semibold">Stay ahead of the curve</p>
            <p className="mt-1 text-primary/80">Use Collections to record deposits in real time and avoid end-of-day rush.</p>
          </div>
        </article>
      </section>

      {isLoading ? (
        <div className="fixed inset-x-0 bottom-4 mx-auto w-fit rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-lg">
          Syncing latest portfolio data…
        </div>
      ) : null}
    </div>
  );
}
