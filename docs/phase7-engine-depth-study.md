# Phase 7 Engine Depth Study (OSS-first)

## Objective
Evaluate per-platform transformation and tuning strategy while staying open-source/free friendly.

## Recommended OSS Stack
- Queue/Orchestration: BullMQ + Redis
- Transform: FFmpeg + Remotion
- Speech/Subtitle: Kokoro + Whisper
- Storage: JSON now, migrate to Postgres OSS when scaling
- Monitoring: Prometheus + Grafana (future phase)

## Per-platform Transformation
- YouTube: long+short, full metadata, chapter markers
- Telegram: short-form fast publish, caption truncation strategy
- Instagram/Facebook: keep stub pipelines now, isolate transform presets for reels

## Tuner Strategy
- Tier-based quotas
- Per-engine orientation presets
- Language-profile matrix (audio/subtitle)
- Retry and deadletter policy by platform

## Cost Controls
- Track render/publish/storage usage monthly per tenant
- Guard quotas before queueing expensive operations

## Compliance
- Keep credentials encrypted at rest
- Isolated per-tenant/engine logs
- No proprietary paid-only dependency required for baseline
