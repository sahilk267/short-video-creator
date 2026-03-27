/**
 * LongFormVideo – Phase 3.2
 *
 * Remotion component for 16:9 landscape long-form video (YouTube standard).
 * Supports chapters derived from scenes, bottom captions, B-roll + music.
 */
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  OffthreadVideo,
  Img,
  interpolate,
} from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { calculateVolume, createCaptionPages, shortVideoSchema } from "../utils";

const { fontFamily } = loadFont(); // "Barlow Condensed"

/** Same schema as shortVideoSchema – reused for compatibility */
export const LongFormVideo: React.FC<z.infer<typeof shortVideoSchema>> = ({
  scenes,
  music,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionBackgroundColor = config.captionBackgroundColor ?? "#111111";
  const [musicVolume, musicMuted] = calculateVolume(config.musicVolume);

  // Chapter label derived from scene headline
  const buildChapterLabel = (headline?: string, index?: number): string => {
    if (headline) return headline;
    return `Chapter ${(index ?? 0) + 1}`;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Background music loop */}
      <Audio
        loop
        src={music.url}
        startFrom={music.start * fps}
        endAt={music.end * fps}
        volume={() => musicVolume}
        muted={musicMuted}
      />

      {scenes.map((scene, i) => {
        const { captions, audio, video, imageUrl, headline } = scene;

        const pages = createCaptionPages({
          captions,
          lineMaxLength: 32, // wider for 16:9
          lineCount: 2,
          maxDistanceMs: 1200,
        });

        const startFrame =
          scenes.slice(0, i).reduce((acc, curr) => acc + curr.audio.duration, 0) * fps;
        const durationInFrames = Math.ceil(audio.duration * fps);

        return (
          <Sequence
            key={i}
            from={Math.round(startFrame)}
            durationInFrames={durationInFrames}
          >
            {/* Scene media */}
            <AbsoluteFill>
              {video ? (
                <OffthreadVideo
                  src={video}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${interpolate(frame - Math.round(startFrame), [0, durationInFrames], [1.01, 1.05], { extrapolateRight: "clamp" })})`,
                    opacity: interpolate(frame - Math.round(startFrame), [0, 8, durationInFrames], [0.78, 1, 0.92], { extrapolateRight: "clamp" }),
                  }}
                />
              ) : imageUrl ? (
                <Img
                  src={imageUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${interpolate(frame - Math.round(startFrame), [0, durationInFrames], [1.01, 1.06], { extrapolateRight: "clamp" })})`,
                    opacity: interpolate(frame - Math.round(startFrame), [0, 8, durationInFrames], [0.78, 1, 0.92], { extrapolateRight: "clamp" }),
                  }}
                />
              ) : null}
            </AbsoluteFill>

            {/* Dark gradient overlay for readability */}
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.65) 100%)",
              }}
            />

            {/* Chapter label – top-left */}
            {i === 0 || true ? (
              <AbsoluteFill
                style={{
                  top: 40,
                  left: 60,
                  position: "absolute",
                  color: "#ffffff",
                  fontSize: 22,
                  fontFamily,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  background: "rgba(8,12,18,0.58)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  padding: "10px 16px",
                  borderRadius: 999,
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.24)",
                  opacity: interpolate(
                    frame - Math.round(startFrame),
                    [0, 15, durationInFrames - 15, durationInFrames],
                    [0, 1, 1, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  ),
                }}
              >
                {buildChapterLabel(headline, i)}
              </AbsoluteFill>
            ) : null}

            {/* Scene audio */}
            <Audio src={audio.url} />

            {/* Bottom captions */}
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: 60,
              }}
            >
              {pages.map((page, pageIdx) => {
                const pageStart = page.startMs / 1000;
                const pageEnd = page.endMs / 1000;
                const sceneFrame = frame - Math.round(startFrame);
                const isVisible =
                  sceneFrame >= pageStart * fps && sceneFrame <= pageEnd * fps;

                if (!isVisible) return null;

                return (
                  <div
                    key={pageIdx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {page.lines.map((line, lineIdx) => (
                      <div
                        key={lineIdx}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 4,
                          flexWrap: "wrap",
                          justifyContent: "center",
                        }}
                      >
                        {line.texts.map((word, wordIdx) => {
                          const wordFrameStart = word.startMs / 1000;
                          const isActiveWord = sceneFrame / fps >= wordFrameStart;
                          return (
                            <span
                              key={wordIdx}
                              style={{
                                fontSize: 34,
                                fontFamily,
                                fontWeight: isActiveWord ? 800 : 600,
                                color: isActiveWord ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                                backgroundColor: isActiveWord
                                  ? captionBackgroundColor
                                  : "transparent",
                                padding: isActiveWord ? "4px 8px" : "4px 4px",
                                borderRadius: 6,
                                transition: "all 0.1s",
                                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                              }}
                            >
                              {word.text}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
