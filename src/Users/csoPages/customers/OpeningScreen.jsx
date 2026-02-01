export default function CustomersPlaceholder() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">Select a customer</h2>
      <p className="max-w-md text-sm text-slate-500">
        Pick a customer from the directory to view their daily savings plans, record deposits, or withdraw balances. You can also create new savings plans directly from the customer card.
      </p>
    </div>
  );
}
