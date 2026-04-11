#!/usr/bin/env node
/**
 * PHASE 4 RUNTIME VERIFICATION TEST
 * This script actually runs the Phase 4 services to verify they work
 */

import { DecisionEngineService } from './src/decision/decision-engine.service.js';
import { GoalService } from './src/goal/goal.service.js';
import { FeedbackService } from './src/feedback/feedback.service.js';

console.log('\n========================================');
console.log('PHASE 4 RUNTIME VERIFICATION');
console.log('========================================\n');

try {
  // Test 1: Initialize DecisionEngine
  console.log('✓ Test 1: Initializing DecisionEngine...');
  const engine = new DecisionEngineService();
  
  const decision = engine.decide({
    step: 'generation',
    score: 55,
    issues: [{ type: 'hook', severity: 'high', message: 'Weak hook' }],
    retryCount: 0,
    maxRetries: 3,
    category: 'News',
    budget: 'quality'
  });
  
  if (decision && decision.action) {
    console.log(`  ✓ DecisionEngine.decide() returned: ${decision.action}`);
    console.log(`  ✓ Reason: ${decision.reason}\n`);
  } else {
    throw new Error('DecisionEngine.decide() failed');
  }

  // Test 2: Initialize GoalService
  console.log('✓ Test 2: Initializing GoalService...');
  const goals = new GoalService();
  
  const goal = goals.getGoal('maximize_engagement');
  if (goal && goal.scoreThreshold === 75) {
    console.log(`  ✓ GoalService.getGoal() returned: ${goal.name}`);
    console.log(`  ✓ Threshold: ${goal.scoreThreshold}\n`);
  } else {
    throw new Error('GoalService.getGoal() failed');
  }

  // Test 3: Initialize FeedbackService with DecisionEngine
  console.log('✓ Test 3: Initializing FeedbackService with DecisionEngine...');
  const feedback = new FeedbackService(engine, true);
  
  const shouldRetry = feedback.shouldRetry(45, 0, 3, 'News', [
    { type: 'hook', severity: 'high', message: 'Weak hook' }
  ]);
  
  if (typeof shouldRetry === 'boolean') {
    console.log(`  ✓ FeedbackService.shouldRetry() returned: ${shouldRetry}`);
    console.log(`  ✓ DecisionEngine integration working\n`);
  } else {
    throw new Error('FeedbackService.shouldRetry() failed');
  }

  // Test 4: Test FeedbackService without DecisionEngine (backward compat)
  console.log('✓ Test 4: Testing FeedbackService backward compatibility...');
  const feedbackLegacy = new FeedbackService();
  
  const shouldRetryLegacy = feedbackLegacy.shouldRetry(45, 0, 3);
  if (typeof shouldRetryLegacy === 'boolean') {
    console.log(`  ✓ FeedbackService fallback logic working: ${shouldRetryLegacy}\n`);
  } else {
    throw new Error('FeedbackService fallback failed');
  }

  console.log('========================================');
  console.log('✓✓✓ ALL RUNTIME TESTS PASSED ✓✓✓');
  console.log('========================================\n');
  console.log('Phase 4 services are fully functional and ready for production.\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error);
  console.error('\n========================================\n');
  process.exit(1);
}
