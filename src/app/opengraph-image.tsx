import { ImageResponse } from "next/og";

export const alt = "Logos — Advanced Bible Study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          background: "linear-gradient(150deg, #2A2114 0%, #191209 60%, #14100A 100%)",
          color: "#F3E6CB",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 3.5 C35.6 9.2 40.5 12.4 40.5 18 C40.5 22.8 36.7 26.5 32 26.5 C27.3 26.5 23.5 22.8 23.5 18 C23.5 12.4 28.4 9.2 32 3.5 Z"
            fill="#D9A64F"
          />
          <path
            d="M32 12.5 C33.9 15.4 36.2 17 36.2 19.4 C36.2 21.7 34.3 23.5 32 23.5 C29.7 23.5 27.8 21.7 27.8 19.4 C27.8 17 30.1 15.4 32 12.5 Z"
            fill="#FDF6E9"
            fillOpacity="0.85"
          />
          <path
            d="M30.4 32 C24.8 27.2 16 25.9 7.5 28.8 L7.5 52.6 C16 49.7 24.4 50.8 30.4 55.4 Z"
            fill="#D9A64F"
          />
          <path
            d="M33.6 32 C39.2 27.2 48 25.9 56.5 28.8 L56.5 52.6 C48 49.7 39.6 50.8 33.6 55.4 Z"
            fill="#D9A64F"
          />
        </svg>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
          Logos
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#C9AE7A" }}>
          Advanced Bible Study
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#8E7C5C",
            fontStyle: "italic",
            marginTop: 10,
          }}
        >
          “Thy word is a lamp unto my feet, and a light unto my path.”
        </div>
      </div>
    ),
    { ...size }
  );
}
