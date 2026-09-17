export default function DocsPage() {
  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      <iframe
        src="/swagger/index.html"
        title="Swagger API Console"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}
