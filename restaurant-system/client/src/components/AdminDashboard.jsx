import React from "react";

/**
 * AdminDashboard.jsx
 *
 * Dedicated minimal admin dashboard route (/admin).
 * Only displays "Welcome, Admin" when authenticated as the admin account.
 * Denies access if logged in as a customer or unauthenticated.
 */

export default function AdminDashboard({
  currentUser,
  onLoginClick,
  onLogout,
  onNavigateHome,
}) {
  // 1. Unauthenticated state: Prompt to log in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#151a17] text-[#f4ead5] flex flex-col items-center justify-center p-6">
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center shadow-2xl"
          style={{
            background: "#242a27",
            border: "1px solid rgba(217, 164, 65, 0.3)",
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center font-serif text-2xl font-bold"
            style={{ background: "#d9a441", color: "#151a17" }}
          >
            BH
          </div>
          <h2 className="text-2xl font-serif font-bold mb-3 text-[#f4ead5]">
            Admin Authentication Required
          </h2>
          <p className="text-sm text-[#f4ead5]/70 mb-6">
            Please log in with your administrator credentials to access the admin area.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onLoginClick("login")}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
              style={{ background: "#d9a441", color: "#151a17" }}
            >
              Sign In as Admin
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all border"
              style={{
                borderColor: "rgba(244, 234, 213, 0.2)",
                color: "#f4ead5",
              }}
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Customer trying to access /admin: Deny access
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#151a17] text-[#f4ead5] flex flex-col items-center justify-center p-6">
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center shadow-2xl"
          style={{
            background: "#242a27",
            border: "1px solid rgba(240, 144, 127, 0.4)",
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center font-serif text-2xl font-bold"
            style={{ background: "rgba(240, 144, 127, 0.15)", color: "#f0907f" }}
          >
            !
          </div>
          <h2 className="text-2xl font-serif font-bold mb-3 text-[#f0907f]">
            Access Denied
          </h2>
          <p className="text-sm text-[#f4ead5]/75 mb-6">
            You are signed in as a customer (<strong>{currentUser.email}</strong>).
            This area is restricted exclusively to administrators.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
              style={{ background: "#d9a441", color: "#151a17" }}
            >
              Return to Customer Website
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all border"
              style={{
                borderColor: "rgba(240, 144, 127, 0.3)",
                color: "#f0907f",
              }}
            >
              Sign Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard: Display ONLY "Welcome, Admin" as required
  return (
    <div className="min-h-screen bg-[#151a17] text-[#f4ead5] flex flex-col">
      {/* Minimal Top Header */}
      <header
        className="w-full px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(217, 164, 65, 0.2)",
          background: "rgba(16, 28, 27, 0.8)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-lg"
            style={{ background: "#d9a441", color: "#151a17" }}
          >
            BH
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-[#f4ead5] block leading-none">
              Burger House
            </span>
            <span className="text-xs tracking-wider uppercase text-[#d9a441]">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-sm text-[#f4ead5]/80 hover:text-[#d9a441] transition-colors"
          >
            View Website
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{ background: "rgba(217, 164, 65, 0.15)", color: "#d9a441" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Content: Explicitly minimal as requested */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          className="p-12 rounded-3xl max-w-lg w-full shadow-2xl"
          style={{
            background: "#242a27",
            border: "1px solid rgba(217, 164, 65, 0.35)",
          }}
        >
          <h1
            id="admin-welcome-heading"
            className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4"
            style={{ color: "#d9a441" }}
          >
            Welcome, Admin
          </h1>
          <p className="text-sm text-[#f4ead5]/70">
            Authenticated administrator session active ({currentUser.email})
          </p>
        </div>
      </main>
    </div>
  );
}
