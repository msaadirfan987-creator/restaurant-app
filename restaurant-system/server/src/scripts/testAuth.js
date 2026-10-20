import "dotenv/config";
import dns from "node:dns";
import assert from "node:assert";
import mongoose from "mongoose";
import User from "../models/user.js";
import connectDB from "../config/db.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const BASE_URL = "http://localhost:5000";

async function runSecurityTestSuite() {
  console.log("==========================================================");
  console.log(" Restaurant System: Comprehensive Security Audit & Tests  ");
  console.log("==========================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Reason: ${err.message}`);
      failed++;
    }
  }

  // Connect to DB directly to verify raw storage & password hashing
  await connectDB();

  const timestamp = Date.now();
  const customerA_Email = `cust_a_${timestamp}@test.com`;
  const customerA_Pass = "StrongPassA123!";
  const customerB_Email = `cust_b_${timestamp}@test.com`;
  const customerB_Pass = "StrongPassB123!";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@restaurant.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Secure123!";

  let customerA_Cookie = "";
  let customerA_Token = "";
  let customerB_Cookie = "";
  let customerB_Token = "";
  let adminCookie = "";
  let adminToken = "";
  let orderA_Id = "";

  // 1. Customer A Signup & Role Enforcement
  await test("1. Customer signup creates customer role & ignores role='admin' escalation", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "Customer Alpha",
        email: customerA_Email,
        password: customerA_Pass,
        confirmPassword: customerA_Pass,
        role: "admin", // ATTEMPTED PRIVILEGE ESCALATION
      }),
    });

    const setCookie = res.headers.get("set-cookie") || "";
    const data = await res.json();

    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.user.role, "customer", "Role MUST be 'customer'");
    assert.strictEqual(data.user.email, customerA_Email.toLowerCase());
    assert.strictEqual(data.user.password, undefined, "Plain-text password must not be returned");
    assert.strictEqual(data.user.passwordHash, undefined, "Password hash must not be returned");
    assert.ok(setCookie.includes("token="), "HttpOnly cookie 'token' must be present in response");
    assert.ok(setCookie.toLowerCase().includes("httponly"), "Set-Cookie must have HttpOnly attribute");

    customerA_Cookie = setCookie.split(";")[0];
    customerA_Token = data.token;
  });

  // 2. Direct MongoDB Password Hash Audit
  await test("2. MongoDB record stores bcrypt hash ($2b$), never plain-text password", async () => {
    const rawRecord = await User.findOne({ email: customerA_Email.toLowerCase() }).select("+passwordHash");
    assert.ok(rawRecord, "Customer record must exist in MongoDB");
    assert.ok(rawRecord.passwordHash, "passwordHash must exist in MongoDB document");
    assert.notStrictEqual(rawRecord.passwordHash, customerA_Pass, "Plain-text password MUST NEVER be saved");
    assert.ok(
      rawRecord.passwordHash.startsWith("$2a$") || rawRecord.passwordHash.startsWith("$2b$"),
      "Password must be securely hashed with bcrypt"
    );
  });

  // 3. Input Validation & NoSQL Injection Defense
  await test("3. NoSQL operator injection in signup ({ email: { $gt: '' } }) rejected (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "Hacker",
        email: { $gt: "" },
        password: customerA_Pass,
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // 4. Password Length Enforcement (Bcrypt DoS Protection)
  await test("4. Passwords exceeding 72 characters rejected (Bcrypt DoS defense: 400)", async () => {
    const hugePassword = "A".repeat(100);
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "DoS Test",
        email: `dos_${timestamp}@test.com`,
        password: hugePassword,
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
  });

  // 5. Duplicate Email Rejection
  await test("5. Duplicate email signup rejected with 409 Conflict", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "Duplicate User",
        email: customerA_Email,
        password: customerA_Pass,
      }),
    });
    assert.strictEqual(res.status, 409, `Expected 409, got ${res.status}`);
  });

  // 6. Customer Login (Valid Credentials)
  await test("6. Customer login succeeds and sets HttpOnly cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        email: customerA_Email,
        password: customerA_Pass,
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.role, "customer");
    assert.strictEqual(data.user.passwordHash, undefined);
  });

  // 7. Customer Login (Invalid Password)
  await test("7. Invalid password safely rejected with 401 generic message", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        email: customerA_Email,
        password: "WrongPassword999!",
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.message, "Invalid email or password.");
  });

  // 8. Admin Login with Configured Credentials
  await test("8. Admin login succeeds with configured credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.role, "admin");
    adminCookie = setCookie.split(";")[0];
    adminToken = data.token;
  });

  // 9. Role-Based Authorization: Customer cannot access Admin API
  await test("9. Customer CANNOT access protected admin API GET /api/admin/customers (403)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/customers`, {
      headers: {
        Cookie: customerA_Cookie,
        Authorization: `Bearer ${customerA_Token}`,
      },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 10. Admin CAN access Admin API
  await test("10. Authenticated Admin CAN access protected admin API (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/customers`, {
      headers: {
        Cookie: adminCookie,
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.customers));
  });

  // 11. Create Customer B for Data Ownership Testing
  await test("11. Register Customer B for cross-user data isolation tests", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "Customer Beta",
        email: customerB_Email,
        password: customerB_Pass,
      }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    customerB_Cookie = setCookie.split(";")[0];
    customerB_Token = data.token;
  });

  // 12. Customer A Places an Order
  await test("12. Customer A places an order saved in MongoDB", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: customerA_Cookie,
        Authorization: `Bearer ${customerA_Token}`,
      },
      body: JSON.stringify({
        customerName: "Customer Alpha",
        phone: "03001234567",
        address: "Gulberg, Lahore",
        items: [{ id: "burger-1", name: "Alpha Burger", price: 1200, qty: 1 }],
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.orderId);
    orderA_Id = data.orderId;
  });

  // 13. Data Ownership (IDOR Protection): Customer B CANNOT view Customer A's order
  await test("13. IDOR Defense: Customer B CANNOT access Customer A's order (403)", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${orderA_Id}`, {
      headers: {
        Cookie: customerB_Cookie,
        Authorization: `Bearer ${customerB_Token}`,
      },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden for cross-customer access, got ${res.status}`);
  });

  // 14. Data Ownership: Customer A CAN view their own orders
  await test("14. Customer A can access their own orders via GET /api/orders/my-orders (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/my-orders`, {
      headers: {
        Cookie: customerA_Cookie,
        Authorization: `Bearer ${customerA_Token}`,
      },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.orders));
    const ownsOrder = data.orders.some((o) => o.orderId === orderA_Id);
    assert.ok(ownsOrder, "Customer A's order must be in their own order list");
  });

  // 15. CSRF Defense: Cross-site POST without approved header or origin is rejected (403)
  await test("15. CSRF Defense: Cross-site state-changing request blocked (403)", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://malicious-attacker-site.com",
      },
      body: JSON.stringify({
        customerName: "Attacker",
        phone: "0000000000",
        address: "Nowhere",
        items: [{ id: "fake", name: "Fake", price: 10, qty: 1 }],
      }),
    });
    assert.strictEqual(res.status, 403, `Expected 403 CSRF block, got ${res.status}`);
  });

  // 16. Session Verification & Logout
  await test("16. Session verification (/api/auth/me) and secure logout invalidation", async () => {
    // Check session active
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: customerA_Cookie },
    });
    assert.strictEqual(meRes.status, 200);

    // Perform logout
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: customerA_Cookie,
      },
    });
    const setCookie = logoutRes.headers.get("set-cookie") || "";
    assert.strictEqual(logoutRes.status, 200);
    // Token cookie must be cleared (expires in past / empty)
    assert.ok(setCookie.includes("token=;") || setCookie.includes("token=; Max-Age=0") || setCookie.includes("token=; expires="));
  });

  // 17. Safe Error Handling: 404 does not leak stack traces or internals
  await test("17. Non-existent route returns clean 404 without leaking stack traces", async () => {
    const res = await fetch(`${BASE_URL}/api/non-existent-endpoint`);
    const data = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.message, "Requested endpoint not found.");
    assert.strictEqual(data.stack, undefined, "Stack trace must not be leaked");
  });

  console.log("==========================================================");
  console.log(` Security Audit Test Results: ${passed} passed, ${failed} failed`);
  console.log("==========================================================");

  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
}

runSecurityTestSuite().catch((err) => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
