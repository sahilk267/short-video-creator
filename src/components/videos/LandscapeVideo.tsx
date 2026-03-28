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

import {
  calculateVolume,
  createCaptionPages,
  shortVideoSchema,
} from "../utils";
import { NewsOverlay } from "./NewsOverlay";
import { TextModeEnum } from "../../types/shorts";
import { videoUiFontFamily } from "./fontStacks";

export const LandscapeVideo: React.FC<z.infer<typeof shortVideoSchema>> = ({
  scenes,
  music,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const subtitleLineCount = Math.max(1, Math.min(3, config.subtitleLineCount ?? 1));
  const subtitleFontScale = config.subtitleFontScale ?? 1;
  const textMode = config.textMode ?? TextModeEnum.hybrid;
  const showOverlay = textMode !== TextModeEnum.captions;
  const showCaptions = textMode !== TextModeEnum.overlay;

  const captionBackgroundColor = config.captionBackgroundColor ?? "blue";

  const activeStyle = {
    backgroundColor: captionBackgroundColor,
    padding: "10px 14px",
    marginLeft: "-10px",
    marginRight: "-10px",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.24)",
  };

  const captionPosition = config.captionPosition ?? "center";
  let captionStyle = {};
  if (captionPosition === "top") {
    captionStyle = { top: 180 };
  }
  if (captionPosition === "center") {
    captionStyle = { top: "54%", transform: "translateY(-50%)" };
  }
  if (captionPosition === "bottom") {
    captionStyle = { bottom: 110 };
  }

  const [musicVolume, musicMuted] = calculateVolume(config.musicVolume);

  return (
    <AbsoluteFill style={{ backgroundColor: "#071018" }}>
      <Audio
        loop
        src={music.url}
        startFrom={music.start * fps}
        endAt={music.end * fps}
        volume={() => musicVolume}
        muted={musicMuted}
      />

      {scenes.map((scene, i) => {
        const { captions, audio } = scene;
        const pages = createCaptionPages({
          captions,
          lineMaxLength: 30,
          lineCount: subtitleLineCount,
          maxDistanceMs: 1000,
        });

        const startFrame =
          scenes.slice(0, i).reduce((acc, curr) => acc + curr.audio.duration, 0) * fps;
        let durationInFrames = Math.max(1, Math.round(audio.duration * fps));
        if (config.paddingBack && i === scenes.length - 1) {
          durationInFrames += Math.round((config.paddingBack / 1000) * fps);
        }

        return (
          <Sequence
            from={startFrame}
            durationInFrames={durationInFrames}
            key={`scene-${i}`}
          >
            <SceneMedia scene={scene} durationInFrames={durationInFrames} />
            {showOverlay ? (
              <NewsOverlay
                headline={scene.headline}
                sceneIndex={i}
                totalScenes={scenes.length}
              />
            ) : null}
            <Audio src={audio.url} />
            {showCaptions ? pages.map((page, j) => (
              <Sequence
                key={`scene-${i}-page-${j}`}
                from={Math.round((page.startMs / 1000) * fps)}
                durationInFrames={Math.max(
                  1,
                  Math.round(((page.endMs - page.startMs) / 1000) * fps),
                )}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    ...captionStyle,
                  }}
                >
                  {page.lines.map((line, k) => (
                    <p
                      style={{
                        fontSize: `${7.2 * subtitleFontScale}em`,
                        fontFamily: videoUiFontFamily,
                        fontWeight: 800,
                        color: "white",
                        WebkitTextStroke: "2px rgba(5,8,14,0.9)",
                        WebkitTextFillColor: "white",
                        textShadow: "0px 10px 22px rgba(0,0,0,0.42)",
                        textAlign: "center",
                        width: "100%",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                      key={`scene-${i}-page-${j}-line-${k}`}
                    >
                      {line.texts.map((text, l) => {
                        const active =
                          frame >= startFrame + (text.startMs / 1000) * fps &&
                          frame <= startFrame + (text.endMs / 1000) * fps;
                        return (
                          <>
                            <span
                              style={{
                                fontWeight: 800,
                                ...(active ? activeStyle : {}),
                              }}
                              key={`scene-${i}-page-${j}-line-${k}-text-${l}`}
                            >
                              {text.text}
                            </span>
                            {l < line.texts.length - 1 ? " " : ""}
                          </>
                        );
                      })}
                    </p>
                  ))}
                </div>
              </Sequence>
            )) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneMedia: React.FC<{
  scene: z.infer<typeof shortVideoSchema>["scenes"][number];
  durationInFrames: number;
}> = ({ scene, durationInFrames }) => {
  const relativeFrame = useCurrentFrame();
  const driftX = interpolate(relativeFrame, [0, durationInFrames], [-22, 14], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(relativeFrame, [0, durationInFrames], [6, -8], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(relativeFrame, [0, durationInFrames], [1.01, 1.06], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(
    relativeFrame,
    [0, 8, Math.max(10, durationInFrames - 10), durationInFrames],
    [0.72, 1, 1, 0.88],
    { extrapolateRight: "clamp" },
  );

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `translate(${driftX}px, ${driftY}px) scale(${scale})`,
    opacity,
  };

  return (
    <>
      {scene.video ? (
        <OffthreadVideo src={scene.video} muted style={mediaStyle} />
      ) : (
        <Img src={scene.imageUrl as string} style={mediaStyle} />
      )}
    </>
  );
};
