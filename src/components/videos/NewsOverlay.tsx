import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

const { fontFamily } = loadFont();

interface NewsOverlayProps {
  headline?: string;
  tickerText?: string;
  sceneIndex?: number;
  totalScenes?: number;
}

export const NewsOverlay: React.FC<NewsOverlayProps> = ({
  headline,
  tickerText,
  sceneIndex = 0,
  totalScenes = 1,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const introOpacity = interpolate(frame, [0, 8, 20], [0, 1, 1], {
    extrapolateRight: "clamp",
  });
  const introTranslate = interpolate(frame, [0, 16], [40, 0], {
    extrapolateRight: "clamp",
  });
  const headlineScale = interpolate(frame, [0, 14], [0.94, 1], {
    extrapolateRight: "clamp",
  });
  const progressWidth = interpolate(
    frame,
    [0, 90],
    [0, Math.min(88, ((sceneIndex + 1) / Math.max(totalScenes, 1)) * 100)],
    { extrapolateRight: "clamp" },
  );

  const tickerSpeed = 2;
  const tickerTranslate = -(frame * tickerSpeed) % width;
  const sectionLabel = `Scene ${sceneIndex + 1}/${totalScenes}`;

  return (
    <AbsoluteFill style={{ color: "white", fontFamily, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,12,18,0.72) 0%, rgba(8,12,18,0.18) 26%, rgba(8,12,18,0) 48%, rgba(8,12,18,0.58) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${progressWidth}%`,
          height: 10,
          background: "linear-gradient(90deg, #ff5a36 0%, #ffd166 100%)",
          boxShadow: "0 0 18px rgba(255, 90, 54, 0.6)",
          opacity: 0.95,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 42,
          left: 42,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: introOpacity,
          transform: `translateY(${introTranslate}px)`,
        }}
      >
        <div
          style={{
            background: "#ff5a36",
            color: "#fff7ef",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: "1.15rem",
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            boxShadow: "0 10px 28px rgba(255, 90, 54, 0.3)",
          }}
        >
          Live
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(14px)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {sectionLabel}
        </div>
      </div>

      {headline && (
        <div
          style={{
            position: "absolute",
            top: 118,
            left: 42,
            right: 42,
            opacity: introOpacity,
            transform: `translateY(${introTranslate}px) scale(${headlineScale})`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              maxWidth: "86%",
              background: "rgba(10, 16, 24, 0.72)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 28,
              padding: "18px 24px 20px 24px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                color: "#ffd166",
                fontSize: "1.05rem",
                fontWeight: 800,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Top Story
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "2.6rem",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                textShadow: "0 4px 18px rgba(0,0,0,0.25)",
              }}
            >
              {headline}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 64,
          background: "rgba(8,12,18,0.88)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div
          style={{
            background: "#ff5a36",
            height: "100%",
            minWidth: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 18px",
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            zIndex: 2,
            boxShadow: "8px 0 20px rgba(0,0,0,0.2)",
          }}
        >
          Latest
        </div>
        <div
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            transform: `translateX(${tickerTranslate}px)`,
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.94)",
          }}
        >
          <span style={{ marginRight: 120 }}>{tickerText || headline || "Tracking the latest updates now"}</span>
          <span style={{ marginRight: 120 }}>{tickerText || headline || "Tracking the latest updates now"}</span>
          <span style={{ marginRight: 120 }}>{tickerText || headline || "Tracking the latest updates now"}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
