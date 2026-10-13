import { ImageResponse } from "next/og";

export const alt = "SWAP — Sell. Swap. Verify.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only artwork: the default OG font has no Arabic glyphs.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#17191c", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 24, background: "#0e9f6e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="54" height="54" viewBox="0 0 32 32"><g fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.2h13" /><path d="m18.6 8.8 3.6 3.4-3.6 3.4" /><path d="M23 19.8H10" /><path d="m13.4 16.4-3.6 3.4 3.6 3.4" /></g></svg>
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: 6 }}>SWAP</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 22, fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}><span>Sell. Swap.</span><span style={{ color: "#22c38e" }}>Verify.</span></div>
          <div style={{ fontSize: 30, color: "#a0a7b0" }}>Saudi marketplace for used PCs, laptops & parts — with inspection reports.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Structured specs", "Swap offers", "Inspection reports"].map((t) => (
            <div key={t} style={{ fontSize: 24, padding: "10px 20px", borderRadius: 999, border: "1px solid #343a40", color: "#eceef0" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
