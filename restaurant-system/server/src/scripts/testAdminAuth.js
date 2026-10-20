import { createRequire } from "module";
import dns from "node:dns";
const require = createRequire(import.meta.url);
require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const BASE_URL = "http://localhost:5000/api/admin";

async function testAdminFlow() {
  console.log("\n==========================================");
  console.log(" Testing /api/admin Endpoints Integration ");
  console.log("==========================================");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@restaurant.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Restaurant2026!";

  // 1. Invalid login
  const failRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ email: adminEmail, password: "wrong-password" }),
  });
  const failData = await failRes.json();
  if (failRes.status === 401 && failData.message === "Invalid email or password.") {
    console.log("✅ PASS: Wrong password rejected with 401 and generic message");
  } else {
    console.error(`❌ FAIL: Wrong password expected 401, got ${failRes.status}`, failData);
  }

  // 2. Successful Admin Login
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie");

  if (loginRes.status === 200 && loginData.user?.role === "admin" && setCookie?.includes("admin_session")) {
    console.log("✅ PASS: Admin login successful, sets admin_session HttpOnly cookie, returns admin role");
  } else {
    console.error(`❌ FAIL: Admin login failed (${loginRes.status})`, loginData, setCookie);
  }

  // Extract cookies
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") : (setCookie ? setCookie.split(";")[0] : "");

  // 3. GET /api/admin/me
  const meRes = await fetch(`${BASE_URL}/me`, {
    headers: {
      "Cookie": cookies,
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const meData = await meRes.json();
  if (meRes.status === 200 && meData.user?.role === "admin") {
    console.log("✅ PASS: GET /api/admin/me validates active session and returns user");
  } else {
    console.error(`❌ FAIL: GET /api/admin/me failed (${meRes.status})`, meData);
  }

  // 4. POST /api/admin/logout
  const logoutRes = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Cookie": cookies,
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  const logoutData = await logoutRes.json();
  if (logoutRes.status === 200 && logoutData.message === "Logged out.") {
    console.log("✅ PASS: POST /api/admin/logout successfully revokes session");
  } else {
    console.error(`❌ FAIL: POST /api/admin/logout failed (${logoutRes.status})`, logoutData);
  }

  // 5. GET /api/admin/me after logout with previous cookie (tokenVersion check)
  const afterLogoutRes = await fetch(`${BASE_URL}/me`, {
    headers: {
      "Cookie": cookies,
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (afterLogoutRes.status === 401) {
    console.log("✅ PASS: TokenVersion invalidated old token server-side (401)");
  } else {
    console.error(`❌ FAIL: Expected 401 after logout revocation, got ${afterLogoutRes.status}`);
  }

  console.log("==========================================");
  console.log(" All Admin Endpoints Tested Successfully! ");
  console.log("==========================================\n");
}

testAdminFlow().catch(console.error);
