import type { AiLearningStore } from "../db/AiLearningStore";
import { AiPredictionService } from "./AiPredictionService";

interface JobHandle {
  stop?: () => void;
}

export class AiTrainingService {
  private job: JobHandle | null = null;

  constructor(
    private readonly store: AiLearningStore,
    private readonly predictor: AiPredictionService = new AiPredictionService(),
  ) {}

  public async runTrainingNow(): Promise<void> {
    const events = await this.store.listEvents(1000);
    const current = await this.store.getModelState();
    const next = this.predictor.retrain(events, current);
    await this.store.saveModelState(next);
  }

  public start(jobFactory: (fn: () => Promise<void>) => JobHandle): void {
    if (this.job) return;
    this.job = jobFactory(async () => {
      await this.runTrainingNow();
    });
  }
}
