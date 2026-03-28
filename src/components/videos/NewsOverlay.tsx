import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

const { fontFamily } = loadFont();

interface NewsOverlayProps {
  headline?: string;
  tickerText?: string;
  sceneIndex?: number;
  totalScenes?: number;
  categoryLabel?: string;
}

type OverlayTheme = {
  label: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
};

const resolveOverlayTheme = (
  headline?: string,
  categoryLabel?: string,
  tickerText?: string,
): OverlayTheme => {
  const haystack = `${headline || ""} ${categoryLabel || ""} ${tickerText || ""}`.toLowerCase();

  if (/(cricket|nba|sports|football|match|league|tournament)/.test(haystack)) {
    return {
      label: categoryLabel || "Sports Desk",
      accent: "#30d158",
      accentSoft: "#d2ffe0",
      accentGlow: "rgba(48, 209, 88, 0.38)",
    };
  }

  if (/(market|stocks|business|trade|economy|tariff|earnings)/.test(haystack)) {
    return {
      label: categoryLabel || "Market Watch",
      accent: "#ffd166",
      accentSoft: "#fff5cf",
      accentGlow: "rgba(255, 209, 102, 0.38)",
    };
  }

  if (/(science|space|research|lab|climate|tech|chip|ai|nvidia)/.test(haystack)) {
    return {
      label: categoryLabel || "Deep Brief",
      accent: "#4cc9f0",
      accentSoft: "#d7f7ff",
      accentGlow: "rgba(76, 201, 240, 0.38)",
    };
  }

  return {
    label: categoryLabel || "Top Story",
    accent: "#ff5a36",
    accentSoft: "#fff1ea",
    accentGlow: "rgba(255, 90, 54, 0.38)",
  };
};

export const NewsOverlay: React.FC<NewsOverlayProps> = ({
  headline,
  tickerText,
  sceneIndex = 0,
  totalScenes = 1,
  categoryLabel,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const theme = resolveOverlayTheme(headline, categoryLabel, tickerText);

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
  const tickerOpacity = interpolate(frame, [0, 12, 22], [0, 0.86, 1], {
    extrapolateRight: "clamp",
  });
  const tickerLift = interpolate(frame, [0, 18], [18, 0], {
    extrapolateRight: "clamp",
  });
  const livePulse = interpolate(frame % 30, [0, 15, 30], [1, 1.08, 1], {
    extrapolateRight: "clamp",
  });
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
          background: `linear-gradient(90deg, ${theme.accent} 0%, #ffffff 100%)`,
          boxShadow: `0 0 18px ${theme.accentGlow}`,
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
            background: theme.accent,
            color: theme.accentSoft,
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: "1.15rem",
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            boxShadow: `0 10px 28px ${theme.accentGlow}`,
            transform: `scale(${livePulse})`,
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
                color: theme.accent,
                fontSize: "1.05rem",
                fontWeight: 800,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {theme.label}
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
            <div
              style={{
                marginTop: 12,
                width: 88,
                height: 5,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${theme.accent} 0%, rgba(255,255,255,0.18) 100%)`,
              }}
            />
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
          opacity: tickerOpacity,
          transform: `translateY(${tickerLift}px)`,
        }}
      >
        <div
          style={{
            background: theme.accent,
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
          {theme.label}
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
