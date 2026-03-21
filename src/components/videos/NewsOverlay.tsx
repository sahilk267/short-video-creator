import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

const { fontFamily } = loadFont();

interface NewsOverlayProps {
  headline?: string;
  tickerText?: string;
}

export const NewsOverlay: React.FC<NewsOverlayProps> = ({ headline, tickerText }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Breaking News Banner animation (Slide in)
  const bannerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const bannerTranslate = interpolate(frame, [0, 15], [-50, 0], { extrapolateRight: "clamp" });

  // Ticker animation (infinite scroll)
  const tickerSpeed = 2; // pixels per frame
  const tickerTranslate = -(frame * tickerSpeed) % width;

  return (
    <AbsoluteFill style={{ color: "white", fontFamily }}>
      {/* Top Banner (Breaking News) */}
      {headline && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 50,
            backgroundColor: "#cc0000", // News Red
            padding: "10px 30px",
            fontSize: "2.5rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            borderLeft: "8px solid white",
            boxShadow: "10px 10px 20px rgba(0,0,0,0.5)",
            opacity: bannerOpacity,
            transform: `translateX(${bannerTranslate}px)`,
          }}
        >
          Breaking News
          <div
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "5px 20px",
              fontSize: "1.8rem",
              marginTop: 10,
              textTransform: "none",
            }}
          >
            {headline}
          </div>
        </div>
      )}

      {/* Ticker Tape (Bottom) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 60,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          borderTop: "2px solid #cc0000",
        }}
      >
        <div
          style={{
            backgroundColor: "#cc0000",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            fontWeight: "bold",
            zIndex: 10,
            fontSize: "1.2rem",
          }}
        >
          LATEST
        </div>
        <div
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            transform: `translateX(${tickerTranslate}px)`,
            fontSize: "1.5rem",
          }}
        >
          <span style={{ marginRight: 100 }}>{tickerText || headline || "Loading the latest news updates..."}</span>
          <span style={{ marginRight: 100 }}>{tickerText || headline || "Loading the latest news updates..."}</span>
          <span style={{ marginRight: 100 }}>{tickerText || headline || "Loading the latest news updates..."}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
