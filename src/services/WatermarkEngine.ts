export interface WatermarkConfig {
  text?: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  opacity: number;
  fontSize?: number;
  color?: string;
  logoPath?: string;
}

export class WatermarkEngine {
  private defaultConfig: WatermarkConfig = {
    text: "@YourBrand",
    position: "bottom-right",
    opacity: 0.6,
    fontSize: 24,
    color: "white",
  };

  buildFfmpegFilter(config?: Partial<WatermarkConfig>): string {
    const cfg = { ...this.defaultConfig, ...config };

    const positionMap = {
      "top-left": "x=20:y=20",
      "top-right": "x=W-tw-20:y=20",
      "bottom-left": "x=20:y=H-th-20",
      "bottom-right": "x=W-tw-20:y=H-th-20",
      "center": "x=(W-tw)/2:y=(H-th)/2",
    };

    const pos = positionMap[cfg.position];
    const fontSize = cfg.fontSize || 24;
    const color = cfg.color || "white";
    const alpha = cfg.opacity;

    if (cfg.logoPath) {
      return `[1:v]scale=120:-1,format=rgba,colorchannelmixer=aa=${alpha}[logo];[0:v][logo]overlay=${pos}`;
    }

    return `drawtext=text='${cfg.text}':fontsize=${fontSize}:fontcolor=${color}@${alpha}:${pos}`;
  }

  getDefaultConfig(): WatermarkConfig { return { ...this.defaultConfig }; }

  updateDefault(config: Partial<WatermarkConfig>) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}
