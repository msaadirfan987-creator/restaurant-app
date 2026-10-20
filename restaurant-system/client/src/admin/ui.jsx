import { useEffect, useState, useCallback } from "react";

/**
 * ui.jsx — Shared Admin UI Components & Styles
 */

export function UiStyles() {
  return (
    <style>{`
      /* Form inputs & layout */
      .ap-form { display: flex; flex-direction: column; gap: 16px; }
      .ap-form .full { width: 100%; }
      .ap-form .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 600px) { .ap-form .grid-2 { grid-template-columns: 1fr; } }
      .ap-input, .ap-select, .ap-textarea {
        width: 100%; padding: 11px 14px; border-radius: 8px;
        background: #1b211e; border: 1px solid rgba(244, 234, 213, 0.16);
        color: #f4ead5; font-size: 14px; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s;
      }
      .ap-input:focus, .ap-select:focus, .ap-textarea:focus {
        outline: none; border-color: #d9a441; box-shadow: 0 0 0 3px rgba(217, 164, 65, 0.18);
      }
      .ap-input.has-error, .ap-select.has-error { border-color: #f0907f; }
      .ap-textarea { min-height: 80px; resize: vertical; }

      /* Table layout */
      .ap-tablewrap {
        width: 100%; overflow-x: auto; background: #1b211e;
        border: 1px solid rgba(244, 234, 213, 0.08); border-radius: 12px;
      }
      .ap-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
      .ap-table th {
        padding: 14px 18px; font-weight: 700; color: rgba(244, 234, 213, 0.6);
        border-bottom: 1px solid rgba(244, 234, 213, 0.08); background: rgba(0,0,0,0.15);
      }
      .ap-table td {
        padding: 14px 18px; border-bottom: 1px solid rgba(244, 234, 213, 0.05);
        color: #f4ead5; vertical-align: middle;
      }
      .ap-table tbody tr:hover { background: rgba(244, 234, 213, 0.03); }
      .ap-table th.ap-right, .ap-table td.ap-right { text-align: right; }
      .ap-cell-main { display: flex; align-items: center; gap: 14px; }
      .ap-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #242a27; }
      .ap-thumb-ph {
        width: 44px; height: 44px; border-radius: 8px; background: #1f4a38; color: #f4ead5;
        display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
      }
      .ap-strong { font-weight: 600; color: #f4ead5; }
      .ap-muted { color: rgba(244, 234, 213, 0.6); }
      .ap-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

      /* Buttons */
      .ap-btn--sm { padding: 6px 12px; font-size: 13px; }
      .ap-btn--danger { border: 2px solid #f0907f; background: rgba(240, 144, 127, 0.12); color: #f0907f; }
      .ap-btn--danger:hover:not(:disabled) { background: #f0907f; color: #151a17; }
      .ap-btn--success { border: 2px solid #2ecc71; background: rgba(46, 204, 113, 0.12); color: #2ecc71; }

      /* Badges & Pills */
      .ap-badge {
        display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px;
        font-size: 12px; font-weight: 700; text-transform: capitalize;
      }
      .ap-badge--pending { background: rgba(217, 164, 65, 0.2); color: #d9a441; }
      .ap-badge--confirmed { background: rgba(52, 152, 219, 0.2); color: #3498db; }
      .ap-badge--preparing { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
      .ap-badge--out_for_delivery { background: rgba(230, 126, 34, 0.2); color: #e67e22; }
      .ap-badge--delivered { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
      .ap-badge--cancelled { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }

      /* Image Uploader & Previews */
      .ap-images { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
      .ap-img-item {
        position: relative; width: 84px; height: 84px; border-radius: 8px; overflow: hidden;
        border: 1px solid rgba(244, 234, 213, 0.15); background: #242a27;
      }
      .ap-img-item img { width: 100%; height: 100%; object-fit: cover; }
      .ap-img-rm {
        position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75);
        color: #f0907f; font-size: 11px; font-weight: 700; border: 0; padding: 3px; cursor: pointer; text-align: center;
      }
      .ap-img-add {
        cursor: pointer; width: 84px; height: 84px; border-radius: 8px;
        border: 2px dashed rgba(217, 164, 65, 0.4); display: flex; flex-direction: column;
        align-items: center; justify-content: center; font-size: 12px; color: #d9a441;
        font-weight: 600; text-align: center; padding: 6px; transition: border-color 0.2s;
      }
      .ap-img-add:hover { border-color: #d9a441; background: rgba(217, 164, 65, 0.05); }
      .ap-img-add input[type="file"] { display: none; }
      .ap-spin {
        display: inline-block; width: 22px; height: 22px; border: 2px solid rgba(244, 234, 213, 0.2);
        border-top-color: #d9a441; border-radius: 50%; animation: ap-spin 800ms linear infinite;
      }
      @keyframes ap-spin { to { transform: rotate(360deg); } }

      /* Cards & Metric grids */
      .ap-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 28px; }
      .ap-stat-card {
        background: #1b211e; border: 1px solid rgba(244, 234, 213, 0.08); border-radius: 12px;
        padding: 20px; display: flex; flex-direction: column; gap: 8px;
      }
      .ap-stat-title { font-size: 13px; font-weight: 600; color: rgba(244, 234, 213, 0.6); text-transform: uppercase; letter-spacing: 0.05em; }
      .ap-stat-value { font-size: 28px; font-weight: 800; color: #f4ead5; }
      .ap-stat-hint { font-size: 12px; color: #d9a441; }

      @media (max-width: 600px) {
        .ap-stat-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        .ap-stat-card { padding: 14px; }
        .ap-stat-value { font-size: 22px; }
        .ap-table th, .ap-table td { padding: 10px 12px; font-size: 13px; }
        .ap-tablewrap { -webkit-overflow-scrolling: touch; }
      }
    `}</style>
  );
}

export function Button({
  variant = "solid", // solid | ghost | danger | success
  busy = false,
  disabled = false,
  className = "",
  onClick,
  children,
  type = "button",
  ...rest
}) {
  let vClass = "ad-btn--solid";
  if (variant === "ghost") vClass = "ad-btn--ghost";
  if (variant === "danger") vClass = "ap-btn--danger";
  if (variant === "success") vClass = "ap-btn--success";

  return (
    <button
      type={type}
      className={`ad-btn ${vClass} ${className}`}
      disabled={disabled || busy}
      onClick={onClick}
      {...rest}
    >
      {busy ? "Processing..." : children}
    </button>
  );
}

export function Field({ label, id, error, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: "14px", fontWeight: "600", color: "#f4ead5" }}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <span style={{ fontSize: "12px", color: "rgba(244, 234, 213, 0.55)" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: "12px", color: "#f0907f", fontWeight: "600" }}>{error}</span>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "28px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: "700",
            color: "#f4ead5",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(244, 234, 213, 0.65)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Modal({ title, onClose, busy = false, footer, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#1b211e",
          border: "1px solid rgba(244, 234, 213, 0.12)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(244, 234, 213, 0.08)",
          }}
        >
          <h2
            id="modal-title"
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "700",
              color: "#f4ead5",
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: 0,
              color: "rgba(244, 234, 213, 0.6)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              padding: "16px 24px",
              borderTop: "1px solid rgba(244, 234, 213, 0.08)",
              background: "rgba(0,0,0,0.15)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, busy = false }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      busy={busy}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" busy={busy} onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "rgba(244, 234, 213, 0.85)" }}>
        {message}
      </p>
    </Modal>
  );
}

export function EmptyBlock({ title, text, action }) {
  return (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        background: "#1b211e",
        border: "1px dashed rgba(244, 234, 213, 0.15)",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700", color: "#f4ead5" }}>
        {title}
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: "14px", color: "rgba(244, 234, 213, 0.6)" }}>
        {text}
      </p>
      {action}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        background: "#1b211e",
        border: "1px solid rgba(240, 144, 127, 0.3)",
        borderRadius: "12px",
      }}
    >
      <p style={{ margin: "0 0 16px", color: "#f0907f", fontWeight: "600" }}>{error}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = "Loading data" }) {
  return (
    <div
      style={{
        padding: "60px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        color: "rgba(244, 234, 213, 0.7)",
      }}
    >
      <span className="ap-spin" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
      <p style={{ margin: 0, fontSize: "14px" }}>{label}...</p>
    </div>
  );
}

export function Toaster({ toasts = [] }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "380px",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            background: t.type === "error" ? "#2a1e1b" : "#1b2621",
            border: `1px solid ${t.type === "error" ? "#f0907f" : "#d9a441"}`,
            color: "#f4ead5",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
            animation: "ad-fade-up 300ms ease both",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fn()
      .then((res) => {
        if (alive) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message || "Failed to load data.");
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
