import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  Loader2,
  PiggyBank,
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
    slotBg: "bg-slate-900 text-emerald-400",
    slotBorder: "border-emerald-500/30",
    slotDot: "bg-emerald-400",
  },
  {
    slotBg: "bg-slate-900 text-indigo-400",
    slotBorder: "border-indigo-500/30",
    slotDot: "bg-indigo-400",
  },
  {
    slotBg: "bg-slate-900 text-amber-400",
    slotBorder: "border-amber-500/30",
    slotDot: "bg-amber-400",
  },
  {
    slotBg: "bg-slate-900 text-rose-400",
    slotBorder: "border-rose-500/30",
    slotDot: "bg-rose-400",
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
  const [isLoanCardModalOpen, setIsLoanCardModalOpen] = useState(false);
  const [isContributionCardOpen, setIsContributionCardOpen] = useState(false);

  useEffect(() => {
    if (planId) {
      dispatch(fetchMyPlanDetails(planId));
    }
    return () => dispatch(clearSelectedPlan());
  }, [planId, dispatch]);

  const { plan, entries, status, error } = selectedPlan;

  const filteredEntries = useMemo(() => {
    if (historyCategory === "all") return entries;
    return entries.filter(e => e.type === historyCategory);
  }, [entries, historyCategory]);

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

    const sortedDays = Array.from(dailyGroupings.keys()).sort((a, b) => a - b);
    
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
          detail: group.entries[0], // Reference first entry for details
          groupTotal: group.total,
          dateKey
        });
      }
    });

    while (slots.length < 30) slots.push({ slot: currentSlot++, filled: false });
    return slots;
  }, [plan, entries, contributionUnit]);

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
          <header className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
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
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {wardCells.map((cell) => (
                <div key={cell.slot} className={`aspect-square rounded-[24px] border shadow-sm flex flex-col items-center justify-center transition-all ${
                  cell.filled ? `${cell.palette.slotBg} ${cell.palette.slotBorder}` : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className="text-[10px] font-black uppercase mb-1 opacity-60">{cell.slot}</span>
                  {cell.filled ? (
                    <>
                      <div className={`w-3 h-3 rounded-full ${cell.palette.slotDot} mb-1`} />
                      <span className="text-[9px] font-black tracking-tighter">{formatCurrency(contributionUnit)}</span>
                    </>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  )}
                </div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
