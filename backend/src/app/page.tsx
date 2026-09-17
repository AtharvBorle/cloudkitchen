import Link from "next/link";

export default function BackendHome() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          width: "100%",
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "40px 36px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚀</div>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            margin: "0 0 10px 0",
            background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Neo Cloud Kitchen & Room Rental
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 28px 0" }}>
          REST API Backend Server • 100+ Endpoints Live
        </p>

        {/* Status Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "#064e3b",
              color: "#34d399",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1px solid #059669",
            }}
          >
            ● Server Online (Port 5000)
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "#1e1b4b",
              color: "#a5b4fc",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1px solid #4338ca",
            }}
          >
            JWT Bearer Auth Ready
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "#312e81",
              color: "#c7d2fe",
              fontSize: "0.85rem",
              fontWeight: 600,
              border: "1px solid #6366f1",
            }}
          >
            OpenAPI 3.0.3
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "stretch",
            maxWidth: "420px",
            margin: "0 auto 32px auto",
          }}
        >
          <Link
            href="/docs"
            style={{
              padding: "14px 24px",
              borderRadius: "10px",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
              transition: "transform 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <span>📖</span>
            <span>Open Interactive Swagger UI</span>
            <span>→</span>
          </Link>

          <Link
            href="/api/docs"
            target="_blank"
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              backgroundColor: "#334155",
              color: "#f8fafc",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              border: "1px solid #475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>📄</span>
            <span>View Raw OpenAPI JSON Spec</span>
            <span>↗</span>
          </Link>
        </div>

        {/* Quick Testing Guide */}
        <div
          style={{
            textAlign: "left",
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "18px 20px",
            fontSize: "0.85rem",
            lineHeight: "1.5",
          }}
        >
          <strong style={{ color: "#38bdf8", display: "block", marginBottom: "6px" }}>
            🔑 Testing Authorized Endpoints with Swagger:
          </strong>
          <ol style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1" }}>
            <li>Open <Link href="/docs" style={{ color: "#38bdf8" }}>/docs</Link> to launch Swagger UI.</li>
            <li>Execute <strong style={{ color: "#facc15" }}>POST /api/auth/login</strong> or <strong style={{ color: "#facc15" }}>POST /api/auth/register</strong>.</li>
            <li>Copy the <code style={{ color: "#38bdf8" }}>token</code> string from the JSON response.</li>
            <li>Click the green <strong>"Authorize 🔓"</strong> button in Swagger, paste your token, and test any protected endpoint!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
