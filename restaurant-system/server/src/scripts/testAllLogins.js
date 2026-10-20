import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const testUsers = [
  { role: "admin", email: "admin@restaurant.com", pass: "Admin@Secure123!" },
  { role: "waiter", email: "waiter@restaurant.com", pass: "Waiter@Secure123!" },
  { role: "kitchen", email: "kitchen@restaurant.com", pass: "Kitchen@Secure123!" },
  { role: "cashier", email: "hamza123@gmail.com", pass: "Cashier@Secure123!" },
];

async function runTests() {
  console.log("=== Testing /api/auth/login and /api/admin/login ===");

  for (const u of testUsers) {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ email: u.email, password: u.pass }),
      });
      const text = await res.text();
      console.log(`[AUTH/LOGIN] [${u.role.toUpperCase()}] ${u.email} -> Status: ${res.status}`);
      console.log(`   Preview: ${text.slice(0, 200)}`);
    } catch (err) {
      console.log(`   ❌ Fetch error: ${err.message}`);
    }

    if (u.role === "admin") {
      try {
        const resAdmin = await fetch("http://localhost:5000/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ email: u.email, password: u.pass }),
        });
        const dataAdmin = await resAdmin.json();
        console.log(`[ADMIN/LOGIN] ${u.email} -> Status: ${resAdmin.status}`);
        if (resAdmin.ok) {
          console.log(`   ✅ Admin Success! User: ${dataAdmin.user?.name}`);
        } else {
          console.log(`   ❌ Admin Error: ${dataAdmin.message}`);
        }
      } catch (err) {
        console.log(`   ❌ Admin Fetch error: ${err.message}`);
      }
    }
  }
}

runTests();
