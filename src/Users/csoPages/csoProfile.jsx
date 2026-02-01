import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Camera, MapPin, Phone, Calendar, Save } from "lucide-react";
import { fetchCsoProfile } from "../../redux/slices/csoAuthSlice";
import { uploadFile, clearUploadState } from "../../redux/slices/uploadSlice";
import { updateCso } from "../../redux/slices/csoSlice";
import { toast } from "react-hot-toast";

const AVATAR_FOLDER = "cso-profile";

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function CsoProfilePage() {
  const dispatch = useDispatch();
  const { profile, status, error } = useSelector((state) => state.csoAuth);
  const { uploading, lastUploadedUrl } = useSelector((state) => state.upload);
  const { mutationStatus, mutationError } = useSelector((state) => state.csos);

  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    address: "",
    phone: "",
    dateOfBirth: "",
    profileImg: "",
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCsoProfile());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (profile) {
      setFormValues({
        address: profile.address || "",
        phone: profile.phone || "",
        dateOfBirth: formatDateInput(profile.dateOfBirth),
        profileImg: profile.profileImg || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (lastUploadedUrl) {
      setFormValues((prev) => ({ ...prev, profileImg: lastUploadedUrl }));
    }
  }, [lastUploadedUrl]);

  const initials = useMemo(() => {
    const first = profile?.firstName?.[0] || "";
    const last = profile?.lastName?.[0] || "";
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : "CS";
  }, [profile?.firstName, profile?.lastName]);

  const avatarSource = formValues.profileImg || profile?.profileImg || null;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    dispatch(uploadFile({ file, folderName: AVATAR_FOLDER }))
      .unwrap()
      .then((response) => {
        toast.success("Profile photo uploaded successfully.");
        setFormValues((prev) => ({ ...prev, profileImg: response.data }));
      })
      .catch((uploadError) => {
        toast.error(uploadError || "Failed to upload image");
      });
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!profile?._id) return;

    const updates = {
      address: formValues.address.trim(),
      phone: formValues.phone.trim(),
      dateOfBirth: formValues.dateOfBirth ? new Date(formValues.dateOfBirth).toISOString() : null,
    };

    if (formValues.profileImg) {
      updates.profileImg = formValues.profileImg;
    }

    dispatch(updateCso({ csoId: profile._id, updates }))
      .unwrap()
      .then(() => {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        dispatch(fetchCsoProfile());
      })
      .catch((updateError) => {
        toast.error(updateError || "Failed to update profile");
      });
  };

  const handleCancel = () => {
    setIsEditing(false);
    dispatch(clearUploadState());
    setFormValues({
      address: profile?.address || "",
      phone: profile?.phone || "",
      dateOfBirth: formatDateInput(profile?.dateOfBirth),
      profileImg: profile?.profileImg || "",
    });
  };

  useEffect(() => () => {
    dispatch(clearUploadState());
  }, [dispatch]);

  const isSaving = mutationStatus === "loading";
  const loadingProfile = status === "loading" && !profile;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>
          <p className="text-sm text-slate-500">Update your contact details and personal information.</p>
        </div>
        <div className="flex items-center gap-3">
          {!loadingProfile ? (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              {isEditing ? "Cancel editing" : "Edit profile"}
            </button>
          ) : null}
        </div>
      </header>

      {loadingProfile ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : profile ? (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative">
              {avatarSource ? (
                <img
                  src={`http://localhost:5000${avatarSource}`}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-32 w-32 rounded-full object-cover shadow"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary shadow">
                  {initials}
                </div>
              )}
              {isEditing ? (
                <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Camera className="h-5 w-5 text-primary" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              ) : null}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-slate-500">{profile.branchName}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">Work ID: {profile.workId}</p>
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="address" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-400" /> Home address
                  </label>
                  {isEditing ? (
                    <textarea
                      id="address"
                      name="address"
                      value={formValues.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your residential address"
                      required
                    />
                  ) : (
                    <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {profile.address || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Phone className="h-4 w-4 text-slate-400" /> Phone number
                  </label>
                  {isEditing ? (
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formValues.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter phone number"
                      required
                    />
                  ) : (
                    <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {profile.phone || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Calendar className="h-4 w-4 text-slate-400" /> Date of birth
                  </label>
                  {isEditing ? (
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formValues.dateOfBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {formatDisplayDate(profile.dateOfBirth)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email address</p>
                  <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {profile.email || "Not provided"}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || uploading}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed"
                  >
                    {isSaving || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {uploading ? "Uploading photo..." : "Save changes"}
                  </button>
                </div>
              ) : null}
            </form>

            {mutationError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {mutationError}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-600">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500 shadow-sm">
          Unable to load profile information.
        </div>
      )}
    </div>
  );
}
