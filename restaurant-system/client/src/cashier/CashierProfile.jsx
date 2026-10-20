import { useEffect, useState } from "react";
import { cashierApi } from "./cashierApi";

export default function CashierProfile({ user: initialUser }) {
  const [user, setUser] = useState(initialUser || null);
  const [name, setName] = useState(initialUser?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!user) {
      cashierApi
        .getProfile()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            setName(res.user.name);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setNameLoading(true);
    setNameSuccess("");
    setNameError("");
    try {
      const res = await cashierApi.updateProfile({ name: name.trim() });
      if (res.user) {
        setUser(res.user);
        setName(res.user.name);
      }
      setNameSuccess("Profile name updated successfully.");
    } catch (err) {
      setNameError(err.message || "Failed to update profile name.");
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);
    setPwSuccess("");
    setPwError("");
    try {
      await cashierApi.updateProfile({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPwSuccess("Password changed successfully.");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#f4ead5", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "1px" }}>
          MY CASHIER PROFILE
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "rgba(244, 234, 213, 0.6)" }}>
          Manage your cashier account details and change your login password.
        </p>
      </div>

      {/* Account Info Card */}
      <div style={{ background: "#1f2622", border: "1px solid rgba(217, 164, 65, 0.2)", borderRadius: "10px", padding: "16px" }}>
        <h3 style={{ margin: "0 0 12px", color: "#d9a441", fontSize: "0.95rem" }}>Account Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem" }}>
          <div>
            <div style={{ color: "rgba(244, 234, 213, 0.5)", fontSize: "0.75rem" }}>Role</div>
            <div style={{ color: "#f4ead5", fontWeight: 700, textTransform: "uppercase" }}>{user?.role || "Staff"}</div>
          </div>
          <div>
            <div style={{ color: "rgba(244, 234, 213, 0.5)", fontSize: "0.75rem" }}>Login Email</div>
            <div style={{ color: "#f4ead5" }}>{user?.email || "-"}</div>
          </div>
        </div>
        <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "rgba(244, 234, 213, 0.4)" }}>
          Email and role assignments can only be changed by an Administrator.
        </div>
      </div>

      {/* Update Name Form */}
      <form onSubmit={handleUpdateName} style={{ background: "#1f2622", border: "1px solid rgba(217, 164, 65, 0.2)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ margin: 0, color: "#d9a441", fontSize: "0.95rem" }}>Update Display Name</h3>

        {nameSuccess && (
          <div style={{ padding: "8px 10px", background: "rgba(74, 222, 128, 0.15)", border: "1px solid #4ade80", borderRadius: "6px", color: "#86efac", fontSize: "0.8rem" }}>
            {nameSuccess}
          </div>
        )}
        {nameError && (
          <div style={{ padding: "8px 10px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "6px", color: "#fca5a5", fontSize: "0.8rem" }}>
            {nameError}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.7)", marginBottom: "4px" }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="ap-input"
            style={{ fontSize: "0.85rem", padding: "8px 10px" }}
          />
        </div>

        <button
          type="submit"
          disabled={nameLoading || name.trim() === user?.name}
          className="ap-btn primary"
          style={{ alignSelf: "flex-start", fontSize: "0.82rem", padding: "8px 16px" }}
        >
          {nameLoading ? "Saving..." : "Save Name"}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleUpdatePassword} style={{ background: "#1f2622", border: "1px solid rgba(217, 164, 65, 0.2)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ margin: 0, color: "#d9a441", fontSize: "0.95rem" }}>Change Password</h3>

        {pwSuccess && (
          <div style={{ padding: "8px 10px", background: "rgba(74, 222, 128, 0.15)", border: "1px solid #4ade80", borderRadius: "6px", color: "#86efac", fontSize: "0.8rem" }}>
            {pwSuccess}
          </div>
        )}
        {pwError && (
          <div style={{ padding: "8px 10px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "6px", color: "#fca5a5", fontSize: "0.8rem" }}>
            {pwError}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.7)", marginBottom: "4px" }}>
            Current Password
          </label>
          <input
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
            className="ap-input"
            style={{ fontSize: "0.85rem", padding: "8px 10px" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.7)", marginBottom: "4px" }}>
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              required
              minLength={8}
              className="ap-input"
              style={{ fontSize: "0.85rem", padding: "8px 10px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(244, 234, 213, 0.7)", marginBottom: "4px" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={pw.confirmPassword}
              onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
              required
              minLength={8}
              className="ap-input"
              style={{ fontSize: "0.85rem", padding: "8px 10px" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pwLoading}
          className="ap-btn primary"
          style={{ alignSelf: "flex-start", fontSize: "0.82rem", padding: "8px 16px" }}
        >
          {pwLoading ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
