import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCsos,
  createCso,
  setSelectedCso,
  resetCsoStatus,
  updateCsoStatus,
  updateCso,
  fetchAdminCsoDetail,
  deleteCso,
} from "../../../redux/slices/csoSlice";
import { fetchBranches } from "../../../redux/slices/branchSlice";
import {
  Plus,
  MoreVertical,
  X,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";

const defaultFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  branchId: "",
  address: "",
  workId: "",
  guaratorName: "",
  guaratorAddress: "",
  guaratorPhone: "",
  guaratorEmail: "",
  dateOfBirth: "",
};

function Modal({ open, title, onClose, children, widthClass = "max-w-4xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div
        className={`flex w-full flex-col ${widthClass} max-h-[90vh] rounded-2xl bg-white shadow-2xl md:max-h-[80vh]`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function CsoForm({ initialValues, onSubmit, submitting, branches }) {
  const [formValues, setFormValues] = useState(initialValues ?? defaultFormValues);

  useEffect(() => {
    setFormValues(initialValues ?? defaultFormValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...formValues,
      branchId: formValues.branchId,
      guaratorEmail: formValues.guaratorEmail || undefined,
      dateOfBirth: formValues.dateOfBirth ? new Date(formValues.dateOfBirth).toISOString() : undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Personal details</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-600">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={formValues.firstName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ada"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-600">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={formValues.lastName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Okafor"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-600">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="cso@email.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-600">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="08012345678"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-600">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formValues.dateOfBirth}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-600">
              Residential address
            </label>
            <input
              id="address"
              name="address"
              value={formValues.address}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Street, City"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employment</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="branchId" className="block text-sm font-medium text-slate-600">
              Branch
            </label>
            <select
              id="branchId"
              name="branchId"
              value={formValues.branchId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                Select branch
              </option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="workId" className="block text-sm font-medium text-slate-600">
              Work ID
            </label>
            <input
              id="workId"
              name="workId"
              value={formValues.workId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. CSO-0012"
            />
            <p className="text-xs text-slate-400">Default password will match the Work ID.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Guarantor</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="guaratorName" className="block text-sm font-medium text-slate-600">
              Full name
            </label>
            <input
              id="guaratorName"
              name="guaratorName"
              value={formValues.guaratorName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Guarantor name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guaratorPhone" className="block text-sm font-medium text-slate-600">
              Phone number
            </label>
            <input
              id="guaratorPhone"
              name="guaratorPhone"
              value={formValues.guaratorPhone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="08012345678"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guaratorEmail" className="block text-sm font-medium text-slate-600">
              Email address
            </label>
            <input
              id="guaratorEmail"
              name="guaratorEmail"
              type="email"
              value={formValues.guaratorEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="guarantor@email.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="guaratorAddress" className="block text-sm font-medium text-slate-600">
              Address
            </label>
            <textarea
              id="guaratorAddress"
              name="guaratorAddress"
              value={formValues.guaratorAddress}
              onChange={handleChange}
              required
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Street, City, State"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save CSO
        </button>
      </div>
    </form>
  );
}

export default function CsoPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    items,
    status,
    error,
    mutationStatus,
    mutationError,
    lastActionId,
    detailStatus,
    detailError,
    selectedCso,
    selectedCsoCustomers,
  } = useSelector((state) => state.csos);
  const { items: branchItems, status: branchStatus } = useSelector((state) => state.branches);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [handledActionId, setHandledActionId] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferCustomersCount, setTransferCustomersCount] = useState(0);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCsos());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (branchStatus === "idle") {
      dispatch(fetchBranches());
    }
  }, [branchStatus, dispatch]);

  useEffect(() => {
    if (lastActionId && lastActionId !== handledActionId) {
      setIsCreateOpen(false);
      setIsTransferOpen(false);
      setHandledActionId(lastActionId);
    }
  }, [lastActionId, handledActionId]);

  useEffect(() => {
    if (!isCreateOpen) {
      dispatch(resetCsoStatus());
    }
  }, [isCreateOpen, dispatch]);

  useEffect(() => {
    const handleClick = () => setVisibleMenuId(null);
    if (visibleMenuId) {
      document.addEventListener("click", handleClick);
    }
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [visibleMenuId]);

  const handleCreate = (formValues) => {
    dispatch(createCso(formValues));
  };

  const handleStatusToggle = (cso) => {
    dispatch(updateCsoStatus({ csoId: cso._id, isActive: !cso.isActive }));
  };

  const handleDeleteCso = (csoId) => {
    const confirmed = window.confirm("Are you sure you want to delete this CSO? This action cannot be undone.");
    if (!confirmed) return;
    dispatch(deleteCso(csoId));
  };

  const closeTransferModal = () => {
    setIsTransferOpen(false);
    setTransferTarget(null);
    setTransferBranchId("");
    setTransferCustomersCount(0);
    setTransferError("");
  };

  const handleOpenTransfer = (cso) => {
    setVisibleMenuId(null);
    setTransferTarget(cso);
    setTransferBranchId(cso.branchId || "");
    setTransferCustomersCount(0);
    setTransferError("");
    setIsTransferOpen(true);
    dispatch(fetchAdminCsoDetail(cso._id));
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    if (!transferTarget?._id) {
      setTransferError("Unable to determine the selected CSO. Please try again.");
      return;
    }

    if (!transferBranchId) {
      setTransferError("Select a destination branch.");
      return;
    }

    if (transferBranchId === transferTarget.branchId) {
      setTransferError("Select a different branch to proceed.");
      return;
    }

    if (transferCustomersCount > 0) {
      setTransferError("Transfer customers to another CSO before moving this officer.");
      return;
    }

    setTransferError("");
    dispatch(updateCso({ csoId: transferTarget._id, updates: { branchId: transferBranchId } }))
      .unwrap()
      .then(() => {
        closeTransferModal();
      })
      .catch((errorMessage) => {
        setTransferError(errorMessage || "Failed to transfer CSO. Please try again.");
      });
  };

  const isDetailLoading = isTransferOpen && detailStatus === "loading";
  const transferCustomersBlocked = isTransferOpen && transferCustomersCount > 0;
  const isTransferring = isTransferOpen && mutationStatus === "loading";

  useEffect(() => {
    if (!isTransferOpen) {
      return;
    }

    if (detailStatus === "succeeded" && selectedCso?._id === transferTarget?._id) {
      setTransferCustomersCount((selectedCsoCustomers || []).length);
    }

    if (detailStatus === "failed") {
      setTransferError(detailError || "Unable to load CSO details. Please try again.");
    }
  }, [isTransferOpen, detailStatus, selectedCso, transferTarget, selectedCsoCustomers, detailError]);

  const openCreateModal = () => {
    setIsCreateOpen(true);
    dispatch(setSelectedCso(null));
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    dispatch(resetCsoStatus());
  };

  const pending = status === "loading";
  const mutationPending = mutationStatus === "loading";

  const tableContent = useMemo(() => {
    if (pending) {
      return (
        <tr>
          <td colSpan={7} className="py-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
            Loading CSOs…
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className="py-16 text-center text-sm text-red-500">
            {error}
          </td>
        </tr>
      );
    }

    if (!items.length) {
      return (
        <tr>
          <td colSpan={7} className="py-16 text-center text-sm text-slate-500">
            No CSOs yet. Add the first field officer to get started.
          </td>
        </tr>
      );
    }

    return items.map((cso) => (
      <tr key={cso._id} className="group relative border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
          {cso.firstName} {cso.lastName}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {cso.email}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {cso.phone}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {cso.branchName || "—"}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-700 text-center">
          {cso.totalPlans || 0}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              cso.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {cso.isActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {cso.isActive ? "Active" : "Suspended"}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <div className="relative inline-block text-left">
            <button
              type="button"
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={(event) => {
                event.stopPropagation();
                setVisibleMenuId((prev) => (prev === cso._id ? null : cso._id));
              }}
              aria-label="Open CSO actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {visibleMenuId === cso._id ? (
              <div
                role="menu"
                onClick={(event) => event.stopPropagation()}
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => {
                    dispatch(setSelectedCso(cso));
                    navigate(`/admin/cso/${cso._id}`);
                    setVisibleMenuId(null);
                  }}
                >
                  View details
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => handleOpenTransfer(cso)}
                >
                  Transfer
                </button>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                    cso.isActive
                      ? "text-amber-600 hover:bg-amber-50"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                  onClick={() => {
                    handleStatusToggle(cso);
                    setVisibleMenuId(null);
                  }}
                >
                  {cso.isActive ? "Suspend" : "Activate"}
                </button>
                <div className="my-1 border-t border-slate-100" />
                {/* <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    handleDeleteCso(cso._id);
                    setVisibleMenuId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete CSO
                </button> */}
              </div>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }, [items, pending, error, visibleMenuId, dispatch, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customer Success Officers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage CSOs, monitor performance, and onboard new officers across branches.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add CSO
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CSO
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Branch
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Monthly Plans
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">{tableContent}</tbody>
          </table>
        </div>
      </div>

      <Modal open={isCreateOpen} title="Add new CSO" onClose={closeCreateModal}>
        {mutationError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {mutationError}
          </div>
        ) : null}

        <CsoForm
          initialValues={defaultFormValues}
          onSubmit={handleCreate}
          submitting={mutationPending}
          branches={branchItems}
        />
      </Modal>

      <Modal
        open={isTransferOpen}
        title="Transfer CSO to another branch"
        onClose={closeTransferModal}
        widthClass="max-w-lg"
      >
        {!transferTarget ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            Select a CSO to continue.
          </div>
        ) : isDetailLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Checking CSO details…
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleTransferSubmit}>
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Move {transferTarget.firstName} {transferTarget.lastName} to a different branch.
              </p>
              {transferCustomersCount > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                  <p className="font-semibold">Customers still assigned</p>
                  <p className="mt-1">
                    {transferTarget.firstName} currently manages {transferCustomersCount}{" "}
                    {transferCustomersCount === 1 ? "customer" : "customers"}. Transfer or reassign these customers
                    before moving the CSO to another branch.
                  </p>
                </div>
              ) : null}
            </div>

            {transferError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {transferError}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="transfer-branch" className="text-sm font-medium text-slate-600">
                Destination branch
              </label>
              <select
                id="transfer-branch"
                value={transferBranchId}
                onChange={(event) => setTransferBranchId(event.target.value)}
                disabled={transferCustomersBlocked || isTransferring}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                required
              >
                <option value="" disabled>
                  Select a branch
                </option>
                {(branchItems || []).map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeTransferModal}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={transferCustomersBlocked || isTransferring}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
              >
                {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Transfer
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
