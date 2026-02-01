import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  setSelectedBranch,
  resetBranchStatus,
} from "../../../redux/slices/branchSlice";
import {
  Plus,
  MoreVertical,
  X,
  Loader2,
  MapPin,
  Mail,
  Phone,
  User,
} from "lucide-react";

const defaultFormValues = {
  branchName: "",
  supervisorName: "",
  supervisorEmail: "",
  supervisorPhone: "",
  address: "",
};

function Modal({ open, title, onClose, children, widthClass = "max-w-2xl" }) {
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

function BranchForm({ initialValues, onSubmit, submitting }) {
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
    onSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="branchName" className="block text-sm font-medium text-slate-600">
            Branch Name
          </label>
          <input
            id="branchName"
            name="branchName"
            value={formValues.branchName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Lagos Mainland Branch"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="supervisorName" className="block text-sm font-medium text-slate-600">
            Supervisor Name
          </label>
          <input
            id="supervisorName"
            name="supervisorName"
            value={formValues.supervisorName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Chidinma Okafor"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="supervisorEmail" className="block text-sm font-medium text-slate-600">
            Supervisor Email
          </label>
          <input
            id="supervisorEmail"
            name="supervisorEmail"
            type="email"
            value={formValues.supervisorEmail}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="supervisor@email.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="supervisorPhone" className="block text-sm font-medium text-slate-600">
            Supervisor Phone
          </label>
          <input
            id="supervisorPhone"
            name="supervisorPhone"
            value={formValues.supervisorPhone}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. 08012345678"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-slate-600">
          Branch Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formValues.address}
          onChange={handleChange}
          required
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Street, City, State"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Branch
        </button>
      </div>
    </form>
  );
}

function BranchDetails({ branch }) {
  if (!branch) return null;

  const detailItems = [
    {
      icon: User,
      label: "Supervisor",
      value: branch.supervisorName,
    },
    {
      icon: Mail,
      label: "Email",
      value: branch.supervisorEmail,
    },
    {
      icon: Phone,
      label: "Phone",
      value: branch.supervisorPhone,
    },
    {
      icon: MapPin,
      label: "Address",
      value: branch.address,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{branch.branchName}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Created {new Date(branch.createdAt).toLocaleDateString()} • Updated {" "}
          {new Date(branch.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <dl className="grid gap-4">
        {detailItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Icon className="h-4 w-4" />
              {label}
            </dt>
            <dd className="mt-2 text-sm text-slate-800">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BranchPage() {
  const dispatch = useDispatch();
  const { items, status, error, mutationStatus, mutationError, selectedBranch, lastActionId } = useSelector(
    (state) => state.branches,
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [handledActionId, setHandledActionId] = useState(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchBranches());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (lastActionId && lastActionId !== handledActionId) {
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setHandledActionId(lastActionId);
    }
  }, [lastActionId, handledActionId]);

  useEffect(() => {
    if (!isCreateOpen && !isEditOpen && !isViewOpen) {
      dispatch(resetBranchStatus());
    }
  }, [isCreateOpen, isEditOpen, isViewOpen, dispatch]);

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
    dispatch(createBranch(formValues));
  };

  const handleUpdate = (formValues) => {
    if (!selectedBranch?._id) return;
    dispatch(updateBranch({ branchId: selectedBranch._id, updates: formValues }));
  };

  const handleDelete = (branchId) => {
    const confirmed = window.confirm("Delete this branch? This action cannot be undone.");
    if (!confirmed) return;
    dispatch(deleteBranch(branchId));
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
    dispatch(setSelectedBranch(null));
  };

  const openEditModal = (branch) => {
    dispatch(setSelectedBranch(branch));
    setIsEditOpen(true);
  };

  const openViewModal = (branch) => {
    dispatch(setSelectedBranch(branch));
    setIsViewOpen(true);
  };

  const closeAllModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    dispatch(setSelectedBranch(null));
  };

  const pending = status === "loading";
  const mutationPending = mutationStatus === "loading";

  const tableContent = useMemo(() => {
    if (pending) {
      return (
        <tr>
          <td colSpan={5} className="py-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
            Loading branches…
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={5} className="py-16 text-center text-sm text-red-500">
            {error}
          </td>
        </tr>
      );
    }

    if (!items.length) {
      return (
        <tr>
          <td colSpan={5} className="py-16 text-center text-sm text-slate-500">
            No branches yet. Create the first branch to get started.
          </td>
        </tr>
      );
    }

    return items.map((branch) => (
      <tr key={branch._id} className="group relative border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
          {branch.branchName}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{branch.supervisorName}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{branch.supervisorEmail}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{branch.supervisorPhone}</td>
        <td className="px-4 py-4 text-right">
          <div className="relative inline-block text-left">
            <button
              type="button"
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={(event) => {
                event.stopPropagation();
                setVisibleMenuId((prev) => (prev === branch._id ? null : branch._id));
              }}
              aria-label="Open branch actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {visibleMenuId === branch._id ? (
              <div
                role="menu"
                onClick={(event) => event.stopPropagation()}
                className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => {
                    openViewModal(branch);
                    setVisibleMenuId(null);
                  }}
                >
                  View branch
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => {
                    openEditModal(branch);
                    setVisibleMenuId(null);
                  }}
                >
                  Update branch
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    handleDelete(branch._id);
                    setVisibleMenuId(null);
                  }}
                >
                  Delete branch
                </button>
              </div>
            ) : null}
          </div>
        </td>
      </tr>
    ));
  }, [items, pending, error, visibleMenuId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Branch Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, create, and manage Choose Right branches and their supervisors.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Branch
        </button>
      </div>

      {mutationError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Branch
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supervisor
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">{tableContent}</tbody>
        </table>
      </div>

      <Modal
        open={isCreateOpen}
        onClose={closeAllModals}
        title="Create Branch"
      >
        <BranchForm initialValues={defaultFormValues} onSubmit={handleCreate} submitting={mutationPending} />
      </Modal>

      <Modal
        open={isEditOpen}
        onClose={closeAllModals}
        title="Update Branch"
      >
        <BranchForm
          initialValues={selectedBranch || defaultFormValues}
          onSubmit={handleUpdate}
          submitting={mutationPending}
        />
      </Modal>

      <Modal
        open={isViewOpen}
        onClose={closeAllModals}
        title="Branch Details"
        widthClass="max-w-xl"
      >
        <BranchDetails branch={selectedBranch} />
      </Modal>
    </div>
  );
}
