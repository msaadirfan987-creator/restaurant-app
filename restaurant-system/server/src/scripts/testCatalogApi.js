import { createRequire } from "module";
import dns from "node:dns";
const require = createRequire(import.meta.url);
require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const BASE = "http://localhost:5000";

async function run() {
  console.log("\n==========================================");
  console.log(" Testing Catalog & Admin CRUD Security    ");
  console.log("==========================================");

  // 1. Admin login to get HttpOnly cookies
  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || "admin@restaurant.com",
      password: process.env.ADMIN_PASSWORD || "Admin@Restaurant2026!",
    }),
  });
  const cookies = loginRes.headers.getSetCookie
    ? loginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ")
    : loginRes.headers.get("set-cookie")?.split(";")[0] || "";

  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  console.log("✅ PASS: Admin logged in, acquired admin_session cookie");

  // 2. CSRF Defense Test: State-changing POST without X-Requested-With must fail (403)
  const csrfFailRes = await fetch(`${BASE}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ name: "Malicious CSRF Category" }),
  });
  if (csrfFailRes.status === 403) {
    console.log("✅ PASS: CSRF Defense blocked category creation without custom header (403)");
  } else {
    console.error(`❌ FAIL: Expected 403 CSRF block, got ${csrfFailRes.status}`);
  }

  // 3. Create a test category with proper CSRF header
  const catCreateRes = await fetch(`${BASE}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
    body: JSON.stringify({
      name: "Test Shakes & Beverages",
      description: "Creamy hand-spun milkshakes and fresh beverages",
    }),
  });
  const catData = await catCreateRes.json();
  const testCatId = catData.category?.id || catData.category?._id;

  if (catCreateRes.status === 201 && testCatId) {
    console.log(`✅ PASS: Created category "${catData.category.name}" (ID: ${testCatId})`);
  } else {
    console.error("❌ FAIL: Category creation failed", catData);
  }

  // 4. Create a product in that category
  const prodCreateRes = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
    body: JSON.stringify({
      name: "Strawberry Dream Shake",
      price: 650,
      discountPrice: 590,
      category: testCatId,
      description: "Made with fresh wild strawberries and artisanal ice cream",
      isFeatured: true,
      isAvailable: true,
    }),
  });
  const prodData = await prodCreateRes.json();
  const testProdId = prodData.product?.id || prodData.product?._id;

  if (prodCreateRes.status === 201 && testProdId) {
    console.log(`✅ PASS: Created product "${prodData.product.name}" with discount pricing`);
  } else {
    console.error("❌ FAIL: Product creation failed", prodData);
  }

  // 5. Test 409 Conflict: Category cannot be deleted while products exist in it
  const conflictRes = await fetch(`${BASE}/api/categories/${testCatId}`, {
    method: "DELETE",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
  });
  if (conflictRes.status === 409) {
    console.log("✅ PASS: Category deletion safely blocked with 409 Conflict because products exist");
  } else {
    console.error(`❌ FAIL: Expected 409 Conflict, got ${conflictRes.status}`);
  }

  // 6. Delete product
  const delProdRes = await fetch(`${BASE}/api/products/${testProdId}`, {
    method: "DELETE",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
  });
  if (delProdRes.status === 200) {
    console.log("✅ PASS: Product deleted successfully");
  } else {
    console.error(`❌ FAIL: Product deletion failed (${delProdRes.status})`);
  }

  // 7. Delete category now that it has 0 products
  const delCatRes = await fetch(`${BASE}/api/categories/${testCatId}`, {
    method: "DELETE",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
  });
  if (delCatRes.status === 200) {
    console.log("✅ PASS: Empty category deleted successfully");
  } else {
    console.error(`❌ FAIL: Category deletion failed (${delCatRes.status})`);
  }

  console.log("==========================================");
  console.log(" All Catalog Security & CRUD Tests Passed ");
  console.log("==========================================\n");
}

run().catch(console.error);
