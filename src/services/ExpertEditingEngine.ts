export type EditingTechnique = "zoom_cut" | "speed_ramp" | "glitch" | "fade" | "text_animation";

export interface EditingEffect {
  technique: EditingTechnique;
  startTime: number;
  duration: number;
  intensity: number;
  easing: string;
}

export interface EditingDirectives {
  effects: EditingEffect[];
  transitionCount: number;
  averageEffectDuration: number;
  energyLevel: number;
}

export class ExpertEditingEngine {
  private techniques: Record<EditingTechnique, { minDuration: number; maxDuration: number; energyBoost: number }> = {
    zoom_cut: { minDuration: 100, maxDuration: 500, energyBoost: 1.3 },
    speed_ramp: { minDuration: 300, maxDuration: 1000, energyBoost: 1.2 },
    glitch: { minDuration: 50, maxDuration: 300, energyBoost: 1.5 },
    fade: { minDuration: 200, maxDuration: 800, energyBoost: 1.0 },
    text_animation: { minDuration: 400, maxDuration: 1200, energyBoost: 1.1 },
  };

  private deterministicRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  generateEditingPlan(videoDuration: number, emotionalIntensity: number): EditingDirectives {
    const effects: EditingEffect[] = [];
    let currentTime = 0;
    let totalEnergy = 0;
    const baseSeed = videoDuration + Math.round(emotionalIntensity * 100);

    const techniques: EditingTechnique[] = ["zoom_cut", "speed_ramp", "glitch", "fade", "text_animation"];
    const effectCount = Math.ceil((videoDuration / 1000) * (emotionalIntensity / 5));

    for (let i = 0; i < effectCount; i++) {
      const technique = techniques[i % techniques.length];
      const config = this.techniques[technique];
      const duration = this.deterministicRandom(baseSeed + i * 13) * (config.maxDuration - config.minDuration) + config.minDuration;
      const intensity = 0.5 + this.deterministicRandom(baseSeed + i * 37) * 0.5;

      effects.push({
        technique,
        startTime: currentTime,
        duration,
        intensity,
        easing: ["ease-in", "ease-out", "ease-in-out"][Math.floor(this.deterministicRandom(baseSeed + i * 53) * 3)],
      });

      totalEnergy += intensity * config.energyBoost;
      currentTime += duration + this.deterministicRandom(baseSeed + i * 73) * 500 + 200;
    }

    return {
      effects,
      transitionCount: effects.length,
      averageEffectDuration: effects.reduce((sum, e) => sum + e.duration, 0) / effects.length,
      energyLevel: Math.min(10, (totalEnergy / effectCount) * 2),
    };
  }

  zoomCutEffect(intensity: number): string {
    const scales = [1.0, 1.1 + intensity * 0.2, 1.2 + intensity * 0.3];
    return `scale(${scales[Math.floor(this.deterministicRandom(intensity * 100) * scales.length)]})`;
  }

  speedRampEffect(intensity: number): string {
    const speeds = [0.8, 1.0 + intensity * 0.3, 1.5 + intensity * 0.5];
    return `speed(${speeds[Math.floor(this.deterministicRandom(intensity * 101) * speeds.length)]})`;
  }

  glitchEffect(intensity: number): string {
    const offsets = [];
    for (let i = 0; i < 5; i++) {
      const xOffset = (this.deterministicRandom(i * 11 + intensity * 10) - 0.5) * 10 * intensity;
      const yOffset = (this.deterministicRandom(i * 17 + intensity * 13) - 0.5) * 10 * intensity;
      offsets.push(`${xOffset}px ${yOffset}px`);
    }
    return offsets.join(", ");
  }

  textAnimationEffect(text: string, intensity: number): Array<{ char: string; delay: number; duration: number }> {
    return text.split("").map((char, idx) => ({
      char,
      delay: idx * (50 + intensity * 20),
      duration: 300 + intensity * 100,
    }));
  }
}
