import { useRef } from "react";
import Receipt from "./Receipt";

export default function ReceiptModal({ order, cashierName, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!order) return;
    const orderNum = order.orderNumber || order.orderId || "receipt";
    const receiptElement = document.getElementById("printable-receipt");
    if (!receiptElement) return;

    // Build standalone HTML document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt_Order_${orderNum}</title>
  <style>
    body {
      background: #f0f0f0;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      font-family: 'Courier New', Courier, monospace;
    }
    @media print {
      body { background: #fff; padding: 0; }
    }
  </style>
</head>
<body>
  ${receiptElement.outerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_Order_${orderNum}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#1b211e",
          border: "1px solid rgba(217, 164, 65, 0.3)",
          borderRadius: "14px",
          padding: "20px",
          maxWidth: "400px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(217, 164, 65, 0.15)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              background: "#d9a441",
              color: "#151a17",
              fontWeight: "900",
              fontSize: "12px",
            }}>
              BH
            </span>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#f4ead5" }}>
              Customer Thermal Receipt
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              color: "rgba(244, 234, 213, 0.6)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
          <Receipt ref={receiptRef} order={order} cashierName={cashierName} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            borderTop: "1px solid rgba(217, 164, 65, 0.15)",
            paddingTop: "14px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="ad-btn ad-btn--ghost"
            style={{ padding: "8px 14px", fontSize: "13px" }}
          >
            Close
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleDownload}
              className="ad-btn ad-btn--ghost"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              title="Download receipt file to your PC"
            >
              Download Receipt
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="ad-btn ad-btn--solid"
              style={{ padding: "8px 18px", fontSize: "13px" }}
              title="Print to connected printer or save as PDF"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
