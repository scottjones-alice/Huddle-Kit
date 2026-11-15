import { ImageResponse } from "next/og";

export const alt =
  "Huddlekit. Your game. Your people. One home for your grassroots football club.";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#102d22",
        color: "#f8f8ed",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: 76,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
        huddlekit<span style={{ color: "#c6ef68" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 100,
          fontWeight: 700,
          letterSpacing: -6,
          lineHeight: 1.05,
        }}
      >
        <span>Your game.</span>
        <span style={{ color: "#c6ef68" }}>Your people.</span>
      </div>
      <div style={{ display: "flex", fontSize: 26 }}>
        One home for your grassroots football club.
      </div>
      <div
        style={{
          alignItems: "center",
          border: "2px solid #496651",
          borderRadius: 4,
          display: "flex",
          height: 480,
          justifyContent: "center",
          position: "absolute",
          right: -115,
          top: 80,
          width: 400,
        }}
      >
        <div
          style={{
            border: "2px solid #496651",
            borderRadius: "50%",
            height: 180,
            width: 180,
          }}
        />
      </div>
    </div>,
    size
  );
}
