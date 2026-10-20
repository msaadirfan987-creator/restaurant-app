import { useState, useEffect } from "react";
import { adminApi } from "./adminApi";
import { useAdmin } from "./AdminContext";
import {
  Button,
  EmptyBlock,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  useFetch,
} from "./ui";

const ROLES = [
  { key: "cashier", label: "Cashier" },
  { key: "kitchen", label: "Kitchen Staff" },
  { key: "waiter", label: "Waiter" },
  { key: "admin", label: "Administrator" },
];

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%!";
  const arr = new Uint32Array(12);
  (window.crypto || window.msCrypto).getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function StaffForm({ initial, isSelf, onSaved, onClose }) {
  const { notify, fail } = useAdmin();
  const editing = Boolean(initial);

  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    role: initial?.role || "cashier",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (!editing && form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        await adminApi.staff.update(initial._id || initial.id, {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: isSelf ? undefined : form.role,
        });
        notify("Staff member updated successfully.");
      } else {
        await adminApi.staff.create({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          password: form.password,
        });
        notify("Staff member created successfully.");
      }
      onSaved();
    } catch (err) {
      fail(err);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? `Edit ${initial.name}` : "Add Staff Member"}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button busy={saving} onClick={submit}>
            {editing ? "Save changes" : "Create staff account"}
          </Button>
        </>
      }
    >
      <form className="ap-form" onSubmit={submit} noValidate>
        <div className="full">
          <Field label="Full Name" id="st-name" error={errors.name}>
            <input
              id="st-name"
              className={`ap-input ${errors.name ? "has-error" : ""}`}
              value={form.name}
              maxLength={80}
              placeholder="e.g. Asad Khan"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
        </div>

        <div className="full">
          <Field label="Work Email Address" id="st-email" error={errors.email}>
            <input
              id="st-email"
              type="email"
              className={`ap-input ${errors.email ? "has-error" : ""}`}
              value={form.email}
              placeholder="e.g. asad@restaurant.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>

        <div className="full">
          <Field
            label="Staff Role"
            id="st-role"
            hint={isSelf ? "You cannot modify your own administrative role." : undefined}
          >
            <select
              id="st-role"
              className="ap-select"
              value={form.role}
              disabled={isSelf}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!editing && (
          <div className="full">
            <Field label="Temporary Password" id="st-pw" error={errors.password}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  id="st-pw"
                  type="text"
                  className={`ap-input ${errors.password ? "has-error" : ""}`}
                  value={form.password}
                  placeholder="Min 8 characters"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Button
                  variant="ghost"
                  onClick={() => setForm({ ...form, password: genPassword() })}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Generate
                </Button>
              </div>
            </Field>
          </div>
        )}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ staff, onDone, onClose }) {
  const { notify, fail } = useAdmin();
  const [newPassword, setNewPassword] = useState(genPassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    setSaving(true);
    try {
      await adminApi.staff.resetPassword(staff._id || staff.id, newPassword);
      notify(`Password reset for ${staff.name}. Previous sessions revoked.`);
      onDone();
    } catch (err) {
      fail(err);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Reset Password — ${staff.name}`}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button busy={saving} onClick={submit}>
            Reset password
          </Button>
        </>
      }
    >
      <form className="ap-form" onSubmit={submit}>
        <p style={{ margin: 0, fontSize: "13px", color: "rgba(244, 234, 213, 0.65)" }}>
          Resetting password will increment token version and instantly revoke all active logins for this employee across all devices.
        </p>

        <div className="full">
          <Field label="New Password" id="rst-pw" error={error}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                id="rst-pw"
                type="text"
                className="ap-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                variant="ghost"
                onClick={() => setNewPassword(genPassword())}
                style={{ whiteSpace: "nowrap" }}
              >
                Generate
              </Button>
            </div>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function StaffManagement() {
  const { user: me, notify, fail } = useAdmin();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const list = useFetch(
    () => adminApi.staff.list({ search, role: roleFilter, status: statusFilter }),
    [search, roleFilter, statusFilter]
  );

  const [modal, setModal] = useState(null); // { type: 'form' | 'reset', staff? }
  const staff = list.data?.staff || [];

  const toggleStatus = async (s) => {
    const action = s.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${s.name}?`)) return;

    try {
      await adminApi.staff.toggleStatus(s._id || s.id, !s.isActive);
      notify(`${s.name} ${s.isActive ? "deactivated" : "activated"}.`);
      list.reload();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff Management"
        subtitle="Create, assign roles, and manage credentials for Cashiers, Kitchen, and Waiters."
        action={<Button onClick={() => setModal({ type: "form" })}>+ Add staff</Button>}
      />

      {/* Filter toolbar */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          placeholder="Search name or email..."
          className="ap-input"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="ap-select"
          style={{ maxWidth: 180 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          className="ap-select"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {list.loading && !list.data ? (
        <LoadingBlock label="Loading staff accounts" />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : staff.length === 0 ? (
        <EmptyBlock
          title="No staff members found"
          text="Click below to add cashiers, kitchen staff, or waiters."
          action={<Button onClick={() => setModal({ type: "form" })}>Add staff member</Button>}
        />
      ) : (
        <div className="ap-tablewrap">
          <table className="ap-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="ap-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => {
                const isSelf = String(s._id || s.id) === String(me?.id || me?._id);
                return (
                  <tr key={s._id || s.id} style={{ "--i": i }}>
                    <td>
                      <div className="ap-cell-main">
                        <span className="ap-thumb-ph">
                          {(s.name || "S").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <span className="ap-strong">{s.name}</span>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#d9a441",
                                marginLeft: "6px",
                                fontWeight: "700",
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ap-muted">{s.email}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          textTransform: "capitalize",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background:
                            s.role === "admin"
                              ? "rgba(217, 164, 65, 0.2)"
                              : s.role === "cashier"
                              ? "rgba(52, 152, 219, 0.2)"
                              : "rgba(46, 204, 113, 0.2)",
                          color:
                            s.role === "admin"
                              ? "#d9a441"
                              : s.role === "cashier"
                              ? "#3498db"
                              : "#2ecc71",
                        }}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`ap-badge ${
                          s.isActive ? "ap-badge--delivered" : "ap-badge--cancelled"
                        }`}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="ap-actions">
                        <Button
                          variant="ghost"
                          className="ap-btn--sm"
                          onClick={() => setModal({ type: "form", staff: s })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="ap-btn--sm"
                          onClick={() => setModal({ type: "reset", staff: s })}
                        >
                          Reset PW
                        </Button>
                        {!isSelf && (
                          <Button
                            variant={s.isActive ? "danger" : "ghost"}
                            className="ap-btn--sm"
                            onClick={() => toggleStatus(s)}
                          >
                            {s.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === "form" && (
        <StaffForm
          initial={modal.staff}
          isSelf={String(modal.staff?._id || modal.staff?.id) === String(me?.id || me?._id)}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            list.reload();
          }}
        />
      )}

      {modal?.type === "reset" && (
        <ResetPasswordModal
          staff={modal.staff}
          onClose={() => setModal(null)}
          onDone={() => setModal(null)}
        />
      )}
    </>
  );
}
