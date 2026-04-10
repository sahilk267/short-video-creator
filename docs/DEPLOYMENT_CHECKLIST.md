/**
 * QUICK START CHECKLIST
 * 
 * Use this to deploy new services safely in production
 */

# DEPLOYMENT CHECKLIST

## Pre-Deployment (Dev Environment)

- [ ] Review source files:
  - [ ] `src/config/featureFlags.ts`
  - [ ] `src/memory/memory.service.ts`
  - [ ] `src/feedback/feedback.service.ts`
  - [ ] `src/assets/asset.service.ts`
  - [ ] `src/metadata/metadata.service.ts`
  - [ ] `src/predict/predict.service.ts`
  - [ ] `src/video/beat-sync.service.ts`
  - [ ] `src/agents/agent-loop.service.ts`

- [ ] Run TypeScript compiler: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test`
  - [ ] All existing tests pass unchanged
  - [ ] No new test failures

- [ ] Build in Docker: `docker build -f main.Dockerfile .`
- [ ] Test Docker image locally

## Environment Setup

### Stage 1: All Features Disabled (SAFE DEFAULT)

Add to `.env`:
```
FEATURE_FEEDBACK_LOOP=false
FEATURE_MEMORY=false
FEATURE_PREDICTIVE_SCORING=false
FEATURE_ASSET_FALLBACK=false
FEATURE_METADATA_GENERATION=false
FEATURE_BEAT_SYNC=false
FEATURE_AGENT_LOOP=false
```

- [ ] No changes to existing `.env.example`
- [ ] System behaves exactly as before
- [ ] All legacy code paths active

### Stage 2: Enable Features One at a Time

```bash
# Day 1: Asset Fallback (safest)
FEATURE_ASSET_FALLBACK=true

# Day 3: Metadata Generation (no side effects)
FEATURE_METADATA_GENERATION=true

# Day 5: Memory System (verify storage)
FEATURE_MEMORY=true

# Day 7: Feedback Loop (aggressive monitoring)
FEATURE_FEEDBACK_LOOP=true

# (If all stable) Enable Agent Loop
FEATURE_AGENT_LOOP=true
```

## Deployment Steps (Production)

### Phase 1: Deploy Code (Day 1)

1. [ ] Code review completed
2. [ ] Merge to main branch
3. [ ] Tag version (e.g., v1.4.0)
4. [ ] Build Docker image: `docker build -t short-creator:v1.4.0 .`
5. [ ] Push to registry: `docker push short-creator:v1.4.0`

**Important**: All features DISABLED!

6. [ ] Deploy new image to production
7. [ ] Monitor logs: `docker logs -f short-creator`
   - Look for errors from new services
   - Verify system works exactly as before
8. [ ] Run smoke test: Create 1-2 videos
9. [ ] Verify identical output to previous version

**Status**: ✅ Code deployed, safe to enable features

### Phase 2: Enable Asset Fallback (Day 1-2)

1. [ ] Update `.env` in production: `FEATURE_ASSET_FALLBACK=true`
2. [ ] Restart service
3. [ ] Monitor logs:
   ```
   logger.debug({ source: "pexels" }, "Trying Pexels API")
   logger.debug({ source: "local" }, "Trying local assets")
   ```
4. [ ] Create 10-20 videos, monitor error rates
5. [ ] Verify no performance degradation
6. [ ] If stable for 8+ hours, advance to Phase 3

**Rollback if needed**: `FEATURE_ASSET_FALLBACK=false`

### Phase 3: Enable Metadata Generation (Day 2-3)

1. [ ] Test endpoint in staging:
   ```bash
   curl http://localhost:3000/api/video/test-id/metadata?platform=youtube
   ```
2. [ ] Update `.env`: `FEATURE_METADATA_GENERATION=true`
3. [ ] Restart service
4. [ ] Monitor logs for metadata generation
5. [ ] Create videos for multiple platforms
6. [ ] Verify metadata quality and character limits
7. [ ] If stable for 12+ hours, advance to Phase 4

### Phase 4: Enable Memory (Day 3-5)

1. [ ] Generate videos normally
2. [ ] Verify `data/script-patterns.json` is created
3. [ ] After 50+ videos, check file size:
   ```bash
   ls -lh data/script-patterns.json
   # Should be < 5MB
   ```
4. [ ] Monitor memory service logs:
   ```
   logger.info({ patternId, category, score }, "Stored high-performing pattern")
   ```
5. [ ] Verify patterns retrievable:
   ```bash
   # Check file content manually
   tail data/script-patterns.json
   ```
6. [ ] If stable for 24+ hours, continue to Phase 5

### Phase 5: Enable Feedback Loop (Day 5-7) [CAREFUL]

**Enable only after all previous phases stable!**

1. [ ] Set feature flag: `FEATURE_FEEDBACK_LOOP=true`
2. [ ] Restart service
3. [ ] Monitor retry metrics:
   ```
   logger.debug({ retryCount, maxRetries }, "Retry decision")
   logger.debug({ score }, "Score below threshold, will retry")
   ```
4. [ ] Track metrics over 24 hours:
   - Retry rate should be < 30%
   - Score improvement should be +10-15 on average
   - No infinite loops (max 2 retries)
5. [ ] Look for pathological cases (same topic retried forever)
6. [ ] If stable, advance to Phase 6

**Rollback if needed**: `FEATURE_FEEDBACK_LOOP=false`

### Phase 6: Enable Full Agent Loop (Day 7+)

1. [ ] All previous features stable for 24+ hours
2. [ ] Set: `FEATURE_AGENT_LOOP=true`
3. [ ] Restart service
4. [ ] Monitor orchestrated metrics:
   ```
   logger.debug({ config }, "Starting agent loop")
   logger.info({ assessment }, "Topic viability assessed")
   ```
5. [ ] Run intensive test: 50+ videos over 2 hours
6. [ ] Monitor CPU/memory: should not spike
7. [ ] If stable for 24+ hours, Phase complete

## Monitoring Checklist

### During Deployment

**Watch these logs**:
- [ ] No ERROR level logs (except expected failures)
- [ ] No WARN logs from new services starting
- [ ] New service initialization should show DEBUG logs

**Commands**:
```bash
# Watch for errors
docker logs short-creator 2>&1 | grep ERROR

# Watch for service init
docker logs short-creator 2>&1 | grep "initialized\|enabled\|started"

# Check specific service logs
docker logs short-creator 2>&1 | grep "AssetService\|MemoryService\|MetadataService"
```

### After Each Phase

**Metrics to track**:

| Metric | Target | Command |
|--------|--------|---------|
| Video render time | No change | Docker logs |
| API response time | < 100ms | Monitor endpoint |
| Error rate | Same as before | Error logs |
| CPU usage | ± 5% | Docker stats |
| Memory usage | ± 10% | Docker stats |

**Docker commands**:
```bash
# Check resource usage
docker stats short-creator

# View recent logs
docker logs --tail 100 short-creator

# Filter by service
docker logs short-creator 2>&1 | tail -50 | grep "memory\|feedback\|asset\|metadata"
```

## Rollback Plan

### If feature causes problems

1. [ ] Disable the feature flag:
   ```bash
   # Update .env
   FEATURE_[NAME]=false
   
   # Restart
   docker restart short-creator
   ```

2. [ ] Verify system recovers (takes ~2 min)

3. [ ] Document issue:
   - What feature was enabled
   - When did it fail
   - Error message
   - Action taken

4. [ ] Review code + logs to understand root cause

## Verification Checklist (After All Phases)

- [ ] System stable for 7+ days
- [ ] No anomalous error patterns
- [ ] Video quality maintained or improved
- [ ] No performance degradation
- [ ] Memory usage stable (no growth over time)
- [ ] Logs show healthy feature usage
- [ ] Metadata generated correctly for all platforms
- [ ] Asset fallback triggered (inspect logs)
- [ ] Pattern memory populated (check file size)
- [ ] Feedback loop improvements detected (score +10-15)
- [ ] Agent loop running without issues

## Success Criteria

✅ **Deployment successful if**:
- All new features can be enabled without breaking existing functionality
- Each feature works independently
- Features can be disabled without affecting others
- System behavior identical when all features disabled
- No regression in existing metrics
- New features measurably improve content quality

## Troubleshooting

### Issue: Service fails to initialize
**Solution**: Check error logs, disable feature flag, verify file permissions

### Issue: Metadata endpoint returns 500
**Solution**: Verify script data exists, check MetadataService logs

### Issue: Memory grows unbounded
**Solution**: Verify pruning logic in MemoryService, reduce sample limit

### Issue: Feedback loop retries forever
**Solution**: Check scoreThreshold, verify maxRetries configured, enable logs

### Issue: Asset fallback not used
**Solution**: Verify data/assets/ folder exists, check local file permissions, inspect logs

## Support

For issues:
1. [ ] Check logs: `docker logs --tail 200 short-creator`
2. [ ] Grep for service errors: `grep ERROR logs | grep -i "service_name"`
3. [ ] Review NEW_FEATURES.md for expected behavior
4. [ ] Check INTEGRATION_GUIDE.md for setup
5. [ ] Review IMPLEMENTATION_SUMMARY.md for architecture

## Sign-Off

- [ ] Pre-deployment QA passed
- [ ] Phase 1-2 deployed and stable
- [ ] Phase 3-4 deployed and stable
- [ ] Phase 5-6 deployed and stable (if enabled)
- [ ] All systems healthy
- [ ] Ready for production use

**Deployment Date**: ___________
**Deployed By**: ___________
**Approved By**: ___________
