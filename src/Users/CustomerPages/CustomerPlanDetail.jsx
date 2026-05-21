import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  PiggyBank,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  PieChart,
} from "lucide-react";
import { fetchMyPlanDetails, clearSelectedPlan } from "../../redux/slices/customerDataSlice";
import { motion, AnimatePresence } from "framer-motion";

const HISTORY_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "fees", label: "Fees" },
];

const CATEGORY_STYLES = {
  deposit: { badge: "bg-emerald-100 text-emerald-700", amount: "text-emerald-600" },
  withdrawal: { badge: "bg-rose-100 text-rose-700", amount: "text-rose-600" },
  fee: { badge: "bg-amber-100 text-amber-700", amount: "text-amber-600" },
  other: { badge: "bg-slate-200 text-slate-600", amount: "text-slate-600" },
};

const CONTRIBUTION_PALETTE = [
  {
    container: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "text-emerald-700",
    slotBg: "bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 text-emerald-100",
    slotBorder: "border-emerald-500",
    slotRing: "ring-emerald-400",
    slotDot: "bg-emerald-400",
    slotText: "text-emerald-200",
  },
  {
    container: "bg-indigo-50 border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    accent: "text-indigo-700",
    slotBg: "bg-gradient-to-br from-indigo-500/20 via-slate-900 to-slate-950 text-indigo-100",
    slotBorder: "border-indigo-500",
    slotRing: "ring-indigo-400",
    slotDot: "bg-indigo-400",
    slotText: "text-indigo-200",
  },
  {
    container: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    accent: "text-amber-700",
    slotBg: "bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 text-amber-100",
    slotBorder: "border-amber-500",
    slotRing: "ring-amber-400",
    slotDot: "bg-amber-400",
    slotText: "text-amber-200",
  },
  {
    container: "bg-rose-50 border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    accent: "text-rose-700",
    slotBg: "bg-gradient-to-br from-rose-500/20 via-slate-900 to-slate-950 text-rose-100",
    slotBorder: "border-rose-500",
    slotRing: "ring-rose-400",
    slotDot: "bg-rose-400",
    slotText: "text-rose-200",
  },
  {
    container: "bg-sky-50 border-sky-200",
    badge: "bg-sky-100 text-sky-700",
    accent: "text-sky-700",
    slotBg: "bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 text-sky-100",
    slotBorder: "border-sky-500",
    slotRing: "ring-sky-400",
    slotDot: "bg-sky-400",
    slotText: "text-sky-200",
  },
  {
    container: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    accent: "text-purple-700",
    slotBg: "bg-gradient-to-br from-purple-500/20 via-slate-900 to-slate-950 text-purple-100",
    slotBorder: "border-purple-500",
    slotRing: "ring-purple-400",
    slotDot: "bg-purple-400",
    slotText: "text-purple-200",
  },
];

const LOAN_SLOT_STYLES = {
  paid: {
    background: "bg-slate-900 text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  missed: {
    background: "bg-slate-900 text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  upcoming: {
    background: "bg-slate-900/50 text-slate-500",
    border: "border-slate-800",
    dot: "bg-slate-700",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const toTitleCase = (value) => {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getMonthKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Normalize to local date to avoid UTC shifts
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 7);
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const formatMonthLabel = (key) => {
  if (!key || typeof key !== "string") return "All months";
  const [year, month] = key.split("-").map((token) => Number.parseInt(token, 10));
  if (!year || !month) return key;
  return monthFormatter.format(new Date(year, month - 1, 1));
};

function Modal({ open, title, onClose, children, widthClass = "max-w-2xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 transition-opacity p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`relative w-full ${widthClass} rounded-[40px] bg-white shadow-2xl overflow-hidden`}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-white p-2 text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[80vh] overflow-y-auto p-8">{children}</div>
      </motion.div>
    </div>
  );
}

export default function CustomerPlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedPlan } = useSelector((state) => state.customerData);
  const [historyCategory, setHistoryCategory] = useState("all");
  const [selectedMonths, setSelectedMonths] = useState(["all"]);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const monthDropdownRef = useRef(null);

  const [isLoanCardModalOpen, setIsLoanCardModalOpen] = useState(false);
  const [isContributionCardOpen, setIsContributionCardOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedWardCell, setSelectedWardCell] = useState(null);
  const [isWardSlotDetailOpen, setIsWardSlotDetailOpen] = useState(false);

  useEffect(() => {
    if (planId) {
      dispatch(fetchMyPlanDetails(planId));
    }
    return () => dispatch(clearSelectedPlan());
  }, [planId, dispatch]);

  const { plan, entries, status, error } = selectedPlan;

  const entriesWithMeta = useMemo(() => {
    return (entries || []).map(entry => {
      const date = new Date(entry.recordedAt || entry.createdAt);
      const monthKey = getMonthKey(date);
      const matchesSearch = !searchTerm.trim() || (entry.narration || "").toLowerCase().includes(searchTerm.trim().toLowerCase());
      return { ...entry, monthKey, matchesSearch };
    }).sort((a, b) => new Date(b.recordedAt || b.createdAt) - new Date(a.recordedAt || a.createdAt));
  }, [entries, searchTerm]);

  const historyMonthOptions = useMemo(() => {
    const unique = new Set();
    entriesWithMeta.forEach(e => {
      if (e.monthKey) unique.add(e.monthKey);
    });
    return Array.from(unique).sort((a, b) => b.localeCompare(a));
  }, [entriesWithMeta]);

  const filteredEntries = useMemo(() => {
    const isAllMonthsSelected = selectedMonths.includes("all");
    return entriesWithMeta.filter(e => {
      if (historyCategory !== "all" && e.type !== historyCategory) return false;
      if (!isAllMonthsSelected && !selectedMonths.includes(e.monthKey)) return false;
      if (!e.matchesSearch) return false;
      return true;
    });
  }, [entriesWithMeta, historyCategory, selectedMonths]);

  const toggleMonthSelection = (month) => {
    setSelectedMonths(prev => {
      if (month === "all") return ["all"];
      const withoutAll = prev.filter(m => m !== "all");
      if (withoutAll.includes(month)) {
        const next = withoutAll.filter(m => m !== month);
        return next.length ? next : ["all"];
      }
      return [...withoutAll, month].sort((a, b) => b.localeCompare(a));
    });
  };

  useEffect(() => {
    if (!isMonthDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMonthDropdownOpen]);

  const contributionMonthOptions = useMemo(() => {
    const unique = new Set();
    entries.forEach((e) => {
      if (e.type === "deposit") {
        const key = getMonthKey(e.recordedAt || e.createdAt);
        if (key) unique.add(key);
      }
    });
    return Array.from(unique).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  useEffect(() => {
    if (selectedMonth === "all" && contributionMonthOptions.length > 0) {
      setSelectedMonth(contributionMonthOptions[0]);
    }
  }, [contributionMonthOptions, selectedMonth]);

  const contributionUnit = plan?.dailyContribution || 1;

  const loanMetrics = useMemo(() => {
    if (!plan || plan.planType !== "loan") return null;
    const loanAmount = plan.loanDetails?.amount || plan.lastLoanRequestAmount || 0;
    const maintenanceFee = plan.totalFees || 0;
    const amountPaid = Math.max(0, (plan.totalDeposited || 0) - maintenanceFee);
    const loanBalance = Math.max(0, loanAmount - amountPaid);
    return { loanAmount, maintenanceFee, amountPaid, loanBalance };
  }, [plan]);

  // Logic for Cards (Wards / Loan Slots)
  const wardCells = useMemo(() => {
    if (!plan || plan.planType === "loan") return [];
    
    // Group deposits by date
    const dailyGroupings = new Map();
    const deposits = entries
      .filter(e => e.type === "deposit")
      .sort((a, b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt));

    deposits.forEach(dep => {
      const d = new Date(dep.recordedAt || dep.createdAt);
      const dateKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      
      if (!dailyGroupings.has(dateKey)) {
        dailyGroupings.set(dateKey, { total: 0, entries: [] });
      }
      const group = dailyGroupings.get(dateKey);
      group.total += Number(dep.amount || 0);
      group.entries.push(dep);
    });

    const slots = [];
    let currentSlot = 1;
    let paletteIdx = 0;

    const sortedDays = Array.from(dailyGroupings.keys())
      .filter((key) => {
        if (selectedMonth === "all") return true;
        return getMonthKey(key) === selectedMonth;
      })
      .sort((a, b) => a - b);
    
    sortedDays.forEach(dateKey => {
      const group = dailyGroupings.get(dateKey);
      const units = Math.max(1, Math.ceil(group.total / contributionUnit));
      const palette = CONTRIBUTION_PALETTE[paletteIdx % CONTRIBUTION_PALETTE.length];
      paletteIdx++;

      for (let i = 0; i < units; i++) {
        slots.push({ 
          slot: currentSlot++, 
          filled: true, 
          palette, 
          entries: group.entries,
          groupTotal: group.total,
          dateKey
        });
      }
    });

    while (slots.length < 30) slots.push({ slot: currentSlot++, filled: false });
    return slots;
  }, [plan, entries, contributionUnit, selectedMonth]);

  const loanCardSlots = useMemo(() => {
    if (!plan || plan.planType !== "loan") return [];
    const slots = [];
    const baseDate = new Date(plan.loanDetails?.startDate || plan.startDate);
    const payments = entries.filter(e => e.type === "deposit").sort((a,b) => new Date(a.recordedAt) - new Date(b.recordedAt));
    
    for (let i = 0; i < 32; i++) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(baseDate.getDate() + i);
        const isPaid = i < payments.length;
        const status = isPaid ? "paid" : (scheduledDate < new Date() ? "missed" : "upcoming");
        slots.push({ slot: i + 1, scheduledDate, status, payment: isPaid ? payments[i] : null });
    }
    return slots;
  }, [plan, entries]);

  if (status === "loading" && !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-xl text-center border border-rose-100">
           <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <PieChart className="w-10 h-10" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Error</h2>
           <p className="text-slate-500 font-medium mb-8">{error}</p>
           <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">Try again</button>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/customer/dashboard")} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{plan.planName}</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Status: {plan.status}</p>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        {/* Top Feature Cards */}
        <section className="grid gap-6 md:grid-cols-4">
          <article className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Type</p>
            <div className="mt-4">
              {plan.planType === 'loan' ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold ring-1 ring-amber-100">
                  <TrendingDown className="h-4 w-4" /> Loan Product
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold ring-1 ring-emerald-100">
                  <TrendingUp className="h-4 w-4" /> Savings Product
                </span>
              )}
            </div>
          </article>

          <article className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {plan.planType === 'loan' ? 'Loan Amount' : 'Available Balance'}
            </p>
            <h2 className={`text-3xl font-bold mt-2 ${plan.planType === 'loan' ? 'text-white' : 'text-emerald-400'}`}>
              {formatCurrency(plan.planType === 'loan' ? loanMetrics.loanAmount : plan.availableBalance)}
            </h2>
          </article>

          <article className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {plan.planType === 'loan' ? 'Amount Paid' : 'Total Deposited'}
            </p>
            <h2 className={`text-3xl font-bold mt-2 ${plan.planType === 'loan' ? 'text-emerald-400' : 'text-white'}`}>
              {formatCurrency(plan.planType === 'loan' ? loanMetrics.amountPaid : plan.totalDeposited)}
            </h2>
          </article>

          {plan.planType === 'loan' ? (
            <article className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Loan Balance</p>
              <h2 className="text-3xl font-bold text-rose-500 mt-2">{formatCurrency(loanMetrics.loanBalance)}</h2>
            </article>
          ) : (
            <article className="bg-slate-900 rounded-[32px] p-6 shadow-xl border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visual Status</p>
              <button 
                onClick={() => setIsContributionCardOpen(true)}
                className="mt-4 w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border border-white/10"
              >
                <PiggyBank className="h-4 w-4" />
                Open Card
              </button>
            </article>
          )}
        </section>

        {/* Detailed Info Section */}
        <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 md:p-10">
           <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">General Information</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</dt>
                    <dd className="text-base font-bold text-slate-900">{formatDate(plan.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {plan.planType === 'loan' ? 'Daily Repayment' : 'Daily Contribution'}
                    </dt>
                    <dd className="text-base font-bold text-slate-900">{formatCurrency(plan.dailyContribution)}</dd>
                  </div>
                  {plan.planType === 'loan' && (
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maintenance Fee</dt>
                      <dd className="text-base font-bold text-slate-900">{formatCurrency(loanMetrics.maintenanceFee)}</dd>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Plan Performance</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fees Paid</dt>
                    <dd className="text-base font-bold text-amber-600">{formatCurrency(plan.totalFees)}</dd>
                  </div>
                  {plan.planType !== 'loan' && (
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Withdrawn</dt>
                      <dd className="text-base font-bold text-rose-600">{formatCurrency(plan.totalWithdrawn)}</dd>
                    </div>
                  )}
                  {plan.planType === 'loan' && (
                    <div className="col-span-2 space-y-8">
                       <div>
                        <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Loan Status</dt>
                        <dd className="text-2xl font-black text-rose-600 uppercase tracking-tight">{plan.loanStatus}</dd>
                      </div>
                      <button 
                        onClick={() => setIsLoanCardModalOpen(true)}
                        className="w-full h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl shadow-slate-200"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Repayment Schedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </section>

        {/* Transaction History Section */}
        <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <header className="px-8 py-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
             <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {HISTORY_CATEGORIES.map(cat => (
                  <button 
                    key={cat.value}
                    onClick={() => setHistoryCategory(cat.value)}
                    className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      historyCategory === cat.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
             </div>

             <div className="flex flex-wrap items-center gap-4">
                <div ref={monthDropdownRef} className="relative">
                  <button 
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <Filter className="w-3 h-3" />
                    <span>{selectedMonths.includes("all") ? "All Months" : `${selectedMonths.length} Selected`}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isMonthDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 max-h-60 overflow-y-auto space-y-1">
                          <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={selectedMonths.includes("all")}
                              onChange={() => toggleMonthSelection("all")}
                              className="rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-bold text-slate-700">All Months</span>
                          </label>
                          <div className="h-px bg-slate-50 my-2" />
                          {historyMonthOptions.map(m => (
                            <label key={m} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedMonths.includes(m)}
                                onChange={() => toggleMonthSelection(m)}
                                className="rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <span className="text-xs font-bold text-slate-600">{formatMonthLabel(m)}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search history..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 lg:w-64 transition-all"
                  />
                </div>

                <button 
                  onClick={() => {/* Download logic if needed */}}
                  className="p-2 bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
             </div>
          </header>

          <div className="overflow-x-auto">
            {!filteredEntries.length ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold">No transactions found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <th className="px-8 py-4">Date & Time</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Description</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEntries.map((entry, idx) => (
                    <motion.tr 
                      key={entry._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{formatDateTime(entry.recordedAt)}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_STYLES[entry.type]?.badge || CATEGORY_STYLES.other.badge}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-700 max-w-xs truncate">{entry.narration || 'General transaction'}</td>
                      <td className={`px-8 py-5 text-right font-black tabular-nums ${CATEGORY_STYLES[entry.type]?.amount || CATEGORY_STYLES.other.amount}`}>
                        {formatCurrency(entry.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isLoanCardModalOpen && (
          <Modal open={true} title="Loan Repayment Schedule" onClose={() => setIsLoanCardModalOpen(false)} widthClass="max-w-6xl">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {loanCardSlots.map((slot) => {
                  const style = LOAN_SLOT_STYLES[slot.status] || LOAN_SLOT_STYLES.upcoming;
                  return (
                    <div key={slot.slot} className={`p-4 rounded-[24px] border shadow-sm flex flex-col items-center justify-center transition-all ${style.background} ${style.border}`}>
                       <span className="text-[10px] font-black uppercase mb-2 opacity-60">Slot {slot.slot}</span>
                       <div className={`w-3 h-3 rounded-full ${style.dot} mb-2`} />
                       <p className="text-[10px] font-bold text-center leading-tight">{formatDate(slot.scheduledDate)}</p>
                       <p className="text-[9px] font-black uppercase mt-1 opacity-60">{slot.status}</p>
                    </div>
                  );
                })}
            </div>
          </Modal>
        )}

        {isContributionCardOpen && (
          <Modal open={true} title="Savings Contribution Grid" onClose={() => setIsContributionCardOpen(false)} widthClass="max-w-6xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {contributionMonthOptions.map(m => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total for {formatMonthLabel(selectedMonth)}</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {formatCurrency(wardCells.reduce((acc, c) => acc + (c.filled ? (c.groupTotal / (wardCells.filter(x => x.dateKey === c.dateKey).length)) : 0), 0))}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[40px] bg-slate-950 p-8 shadow-inner">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                  {wardCells.map((cell) => {
                    const isSelected = selectedWardCell?.slot === cell.slot && isWardSlotDetailOpen;
                    return (
                      <button
                        key={cell.slot}
                        onClick={() => {
                          if (cell.filled) {
                            setSelectedWardCell(cell);
                            setIsWardSlotDetailOpen(true);
                          }
                        }}
                        className={`aspect-square rounded-[24px] border shadow-sm flex flex-col items-center justify-center transition-all ${
                          cell.filled 
                            ? `${cell.palette.slotBg} ${cell.palette.slotBorder} ${isSelected ? 'ring-4 ' + cell.palette.slotRing + ' scale-110' : 'hover:scale-105'} active:scale-95` 
                            : 'bg-slate-900 border-slate-800 cursor-default'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full px-3 mb-1">
                          <span className="text-[10px] font-black uppercase opacity-40">#{cell.slot}</span>
                          <div className={`w-2 h-2 rounded-full ${cell.filled ? cell.palette.slotDot : 'bg-slate-800'}`} />
                        </div>
                        {cell.filled ? (
                          <span className={`text-[11px] font-black tracking-tight ${cell.palette.slotText}`}>
                            {formatCurrency(contributionUnit)}
                          </span>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {isWardSlotDetailOpen && selectedWardCell && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-10 flex items-center justify-center p-4"
                  >
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm rounded-[40px]" onClick={() => setIsWardSlotDetailOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Slot Details</p>
                          <h4 className="text-2xl font-black text-slate-900">Slot {selectedWardCell.slot}</h4>
                        </div>
                        <button onClick={() => setIsWardSlotDetailOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px]">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="text-lg font-black text-slate-900">{formatDate(selectedWardCell.dateKey)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deposited</p>
                            <p className="text-lg font-black text-emerald-600">{formatCurrency(selectedWardCell.groupTotal)}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Deposits</p>
                           <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                              {selectedWardCell.entries.map((entry) => (
                                <div key={entry._id} className="p-5 border border-slate-100 rounded-[28px] bg-white shadow-sm hover:border-emerald-100 transition-colors">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-black text-slate-900">{formatCurrency(entry.amount)}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{formatDateTime(entry.recordedAt || entry.createdAt)}</p>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{entry.narration || 'Regular Contribution'}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
