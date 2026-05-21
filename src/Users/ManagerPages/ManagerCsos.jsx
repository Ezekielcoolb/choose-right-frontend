import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Mail, Phone, MapPin, ShieldCheck, ShieldAlert, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchManagerCsos } from "../../redux/slices/managerDataSlice";

export default function ManagerCsosPage() {
  const dispatch = useDispatch();
  const { csos } = useSelector((state) => state.managerData);
  const { data: items, status, error } = csos;

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchManagerCsos());
    }
  }, [status, dispatch]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items || [];
    return (items || []).filter((cso) => {
      const haystack = [
        cso.firstName,
        cso.lastName,
        cso.email,
        cso.phone,
        cso.branchName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search]);

  const isLoading = status === "loading";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Branch CSOs</h1>
          <p className="mt-1 text-sm text-slate-500">
            View all Customer Success Officers.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CSOs..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-500">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
                    Loading CSOs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : !filteredItems.length ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-500">
                    No CSOs found in this branch.
                  </td>
                </tr>
              ) : (
                filteredItems.map((cso) => (
                  <tr key={cso._id} className="hover:bg-slate-50/60 transition">
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
                      CSO
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          cso.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {cso.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/manager/csos/${cso._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary hover:border-primary/30"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
