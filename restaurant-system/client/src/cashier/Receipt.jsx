import { forwardRef } from "react";

export const Receipt = forwardRef(function Receipt(
  { order, brand = "The Flavor Hub", cashierName = "Muhammad Hamza" },
  ref
) {
  if (!order) return null;

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const orderNum = order.orderNumber || order.orderId || (order._id ? order._id.slice(-6).toUpperCase() : "BH-1001");
  const cashier = order.receivedBy?.name || order.createdBy?.name || cashierName;
  const tableNum = order.table?.number || order.table?.tableNumber || (order.table && typeof order.table === "string" ? order.table : "");

  return (
    <div ref={ref} className="receipt-slip" id="printable-receipt">
      <style>{`
        .receipt-slip {
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          background: #ffffff;
          color: #111111;
          padding: 24px 18px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12.5px;
          line-height: 1.35;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          border-radius: 6px;
        }
        .rc-header { text-align: center; margin-bottom: 8px; }
        .rc-logo-box {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border: 2px solid #111; border-radius: 6px;
          font-weight: 900; font-size: 15px; margin-bottom: 4px;
        }
        .rc-brand { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
        .rc-sub { font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 0.5px; }
        .rc-info { font-size: 10.5px; color: #444; margin-top: 3px; }
        .rc-div { border-top: 1px dashed #777; margin: 8px 0; }
        .rc-div-double { border-top: 2px dashed #111; margin: 10px 0; }
        .rc-row { display: flex; justify-content: space-between; gap: 6px; margin: 2.5px 0; }
        .rc-bold { font-weight: 700; }
        .rc-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 12px; }
        .rc-table th { border-bottom: 1px dashed #555; padding: 4px 0; text-align: left; font-size: 11px; text-transform: uppercase; }
        .rc-table td { padding: 4px 0; vertical-align: top; }
        .rc-r { text-align: right; }
        .rc-c { text-align: center; }
        .rc-total-row { font-size: 15px; font-weight: 900; margin: 4px 0; }
        .rc-status-pill {
          display: inline-block; padding: 3px 8px; border-radius: 4px;
          border: 1.5px solid #111; font-weight: 800; font-size: 11px;
        }
        .rc-barcode {
          font-family: 'Libre Barcode 39', monospace;
          letter-spacing: 4px; font-size: 22px; text-align: center;
          margin: 6px 0 2px;
        }

        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 78mm !important; max-width: 78mm !important;
            box-shadow: none !important; border-radius: 0 !important; padding: 6mm 4mm !important;
          }
        }
      `}</style>

      {/* Header & Logo */}
      <div className="rc-header">
        <div className="rc-logo-box">BH</div>
        <div className="rc-brand">{brand}</div>
        <div className="rc-sub">Artisanal Burgers &amp; Cafe</div>
        <div className="rc-info">Commercial Blvd, Phase 5, DHA</div>
        <div className="rc-info">Tel: +92 300 1234567 | NTN: 9283741-2</div>
      </div>

      <div className="rc-div" />

      {/* Ticket Info */}
      <div className="rc-row">
        <span>Order #:</span>
        <span className="rc-bold">#{orderNum}</span>
      </div>
      <div className="rc-row">
        <span>Date &amp; Time:</span>
        <span>{dateStr} {timeStr}</span>
      </div>
      <div className="rc-row">
        <span>Order Type:</span>
        <span className="rc-bold" style={{ textTransform: "uppercase" }}>
          {order.type || "Dine-In"} {tableNum ? `[Table ${tableNum}]` : ""}
        </span>
      </div>
      {(order.customer?.name || order.customerName) && (
        <div className="rc-row">
          <span>Customer:</span>
          <span className="rc-bold">{order.customer?.name || order.customerName}</span>
        </div>
      )}
      {(order.customer?.phone || order.phone) && (
        <div className="rc-row">
          <span>Phone:</span>
          <span>{order.customer?.phone || order.phone}</span>
        </div>
      )}
      <div className="rc-row">
        <span>Cashier:</span>
        <span>{cashier}</span>
      </div>

      <div className="rc-div" />

      {/* Itemized Table */}
      <table className="rc-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="rc-c">Qty</th>
            <th className="rc-r">Rate</th>
            <th className="rc-r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => {
            const qty = item.quantity || item.qty || 1;
            const price = item.price || 0;
            return (
              <tr key={idx}>
                <td style={{ maxWidth: "140px", wordBreak: "break-word" }}>{item.name}</td>
                <td className="rc-c">{qty}</td>
                <td className="rc-r">{price}</td>
                <td className="rc-r rc-bold">{price * qty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="rc-div" />

      {/* Billing Breakdown */}
      <div className="rc-row">
        <span>Subtotal:</span>
        <span>Rs. {order.subtotal || order.total}</span>
      </div>

      {order.discount > 0 && (
        <div className="rc-row">
          <span>Discount:</span>
          <span>- Rs. {order.discount}</span>
        </div>
      )}

      {order.tax > 0 && (
        <div className="rc-row">
          <span>GST / Sales Tax (5%):</span>
          <span>Rs. {order.tax}</span>
        </div>
      )}

      <div className="rc-div-double" />

      <div className="rc-row rc-total-row">
        <span>TOTAL DUE:</span>
        <span>Rs. {order.total}</span>
      </div>

      <div className="rc-div-double" />

      {/* Payment Tender */}
      <div className="rc-row" style={{ alignItems: "center" }}>
        <span>Payment Status:</span>
        <span className="rc-status-pill">
          {order.paymentStatus === "paid" ? "PAID (CASH)" : "UNPAID"}
        </span>
      </div>

      {order.amountReceived > 0 && (
        <>
          <div className="rc-row" style={{ marginTop: 4 }}>
            <span>Cash Tendered:</span>
            <span>Rs. {order.amountReceived}</span>
          </div>
          <div className="rc-row">
            <span>Change Returned:</span>
            <span className="rc-bold">Rs. {order.changeGiven || 0}</span>
          </div>
        </>
      )}

      <div className="rc-div" />

      {/* Barcode Graphic & Footer */}
      <div className="rc-barcode">|||||||||||||||||||||||||||</div>
      <div style={{ fontSize: 9.5, textAlign: "center", color: "#666" }}>
        AUTH #{orderNum} · THANK YOU!
      </div>

      <div style={{ textAlign: "center", fontSize: 10.5, marginTop: 10, lineHeight: 1.4 }}>
        <div className="rc-bold">Thank You For Dining With Us!</div>
        <div>Please visit again soon.</div>
        <div style={{ fontSize: 9.5, color: "#666", marginTop: 2 }}>www.flavorhub.pk</div>
      </div>
    </div>
  );
});

export default Receipt;
