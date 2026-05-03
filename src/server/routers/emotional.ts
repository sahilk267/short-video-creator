import { Router } from "express";
import { EmotionalResonanceEngine } from "../../services/EmotionalResonanceEngine.js";
import { logger } from "../../logger";

export class EmotionalRouter {
  readonly router: Router;
  private engine: EmotionalResonanceEngine;

  constructor() {
    this.router = Router();
    this.engine = new EmotionalResonanceEngine();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/score", (req, res) => {
      try {
        const { scriptText = "", audioLength = 30, visualElements = 5 } = req.body;
        const score = this.engine.scoreEmotionalContent(scriptText, audioLength, visualElements);
        res.json({ score });
      } catch (err) {
        logger.error({ err }, "POST /emotional/score failed");
        res.status(500).json({ error: "Failed to score emotional content" });
      }
    });

    this.router.get("/directives/:emotion", (req, res) => {
      try {
        const directives = this.engine.generateEmotionalDirectives(req.params.emotion as any);
        res.json({ directives });
      } catch (err) {
        res.status(500).json({ error: "Failed to generate directives" });
      }
    });

    this.router.post("/validate", (req, res) => {
      try {
        const { score } = req.body;
        if (!score) return res.status(400).json({ error: "score required" });
        const isValid = this.engine.validateEmotionalAlignment(score);
        res.json({ valid: isValid });
      } catch (err) {
        res.status(500).json({ error: "Validation failed" });
      }
    });
  }
}
