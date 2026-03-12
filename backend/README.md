# Backend Runbook

## Prerequisites

- Node.js 20+
- MongoDB instance

## Environment

1. Copy `.env.example` to `.env`.
2. Set:
   - `DB_URL`
   - `JWT_SECRET`
   - `CORS_ORIGINS` (comma-separated browser origins)
   - `BODY_LIMIT` (e.g. `100kb`)
   - `PORT`

## Commands

- Development: `npm run dev`
- Build: `npm run build`
- Start built app: `npm start`
- Run tests: `npm test`
- Run integration tests: `RUN_INTEGRATION_TESTS=true npm run test:integration`
- Seed initial level: `npx ts-node src/scripts/seedLevel.ts`

## Health Check

- `GET /health`
- `GET /health/readiness`
