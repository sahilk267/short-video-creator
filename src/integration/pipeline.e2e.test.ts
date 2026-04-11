import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";

// Import services
import { OrchestratorService } from "../orchestrator/orchestrator.service";
import { DecisionEngineService } from "../decision/decision-engine.service";
import { GoalService } from "../goal/goal.service";
import { MemoryService } from "../memory/memory.service";
import { FeedbackService } from "../feedback/feedback.service";
import { PredictiveService } from "../predict/predict.service";
import { AssetService } from "../assets/asset.service";
import { MetadataService } from "../metadata/metadata.service";
import { StateTrackerService } from "../state/state-tracker.service";
import { Config } from "../config";

describe("Full E2E Intelligent Pipeline Verification", () => {
  let config: Config;
  let memory: MemoryService;
  let feedback: FeedbackService;
  let predictive: PredictiveService;
  let assets: AssetService;
  let metadata: MetadataService;
  let decisionEngine: DecisionEngineService;
  let goalService: GoalService;
  let stateTracker: StateTrackerService;
  let orchestrator: OrchestratorService;

  const tempDir = path.join(os.tmpdir(), "pipeline-e2e-test-" + Date.now());

  beforeEach(async () => {
    // Setup environment
    fs.ensureDirSync(tempDir);
    config = new Config();
    config.dataDirPath = tempDir;

    // Initialize services
    memory = new MemoryService(path.join(tempDir, "memory"));
    feedback = new FeedbackService();
    predictive = new PredictiveService(memory);
    assets = new AssetService(tempDir);
    metadata = new MetadataService();
    decisionEngine = new DecisionEngineService();
    goalService = new GoalService();
    stateTracker = new StateTrackerService(tempDir);

    orchestrator = new OrchestratorService(
      memory,
      feedback,
      predictive,
      assets,
      metadata,
      decisionEngine,
      goalService,
      {
        enableMemory: true,
        enablePrediction: true,
        enableFeedback: true,
        enableAssets: true,
        enableMetadata: true,
        enableDecisionEngine: true,
        enableGoalSystem: true,
        maxRetries: 2,
        scoreThreshold: 70,
      }
    );
  });

  it("should run the full pipeline and verify intelligent components", async () => {
    const videoId = "test_video_" + Date.now();
    const category = "News";
    
    // 1. Initialize State
    const state = await stateTracker.initialize(videoId, {
      topic: "Tech news today",
      category,
      goalType: "maximize_engagement"
    });
    expect(state).toBeDefined();

    // 2. Select Goal
    orchestrator.applyGoalToConfig("maximize_engagement");
    const threshold = orchestrator.getEffectiveScoreThreshold();
    expect(threshold).toBe(75); // maximize_engagement threshold is 75

    // 3. Trigger Memory Usage
    // Save a dummy pattern to memory first so we can see it being used
    await memory.savePattern(
        "Breaking news: huge tech reveal script content", 
        80, 
        category, 
        {
            topic: "Breaking news: huge tech reveal",
            style: "News",
            keywords: ["tech", "ai"],
            engagement: { views: 1000, likes: 100, shares: 10 }
        }
    );
    
    const patterns = await memory.getSimilarPatterns(["tech"], category, 1);
    expect(patterns.length).toBeGreaterThan(0);
    
    // 4. Feedback & Decision Engine Loop
    let retryCount = 0;
    const maxRetries = orchestrator.getEffectiveMaxRetries("generation");
    
    // Simulate script generation with a low score first
    let script = "A generic tech news script with a very weak opening.";
    let score = 55; // Well below 75
    let issues = [
        { type: "hook" as const, severity: "high" as const, message: "Opening is not engaging" }
    ];

    // Check if we should retry
    if (score < threshold && retryCount < maxRetries) {
        // Use Orchestrator to decide strategy (DecisionEngine)
        const decision = orchestrator.decideFeedbackStrategy(
            script,
            score,
            category,
            retryCount,
            issues
        );

        // Verify DecisionEngine logs/output through Orchestrator mapping
        expect(decision.strategy).toBe("retry_hook"); // Orchestrator maps fix_hook to retry_hook
        expect(decision.rationale).toContain("Hook");

        // Update state with decision
        await stateTracker.updateStep(videoId, "generation", {
            lastDecision: `${decision.strategy}: ${decision.rationale}`,
            retryIncrement: true
        });

        // Simulate a fix
        script = "STOP EVERYTHING! Major tech breakthough just happened.";
        score = 80; // Now passes threshold
        issues = [];
        retryCount++;
    }

    // Verify Memory update
    // We need to pass the ID of the stored pattern
    const patternId = patterns[0].id;
    const initialScore = patterns[0].score;
    await memory.penalizeFailedPattern(patternId, "weak hook");
    
    const updatedPattern = (await memory.getSimilarPatterns(["tech"], category, 1))[0];
    expect(updatedPattern.score).toBeLessThan(initialScore);
    console.log(`Memory verification: Score reduced from ${initialScore} to ${updatedPattern.score}`);

    // 5. Finalize
    await stateTracker.updateStep(videoId, "render", {
        status: "success",
        output: { outputPath: path.join(tempDir, "output.mp4") }
    });

    const finalState = await stateTracker.load(videoId);
    expect(finalState?.steps.render.status).toBe("success");
    expect(finalState?.steps.generation.lastDecision).toBeDefined();
    expect(finalState?.steps.generation.retryCount).toBe(1);
    
    console.log("E2E Test completed successfully with intelligent verification.");
  });

  it("should prevent infinite retries by respecting maxRetries", async () => {
    const videoId = "test_retry_limit_" + Date.now();
    const category = "Viral";
    orchestrator.applyGoalToConfig("fast_generation"); // maxRetries = 1
    
    let retryCount = 0;
    const maxRetries = orchestrator.getEffectiveMaxRetries("generation");
    expect(maxRetries).toBe(1);

    // Force a low score scenario that keeps failing
    let score = 30;
    const decision1 = orchestrator.decideFeedbackStrategy("bad", score, category, 0, []);
    expect(decision1.strategy).not.toBe("accept");
    retryCount++;
    
    // On second attempt (retryCount=1), it should reach limit
    const decision2 = orchestrator.decideFeedbackStrategy("bad", score, category, retryCount, []);
    expect(decision2.strategy).toBe("accept"); // Forced accept due to max retries
    expect(decision2.rationale).toContain("Max retries");
  });
});
