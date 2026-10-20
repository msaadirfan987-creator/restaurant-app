import { useState } from "react";
import { adminApi } from "./adminApi";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader, useFetch } from "./ui";

export default function CustomersPage() {
  const list = useFetch(() => adminApi.customers.list(), []);
  const [search, setSearch] = useState("");

  const customers = list.data?.customers || [];
  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="View registered customers and account details."
      />

      <div style={{ marginBottom: 20, maxWidth: 320 }}>
        <input
          type="search"
          className="ap-input"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {list.loading && !list.data ? (
        <LoadingBlock label="Loading customer accounts" />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : customers.length === 0 ? (
        <EmptyBlock
          title="No customers registered yet"
          text="When customers create an account on your website, they will appear in this directory."
        />
      ) : (
        <div className="ap-tablewrap">
          <table className="ap-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th className="ap-right">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id || c.id || i} style={{ "--i": i }}>
                  <td>
                    <div className="ap-cell-main">
                      <span className="ap-thumb-ph">
                        {(c.name || "C").charAt(0).toUpperCase()}
                      </span>
                      <span className="ap-strong">{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="ap-muted">{c.email}</span>
                  </td>
                  <td>
                    <span className="ap-muted">{c.phone || "—"}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "capitalize",
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "rgba(31, 74, 56, 0.4)",
                        color: "#2ecc71",
                      }}
                    >
                      {c.role || "customer"}
                    </span>
                  </td>
                  <td className="ap-right">
                    <span className="ap-muted">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
