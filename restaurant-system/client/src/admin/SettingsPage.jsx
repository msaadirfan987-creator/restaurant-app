import { useState, useEffect } from "react";
import { adminApi } from "./adminApi";
import { useAdmin } from "./AdminContext";
import { Button, Field, LoadingBlock, PageHeader, useFetch } from "./ui";

export default function SettingsPage() {
  const { notify, fail } = useAdmin();
  const settingsFetch = useFetch(() => adminApi.settings.get(), []);

  // Restaurant details form state
  const [f, setF] = useState({
    restaurantName: "Burger House",
    tagline: "Freshly Grilled Burgers, Straight to Your Table",
    phone: "+92 300 1234567",
    email: "info@burgerhouse.com",
    address: "Plot 12-C, Food Street, Phase 5, DHA, Karachi",
    openingHours: "12:00 PM – 02:00 AM Daily",
    deliveryFee: 150,
    minOrderAmount: 500,
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // Password rotation form state
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (settingsFetch.data?.settings) {
      setF((prev) => ({
        ...prev,
        ...settingsFetch.data.settings,
      }));
    }
  }, [settingsFetch.data]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminApi.settings.update(f);
      notify("Restaurant settings updated successfully.");
      settingsFetch.reload();
    } catch (err) {
      fail(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = "Enter your current password.";
    if (pw.newPassword.length < 8) {
      errs.newPassword = "New password must be at least 8 characters long.";
    }
    if (pw.newPassword !== pw.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      const res = await adminApi.settings.changePassword(pw);
      notify(res.message || "Password changed successfully.");
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      fail(err);
    } finally {
      setSavingPw(false);
    }
  };

  if (settingsFetch.loading && !settingsFetch.data) {
    return <LoadingBlock label="Loading settings" />;
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage store information, delivery pricing, and admin security."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 28 }}>
        {/* Restaurant Profile & Config */}
        <div
          style={{
            background: "#1b211e",
            border: "1px solid rgba(244, 234, 213, 0.08)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700, color: "#f4ead5" }}>
            Store Details
          </h2>

          <form className="ap-form" onSubmit={handleSaveSettings}>
            <div className="full">
              <Field label="Restaurant Brand Name" id="s-name">
                <input
                  id="s-name"
                  className="ap-input"
                  value={f.restaurantName}
                  onChange={(e) => setF({ ...f, restaurantName: e.target.value })}
                />
              </Field>
            </div>

            <div className="full">
              <Field label="Tagline / Slogan" id="s-tagline">
                <input
                  id="s-tagline"
                  className="ap-input"
                  value={f.tagline}
                  onChange={(e) => setF({ ...f, tagline: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Phone Contact" id="s-phone">
                <input
                  id="s-phone"
                  className="ap-input"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                />
              </Field>

              <Field label="Support Email" id="s-email">
                <input
                  id="s-email"
                  type="email"
                  className="ap-input"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </Field>
            </div>

            <div className="full">
              <Field label="Physical Address" id="s-addr">
                <input
                  id="s-addr"
                  className="ap-input"
                  value={f.address}
                  onChange={(e) => setF({ ...f, address: e.target.value })}
                />
              </Field>
            </div>

            <div className="full">
              <Field label="Operating Hours" id="s-hours">
                <input
                  id="s-hours"
                  className="ap-input"
                  value={f.openingHours}
                  onChange={(e) => setF({ ...f, openingHours: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Delivery Fee (Rs.)" id="s-fee">
                <input
                  id="s-fee"
                  type="number"
                  min="0"
                  className="ap-input"
                  value={f.deliveryFee}
                  onChange={(e) => setF({ ...f, deliveryFee: Number(e.target.value) })}
                />
              </Field>

              <Field label="Minimum Order (Rs.)" id="s-min">
                <input
                  id="s-min"
                  type="number"
                  min="0"
                  className="ap-input"
                  value={f.minOrderAmount}
                  onChange={(e) => setF({ ...f, minOrderAmount: Number(e.target.value) })}
                />
              </Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button type="submit" busy={savingSettings}>
                Save Store Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Password Change */}
        <div
          style={{
            background: "#1b211e",
            border: "1px solid rgba(244, 234, 213, 0.08)",
            borderRadius: 12,
            padding: 24,
            height: "fit-content",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#f4ead5" }}>
            Security & Authentication
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(244, 234, 213, 0.6)" }}>
            Update your administrator password. Updating increments token version and revokes sessions on other devices.
          </p>

          <form className="ap-form" onSubmit={handlePasswordChange} noValidate>
            <div className="full">
              <Field
                label="Current Password"
                id="pw-curr"
                error={pwErrors.currentPassword}
              >
                <input
                  id="pw-curr"
                  type="password"
                  className={`ap-input ${pwErrors.currentPassword ? "has-error" : ""}`}
                  value={pw.currentPassword}
                  onChange={(e) => {
                    setPw({ ...pw, currentPassword: e.target.value });
                    setPwErrors({});
                  }}
                />
              </Field>
            </div>

            <div className="full">
              <Field
                label="New Password"
                id="pw-new"
                error={pwErrors.newPassword}
                hint="Minimum 8 characters with numbers or symbols recommended."
              >
                <input
                  id="pw-new"
                  type="password"
                  className={`ap-input ${pwErrors.newPassword ? "has-error" : ""}`}
                  value={pw.newPassword}
                  onChange={(e) => {
                    setPw({ ...pw, newPassword: e.target.value });
                    setPwErrors({});
                  }}
                />
              </Field>
            </div>

            <div className="full">
              <Field
                label="Confirm New Password"
                id="pw-conf"
                error={pwErrors.confirmPassword}
              >
                <input
                  id="pw-conf"
                  type="password"
                  className={`ap-input ${pwErrors.confirmPassword ? "has-error" : ""}`}
                  value={pw.confirmPassword}
                  onChange={(e) => {
                    setPw({ ...pw, confirmPassword: e.target.value });
                    setPwErrors({});
                  }}
                />
              </Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button type="submit" variant="solid" busy={savingPw}>
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
