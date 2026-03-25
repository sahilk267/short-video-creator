# Phase 11 Operations Runbook

## Scope
- CI hardening
- Security automation
- API rate limiting
- Backup automation
- Observability checks

## CI Gates
- Lint: `pnpm exec eslint src --ext .ts,.tsx`
- Typecheck: `npx tsc -p tsconfig.build.json --noEmit`
- Tests: `pnpm vitest run`
- Build: `pnpm build`

## Security Scans
- `pnpm audit --prod`
- Optional container scan in CI via Trivy action.

## Backup Procedure
- Run `pnpm backup:data` before major deploys.
- Artifacts are written under `${DATA_DIR_PATH}/backups/backup-<timestamp>`.

## Observability
- Health endpoint: `/api/health`
- Queue states: `/api/health/queue/states`
- Metrics endpoint: `/api/health/metrics`

## Rate Limiting
- Applied globally on `/api` routes.
- Default: 120 req/min per IP.
