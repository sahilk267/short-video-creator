import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { videoUiFontFamily } from "./fontStacks";
import type { ContentTemplate } from "./ContentTemplateEngine";
import { pickTemplateChrome } from "./ContentTemplateEngine";
import type { VideoTheme } from "./ThemeEngine";

interface TemplateChromeProps {
  template: ContentTemplate;
  theme: VideoTheme;
  sceneIndex: number;
  totalScenes: number;
}

const anchorStyle = (anchor: ContentTemplate["chromeAnchor"]): React.CSSProperties => {
  switch (anchor) {
    case "top-right":
      return { top: 20, right: 24 };
    case "top-center":
      return { top: 20, left: "50%", transform: "translateX(-50%)" };
    case "bottom-left":
      return { bottom: 24, left: 24 };
    case "top-left":
    default:
      return { top: 20, left: 24 };
  }
};

export const TemplateChrome: React.FC<TemplateChromeProps> = ({
  template,
  theme,
  sceneIndex,
  totalScenes,
}) => {
  const frame = useCurrentFrame();

  const chip = pickTemplateChrome(template, sceneIndex, totalScenes);

  // Intro flash: full-frame accent flash for ~16 frames on scene 0.
  const flashDuration = 16;
  const flashOpacity = interpolate(frame, [0, 4, flashDuration * 0.6, flashDuration], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const flashScale = interpolate(frame, [0, flashDuration], [1.4, 1], {
    extrapolateRight: "clamp",
  });

  const chipOpacity = interpolate(frame, [0, 8, 20, 30], [0, 1, 1, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Fallback guard: only render real content when something is on screen */}
      {chip.introFlashText && flashOpacity > 0.02 ? (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            opacity: flashOpacity,
            zIndex: 20,
          }}
        >
          <div
            style={{
              transform: `scale(${flashScale})`,
              background: `linear-gradient(135deg, ${theme.palette.accent} 0%, rgba(10,16,24,0.95) 85%)`,
              padding: "28px 64px",
              borderRadius: 24,
              boxShadow: `0 0 90px ${theme.palette.accentGlow}`,
              border: `2px solid ${theme.palette.accent}`,
              fontFamily: videoUiFontFamily,
              fontSize: "6rem",
              fontWeight: 900,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            {chip.introFlashText}
          </div>
        </AbsoluteFill>
      ) : null}

      {chip.showChip ? (
        <div
          style={{
            position: "absolute",
            ...anchorStyle(template.chromeAnchor),
            zIndex: 10,
            opacity: chipOpacity,
            background: "rgba(8, 12, 18, 0.78)",
            border: `1px solid ${theme.palette.accent}`,
            borderRadius: 999,
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: `0 10px 28px rgba(0,0,0,0.35)`,
            backdropFilter: "blur(12px)",
            fontFamily: videoUiFontFamily,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "#ffffff",
            fontSize: "1.2rem",
          }}
        >
          <span
            style={{
              color: theme.palette.accent,
              fontSize: "1.05rem",
              fontWeight: 900,
            }}
          >
            {template.chromeKind === "split-label" ? "VS" : "●"}
          </span>
          {chip.chipText}
        </div>
      ) : null}
    </>
  );
};