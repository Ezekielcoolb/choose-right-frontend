import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Plus, Search, ShieldAlert, ShieldCheck } from "lucide-react";

import {
  createAdminMember,
  fetchAdminMembers,
  toggleSuspendAdminMember,
} from "../../redux/slices/adminPanelSlice.jsx";
import { fetchBranches } from "../../redux/slices/branchSlice.jsx";

const DEFAULT_ROLE = "Manager";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  branchName: "",
  branchId: "",
  email: "",
  phone: "",
  password: "",
  assignedRole: DEFAULT_ROLE,
  gender: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const InfoRow = ({ label, value }) => (
  <div className="grid gap-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-800">{value || "—"}</span>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10 backdrop-blur-sm">
    <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title?.subtitle}</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title?.heading}</h2>
          {title?.description ? <p className="mt-1 text-sm text-slate-500">{title.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>
      <div className="flex max-h-[70vh] flex-1 overflow-y-auto px-6 py-4">{children}</div>
    </div>
  </div>
);

export default function AdminPanelPage() {
  const dispatch = useDispatch();
  const { items, status, error, mutationStatus, mutationError } = useSelector((state) => state.adminPanel);
  const { items: branches, status: branchesStatus, error: branchesError } = useSelector((state) => state.branches);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const isLoading = status === "loading" || status === "idle";
  const isMutating = mutationStatus === "loading";

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchAdminMembers());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (branchesStatus === "idle") {
      dispatch(fetchBranches());
    }
  }, [branchesStatus, dispatch]);

  useEffect(() => {
    if (mutationStatus === "succeeded" && isFormModalOpen) {
      setIsFormModalOpen(false);
      setFormValues(INITIAL_FORM);
    }
  }, [mutationStatus, isFormModalOpen]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((member) => {
      const haystack = [
        member.firstName,
        member.lastName,
        member.branchName,
        member.email,
        member.phone,
        member.assignedRole,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, searchTerm]);

  const selectedMember = useMemo(
    () => filteredMembers.find((member) => member._id === selectedMemberId) || null,
    [filteredMembers, selectedMemberId],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMember = (event) => {
    event.preventDefault();
    if (isMutating) return;
    dispatch(createAdminMember(formValues));
  };

  const handleToggleSuspend = (member) => {
    if (isMutating) return;
    dispatch(toggleSuspendAdminMember({ id: member._id, isSuspended: !member.isSuspended }));
  };

  const handleOpenDetail = (member) => {
    setSelectedMemberId(member._id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedMemberId(null);
    setIsDetailModalOpen(false);
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin members</p>
          <h1 className="text-3xl font-semibold text-slate-900">Admin control panel</h1>
          <p className="text-sm text-slate-500">
            Manage admin users, review their permissions, and handle suspensions when necessary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search admin members"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div> */}

          <button
            type="button"
            onClick={() => {
              setFormValues(INITIAL_FORM);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add admin member
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      {mutationError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{mutationError}</div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Admin members</h2>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {filteredMembers.length.toLocaleString()} member{filteredMembers.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading admin members…
          </div>
        ) : !filteredMembers.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500">
            No admin members found. Add one to get started.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Branch</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">{member.assignedRole}</td>
                    <td className="px-4 py-3 text-slate-600">{member.email}</td>
                    <td className="px-4 py-3 text-slate-600">{member.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{member.branchName}</td>
                    <td className="px-4 py-3">
                      {member.isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">
                          <ShieldAlert className="h-3.5 w-3.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(member)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleToggleSuspend(member)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                            member.isSuspended
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              : "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          } ${isMutating ? "opacity-60" : ""}`}
                        >
                          {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {member.isSuspended ? "Reinstate" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isDetailModalOpen && selectedMember ? (
        <Modal
          title={{
            subtitle: "Member details",
            heading: `${selectedMember.firstName} ${selectedMember.lastName}`,
            description: "Inspect profile information and status",
          }}
          onClose={handleCloseDetail}
        >
          <div className="grid gap-3">
            <InfoRow label="Email" value={selectedMember.email} />
            <InfoRow label="Phone" value={selectedMember.phone} />
            <InfoRow label="Branch" value={`${selectedMember.branchName} (${selectedMember.branchId})`} />
            <InfoRow label="Role" value={selectedMember.assignedRole} />
            <InfoRow label="Gender" value={selectedMember.gender} />
            <InfoRow label="Status" value={selectedMember.isSuspended ? "Suspended" : "Active"} />
            <InfoRow label="Created" value={formatDate(selectedMember.createdAt)} />
            <InfoRow label="Updated" value={formatDate(selectedMember.updatedAt)} />

            <button
              type="button"
              disabled={isMutating}
              onClick={() => handleToggleSuspend(selectedMember)}
              className={`mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedMember.isSuspended
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              } ${isMutating ? "opacity-60" : ""}`}
            >
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {selectedMember.isSuspended ? "Reinstate member" : "Suspend member"}
            </button>
          </div>
        </Modal>
      ) : null}

      {isFormModalOpen ? (
        <Modal
          title={{
            subtitle: "Create admin member",
            heading: "New admin profile",
            description: "Provide the details below to onboard a new admin",
          }}
          onClose={() => {
            if (!isMutating) {
              setIsFormModalOpen(false);
              setFormValues(INITIAL_FORM);
            }
          }}
        >
          <form className="grid gap-3" onSubmit={handleCreateMember}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-600">
                First name
                <input
                  required
                  name="firstName"
                  value={formValues.firstName}
                  onChange={handleInputChange}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-600">
                Last name
                <input
                  required
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleInputChange}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm text-slate-600">
              Branch
              <select
                required
                name="branchId"
                value={formValues.branchId}
                onChange={(event) => {
                  const branchId = event.target.value;
                  const branchMeta = branches.find((branch) => branch._id === branchId);
                  setFormValues((prev) => ({
                    ...prev,
                    branchId,
                    branchName: branchMeta?.branchName || "",
                  }));
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  {branchesStatus === "loading" ? "Loading branches..." : "Select branch"}
                </option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName} 
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm text-slate-600">
              Email address
              <input
                required
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleInputChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-600">
              Phone number
              <input
                required
                name="phone"
                value={formValues.phone}
                onChange={handleInputChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-600">
              Work ID
              <input
                required
                type="text"
                name="password"
                value={formValues.password}
                onChange={handleInputChange}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-600">
                Role
                <select
                  name="assignedRole"
                  value={formValues.assignedRole}
                  onChange={handleInputChange}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value={DEFAULT_ROLE}>Manager</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm text-slate-600">
                Gender
                <input
                  required
                  name="gender"
                  value={formValues.gender}
                  onChange={handleInputChange}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isMutating}
              className={`mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 ${
                isMutating ? "opacity-60" : ""
              }`}
            >
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create admin member
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

