import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  fetchCustomers,
  createCustomer,
  clearCustomerState,
} from "../../../redux/slices/customersSlice";
import {
  createSavingsPlanForCustomer,
  fetchSavingsPlans,
  clearSavingsState,
} from "../../../redux/slices/savingsSlice";
import {
  Plus,
  Users,
  Search,
  Loader2,
  Wallet,
  Target,
  CalendarPlus,
  ArrowRight,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

const defaultCustomerForm = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  email: "",
  password: "",
};

const defaultPlanForm = {
  planName: "",
  dailyContribution: "",
  startDate: "",
  description: "",
};

function Modal({ open, title, onClose, children, widthClass = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className={`relative w-full ${widthClass} rounded-3xl bg-white shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Action Required</p>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function CustomerForm({ initialValues, onSubmit, submitting }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setTouched({});
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  const showError = (name) => touched[name] && !values[name]?.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-600">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              showError("firstName") ? "border-rose-300" : "border-slate-200"
            }`}
            placeholder="Mary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-600">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              showError("lastName") ? "border-rose-300" : "border-slate-200"
            }`}
            placeholder="Okonkwo"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-600">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              showError("phone") ? "border-rose-300" : "border-slate-200"
            }`}
            placeholder="08012345678"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
             className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              showError("email") ? "border-rose-300" : "border-slate-200"
            }`}
            placeholder="customer@email.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-600">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10 ${
                showError("password") ? "border-rose-300" : "border-slate-200"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-slate-600">
          Residential address
        </label>
        <textarea
          id="address"
          name="address"
          value={values.address}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          rows={3}
          className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            showError("address") ? "border-rose-300" : "border-slate-200"
          }`}
          placeholder="Street, City, State"
        />
        {showError("address") ? (
          <p className="text-xs text-rose-500">Address is required.</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save customer
        </button>
      </div>
    </form>
  );
}

function PlanForm({ initialValues, onSubmit, submitting }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setValues(initialValues);
    setTouched({});
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      dailyContribution: Number(values.dailyContribution),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="planName" className="block text-sm font-medium text-slate-600">
            Savings plan name
          </label>
          <input
            id="planName"
            name="planName"
            value={values.planName}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Daily 500 savings"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dailyContribution" className="block text-sm font-medium text-slate-600">
            Daily contribution (₦)
          </label>
          <input
            id="dailyContribution"
            name="dailyContribution"
            type="number"
            min="0"
            step="0.01"
            value={values.dailyContribution}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-600">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={values.startDate}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 shadow-sm focus:outline-none cursor-not-allowed opacity-75"
            />
          </div>
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-600">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Optional notes about the plan"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          Launch savings plan
        </button>
      </div>
    </form>
  );
}

export default function CustomersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error, lastActionId, mutationStatus, mutationError, pagination } = useSelector((state) => state.customers);
  const { plansByCustomer, mutationStatus: savingsMutationStatus, mutationError: savingsMutationError } = useSelector((state) => state.savings);

  const [filters, setFilters] = useState({ search: "" });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [customerFormValues, setCustomerFormValues] = useState(defaultCustomerForm);
  const [planFormValues, setPlanFormValues] = useState(defaultPlanForm);
  const [planCustomerId, setPlanCustomerId] = useState(null);
  const [handledActionId, setHandledActionId] = useState(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 16;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    const params = { page, limit: pageSize };
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    dispatch(fetchCustomers(params));
  }, [dispatch, page, debouncedSearch]);

  useEffect(() => {
    if (!pagination) {
      return;
    }

    const totalPagesFromServer = Math.max(pagination.pages || 1, 1);
    const requestedPage = Math.max(pagination.page || 1, 1);
    const normalizedPage = Math.min(requestedPage, totalPagesFromServer);
    if (normalizedPage !== page) {
      setPage(normalizedPage);
    }
  }, [pagination, page]);

  useEffect(() => {
    if (lastActionId && lastActionId !== handledActionId) {
      setIsCustomerModalOpen(false);
      setIsPlanModalOpen(false);
      setHandledActionId(lastActionId);
      setCustomerFormValues(defaultCustomerForm);
      setPlanFormValues(defaultPlanForm);
    }
  }, [lastActionId, handledActionId]);

  useEffect(() => () => {
    dispatch(clearCustomerState());
    dispatch(clearSavingsState());
  }, [dispatch]);

  const customers = items || [];
  const totalCustomers = pagination?.total ?? customers.length;
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalCustomers / pageSize));
  const pageLimit = pagination?.limit ?? pageSize;
  const startIndex = totalCustomers ? Math.min((currentPage - 1) * pageLimit + 1, totalCustomers) : 0;
  const endIndex = totalCustomers
    ? Math.min((currentPage - 1) * pageLimit + customers.length, totalCustomers)
    : 0;

  const openCustomerModal = () => {
    setCustomerFormValues(defaultCustomerForm);
    setIsCustomerModalOpen(true);
  };

  const openPlanModal = (customer) => {
    setPlanCustomerId(customer._id);
    setPlanFormValues({
      ...defaultPlanForm,
      planName: `${customer.firstName}'s savings`,
      startDate: new Date().toISOString().slice(0, 10),
    });
    const existing = plansByCustomer[customer._id];
    if (!existing) {
      dispatch(fetchSavingsPlans({ customerId: customer._id }));
    }
    setIsPlanModalOpen(true);
  };

  const handleCreateCustomer = (values) => {
    dispatch(createCustomer(values))
      .unwrap()
      .then(() => {
        setPage(1);
        const params = { page: 1, limit: pageLimit };
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        dispatch(fetchCustomers(params));
      })
      .catch(() => {});
  };

  const handleCreatePlan = (values) => {
    if (!planCustomerId) return;
    dispatch(createSavingsPlanForCustomer({ customerId: planCustomerId, payload: values }))
      .unwrap()
      .then(() => {
        toast.success("Savings plan launched successfully");
        setIsPlanModalOpen(false);
        setPlanFormValues(defaultPlanForm);
        setPlanCustomerId(null);
        dispatch(fetchSavingsPlans({ customerId: planCustomerId }));
        const params = { page: currentPage, limit: pageLimit };
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        dispatch(fetchCustomers(params));
      })
      .catch((err) => {
        toast.error(err || "Unable to create savings plan");
      });
  };

  const loading = status === "loading";
  const mutationLoading = mutationStatus === "loading";
  const planSubmitting = savingsMutationStatus === "loading";

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/70">
              <Users className="h-4 w-4" /> Customer Portfolio
            </p>
            <h1 className="text-3xl font-semibold">Daily Savings Customers</h1>
            {/* <p className="max-w-2xl text-sm text-white/80">
              Track every saver on your route, launch new savings plans in seconds, and keep balances updated without paperwork.
            </p> */}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCustomerModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-primary shadow-lg transition hover:bg-white"
            >
              <Plus className="h-4 w-4" /> Add customer
            </button>
            <button
              type="button"
              onClick={() => {
                const params = { page: currentPage, limit: pageLimit };
                if (debouncedSearch) {
                  params.search = debouncedSearch;
                }
                dispatch(fetchCustomers(params));
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 px-4 py-2 text-sm font-semibold text-white/90 hover:border-white hover:text-white"
            >
              Refresh list
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, search: event.target.value }));
              }}
              placeholder="Search by name or phone"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading customers…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : !customers.length ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No customers yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Start by onboarding your first saver. You can launch multiple savings plans for each customer.
              </p>
              <button
                type="button"
                onClick={openCustomerModal}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add customer
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {customers.map((customer) => {
                const summary = customer.savingsSummary || {};
                return (
                  <article
                    key={customer._id}
                    className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm transition hover:shadow-lg"
                  >
                    <header className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </h2>
                        <p className="text-sm text-slate-500">{customer.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/cso/customers/${customer._id}`)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                      >
                        View details <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </header>

                    <p className="mt-3 text-sm text-slate-500">{customer.address}</p>

                    <dl className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-white/70 p-4 text-center">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">Active plans</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900">{summary.activePlans ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">Total deposited</dt>
                        <dd className="mt-1 text-lg font-semibold text-slate-900">
                          ₦{Number(summary.totalDeposited || 0).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">Available</dt>
                        <dd className="mt-1 text-lg font-semibold text-emerald-600">
                          ₦{Number(summary.availableBalance || 0).toLocaleString()}
                        </dd>
                      </div>
                    </dl>

                    <footer className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openPlanModal(customer)}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      >
                        <Wallet className="h-4 w-4" /> New savings plan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/cso/customers/${customer._id}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                      >
                        <Target className="h-4 w-4" /> Manage plans
                      </button>
                    </footer>
                  </article>
                );
              })}
              <div className="lg:col-span-2 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:flex-row">
                <p className="text-center sm:text-left">
                  Showing {startIndex || 0}–{endIndex || 0} of {totalCustomers.toLocaleString()} customers
                  {debouncedSearch ? ` matching “${debouncedSearch}”` : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={isCustomerModalOpen}
        title="Add new customer"
        onClose={() => {
          setIsCustomerModalOpen(false);
          dispatch(clearCustomerState());
        }}
      >
        {mutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {mutationError}
          </div>
        ) : null}
        <CustomerForm
          initialValues={customerFormValues}
          onSubmit={handleCreateCustomer}
          submitting={mutationLoading}
        />
      </Modal>

      <Modal
        open={isPlanModalOpen}
        title="Launch savings plan"
        widthClass="max-w-3xl"
        onClose={() => {
          setIsPlanModalOpen(false);
          dispatch(clearSavingsState());
        }}
      >
        {savingsMutationError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {savingsMutationError}
          </div>
        ) : null}
        <PlanForm initialValues={planFormValues} onSubmit={handleCreatePlan} submitting={planSubmitting} />
      </Modal>
    </div>
  );
}
