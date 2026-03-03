import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changeAdminPassword,
  resetPasswordChangeState,
} from "../../redux/slices/adminAuthSlice";
import { Eye, EyeOff, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import "../../styles/Setting.css";

const Setting = () => {
  const dispatch = useDispatch();
  const { passwordChangeStatus, passwordChangeError } = useSelector(
    (state) => state.adminAuth
  );

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [validationError, setValidationError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (passwordChangeStatus === "succeeded") {
      setShowSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setValidationError("");

      const timer = setTimeout(() => {
        setShowSuccess(false);
        dispatch(resetPasswordChangeState());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [passwordChangeStatus, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setValidationError("All fields are required");
      return;
    }

    if (formData.newPassword.length < 8) {
      setValidationError("New password must be at least 8 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setValidationError("New passwords do not match");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setValidationError("New password must be different from current password");
      return;
    }

    dispatch(
      changeAdminPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
    );
  };

  const handleDismissError = () => {
    dispatch(resetPasswordChangeState());
  };

  return (
    <div className="setting-container">
      <div className="setting-card">
        <h1 className="setting-title">Admin Settings</h1>

        <div className="setting-section">
          <h2 className="section-title">Change Password</h2>

          {showSuccess && (
            <div className="alert alert-success">
              <CheckCircle className="icon" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {validationError && (
            <div className="alert alert-error">
              <AlertCircle className="icon" />
              <span>{validationError}</span>
            </div>
          )}

          {passwordChangeStatus === "failed" && passwordChangeError && (
            <div className="alert alert-error">
              <AlertCircle className="icon" />
              <span>{passwordChangeError}</span>
              <button
                className="alert-close"
                onClick={handleDismissError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.currentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  disabled={passwordChangeStatus === "loading"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.currentPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password (min 8 characters)"
                  disabled={passwordChangeStatus === "loading"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.newPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  disabled={passwordChangeStatus === "loading"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.confirmPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={passwordChangeStatus === "loading"}
            >
              {passwordChangeStatus === "loading" ? (
                <>
                  <Loader2 className="icon animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key className="icon" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setting;
