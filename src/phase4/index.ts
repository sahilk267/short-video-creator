/**
 * Phase 4: Goal-Driven Intelligent Decision System
 * 
 * Exports all Phase 4 components for easy integration
 */

export { DecisionEngineService, type DecisionAction, type DecisionContext, type DecisionOutput } from "../decision/decision-engine.service";
export { GoalService, type GoalType, type Goal } from "../goal/goal.service";
export {
  initializePhase4Services,
  wireDecisionEngineToFeedback,
  applyGoalContext,
  getRetryDecision,
  logPhase4Status,
  type Phase4Services,
} from "./phase4-initializer";
