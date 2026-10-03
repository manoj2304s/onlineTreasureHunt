# Online Treasure Hunt

A real-time, location-based treasure hunt platform for campus and corporate events. Players move between physical checkpoints, scan a QR code to unlock each one, and answer a question to advance — while organisers watch progress, intervene, and control the game live from a web dashboard.

Built for the Science Association.

---

## Contents

- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Real-time events](#real-time-events)
- [Data model](#data-model)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)

---

## How it works

Each player progresses through a sequence of checkpoints:

1. **Navigate** — the app shows the live distance to the next checkpoint. The QR scanner unlocks within 30 metres.
2. **Scan** — scanning the checkpoint's QR code verifies arrival server-side and unlocks that level's question.
3. **Answer** — answers are compared against a bcrypt hash on the server; plaintext answers are never sent to the client.
4. **Advance** — a correct answer moves the player on, re-ranks the leaderboard, and pushes updates to every connected client.

Two mechanics keep the game fair:

- **Per-player checkpoint order.** On first interaction each player receives a Fisher–Yates shuffle of the checkpoint sequence, persisted to their profile. "Level 3" maps to a different physical location for different players, so sharing answers does not help.
- **Time penalties.** Three wrong answers add a 120-second penalty and a short lockout. Requesting a hint adds 300 seconds. Final ranking is by level reached, then by elapsed time plus accumulated penalties.

Organisers can start, end and reset the game, create and edit checkpoints, watch a live activity feed, and unlock, reset or advance individual players who get stuck.

---

## Repository layout

| Directory | What it is | Stack |
| --- | --- | --- |
| [`backend/`](backend/) | REST API, WebSocket server, game logic | Express 5 + TypeScript + MongoDB |
| [`frontend/`](frontend/) | Player mobile app | React Native (Expo) |
| [`treasure-hunt-admin/`](treasure-hunt-admin/) | Organiser dashboard | Next.js |

Each directory has its own README with service-specific commands.

---

## Architecture

```
┌──────────────────────┐          ┌──────────────────────┐
│   Player app         │          │   Admin dashboard    │
│   React Native/Expo  │          │   Next.js            │
└──────────┬───────────┘          └──────────┬───────────┘
           │  REST + WebSocket               │
           └────────────────┬────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Express 5 API           │
              │                           │
              │  routes → middleware →    │
              │  controllers → services   │
              │                           │
              │  Socket.IO (broadcast)    │
              └─────────────┬─────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  MongoDB          │
                  │  (replica set)    │
                  └───────────────────┘
```

The API is layered so that all game logic lives in the service layer, independent of Express. This keeps the rules unit-testable without a database or HTTP server.

Two patterns are worth knowing before changing gameplay code:

- **Optional transactions.** [`transaction.service.ts`](backend/src/services/transaction.service.ts) runs each gameplay mutation inside a MongoDB transaction and transparently falls back to a non-transactional path when the server is not a replica set. The same code runs against a local standalone MongoDB and against a managed replica set.
- **Post-commit side effects.** Gameplay services return a list of `postCommitActions` rather than emitting socket events inline. Events and activity records are flushed only after the transaction commits, so a rolled-back write can never broadcast progress that did not happen.

---

## Tech stack

**Backend** — Express 5, TypeScript, Mongoose, Socket.IO, Zod, JSON Web Tokens, bcrypt, Helmet, express-rate-limit

**Player app** — Expo SDK 54, React Native, Expo Router, NativeWind (Tailwind), expo-camera, expo-location, expo-secure-store, socket.io-client

**Admin dashboard** — Next.js, React, Tailwind CSS, axios, socket.io-client, react-hot-toast

---

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local or hosted)
- For the mobile app: the Expo Go app, or an Android/iOS build toolchain

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # then fill in the values
npm run dev              # starts on http://localhost:5000
```

Seed an initial checkpoint:

```bash
npx ts-node src/scripts/seedLevel.ts
```

### 2. Admin dashboard

```bash
cd treasure-hunt-admin
npm install
cp .env.example .env     # point NEXT_PUBLIC_API_URL at the backend
npm run dev              # starts on http://localhost:3000
```

To create the first admin account, register a normal account, then call `POST /auth/promote-admin` with that account's credentials and the `ADMIN_CODE` configured for the deployment.

### 3. Player app

```bash
cd frontend
npm install
cp .env.example .env     # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npm start
```

Use your machine's LAN address (for example `http://192.168.1.6:5000`) rather than `localhost`, so a physical device can reach the API.

To produce an installable build:

```bash
eas build --platform android --profile preview
```

> **Note:** the backend's `CORS_ORIGINS` must include the admin dashboard's origin, or browser requests will be rejected.

---

## Environment variables

### `backend/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DB_URL` | yes | — | MongoDB connection string |
| `JWT_SECRET` | yes | — | Signing secret for access tokens |
| `CORS_ORIGINS` | yes | — | Comma-separated list of allowed browser origins |
| `ADMIN_CODE` | yes | — | Six-digit code required to promote an account to admin |
| `PORT` | no | `5000` | HTTP port |
| `BODY_LIMIT` | no | `100kb` | Maximum JSON request body size |
| `NODE_ENV` | no | — | Standard environment name |

The backend validates its environment with Zod at startup and exits immediately with a descriptive error if anything is missing or malformed.

### `frontend/.env`

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL of the backend API |

### `treasure-hunt-admin/.env`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## API reference

All routes except `/health` and the auth entry points require an `Authorization: Bearer <token>` header. Admin routes additionally require the `admin` role.

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness probe |
| `GET` | `/health/readiness` | Readiness probe |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a player account |
| `POST` | `/auth/login` | Exchange credentials for a JWT |
| `POST` | `/auth/promote-admin` | Promote an existing account to admin |
| `GET` | `/auth/me` | Current authenticated user |

### Gameplay

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/gameplay/current-level` | Current question and target coordinates |
| `POST` | `/gameplay/unlock-location` | Verify a scanned QR code and unlock the question |
| `POST` | `/gameplay/submit-answer` | Submit an answer (rate limited) |
| `GET` | `/gameplay/hint` | Reveal the hint, applying a time penalty |
| `GET` | `/gameplay/leaderboard` | Current rankings |

### Admin — checkpoints and game control

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/admin/levels` | Create a checkpoint |
| `GET` | `/admin/levels` | List checkpoints |
| `PUT` | `/admin/levels/:id` | Update a checkpoint |
| `DELETE` | `/admin/levels/:id` | Delete a checkpoint |
| `POST` | `/admin/gameplay/start` | Start the game |
| `POST` | `/admin/gameplay/end` | End the game |
| `GET` | `/admin/gameplay/status` | Current game status |
| `POST` | `/admin/reset-game` | Reset all player progress |
| `GET` | `/admin/export-leaderboard` | Download results as CSV |

### Admin — monitoring

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/admin/stats` | Participation and completion totals |
| `GET` | `/admin/players` | All players with progress and timings |
| `GET` | `/admin/players/:playerId` | Detail for one player |
| `GET` | `/admin/levels/analytics` | Player distribution across checkpoints |
| `GET` | `/admin/activities` | Recent activity feed |

### Admin — player control

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/admin/player/unlock/:playerId` | Clear a player's lockout |
| `POST` | `/admin/player/reset/:playerId` | Reset a player to the first checkpoint |
| `POST` | `/admin/player/advance/:playerId` | Advance a player one checkpoint |

---

## Real-time events

Socket.IO runs alongside the HTTP server on the same port, restricted to the WebSocket transport and the same CORS allowlist. The server broadcasts; clients only listen.

| Event | Payload | Emitted when |
| --- | --- | --- |
| `leaderboard:update` | Ranked player array | A player advances or takes a penalty, and once on connect |
| `activity:update` | `{ message }` | Any gameplay action worth showing in the live feed |
| `game:status` | `"active"` / `"finished"` / `"inactive"` | An organiser starts, ends or resets the game |
| `player:update` | Player progress summary | A player completes a checkpoint |

---

## Data model

| Collection | Purpose | Notable fields |
| --- | --- | --- |
| `users` | Players and admins | `currentLevel`, `levelOrder[]`, `penaltyTime`, `wrongAttempts`, `lockedUntil`, `hintUsedLevels[]`, `role`, `locationUnlocked` |
| `levels` | Checkpoints | `levelNumber` (unique), `question`, `answerHash`, `hint`, `qrCode`, `location.latitude/longitude` |
| `activities` | Live event feed | `type`, `message`, `username`, `level` |
| `gameconfigs` | Singleton game state | `status`, `startedAt`, `endedAt` |

Passwords and checkpoint answers are both stored as bcrypt hashes.

> **Retention:** `activities` carries a TTL index that deletes records 24 hours after creation. Export any post-event analytics you need within that window.

---

## Testing

```bash
cd backend
npm test                                             # unit and middleware suites
RUN_INTEGRATION_TESTS=true npm run test:integration  # full API suite
```

Tests use Node's built-in `node:assert/strict` with a lightweight custom runner — no external test framework. Integration tests spin up an in-memory MongoDB and exercise the API through supertest.

The integration suite is opt-in because it downloads and boots a MongoDB binary on first run. It requires a populated `.env` (including `ADMIN_CODE`), since the server validates its environment at import time.

---

## Deployment

| Component | Platform | Notes |
| --- | --- | --- |
| Backend API | [Render](https://render.com) | Node web service running `npm run build && npm start`; serves both REST and the WebSocket connection on one port |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | Managed replica set, which is what enables the transactional write path |
| Admin dashboard | [Vercel](https://vercel.com) | Next.js deployment |
| Player app | [EAS Build](https://expo.dev/eas) | Android builds distributed as APK |

Set the backend's environment variables in the Render dashboard rather than committing them. `DB_URL`, `JWT_SECRET`, `CORS_ORIGINS` and `ADMIN_CODE` are all required — the service refuses to start without them.

`CORS_ORIGINS` must include the deployed dashboard's Vercel origin, and the dashboard's `NEXT_PUBLIC_API_URL` must point at the Render URL.

## Operational notes

- Every request is assigned a UUID, returned in the `x-request-id` response header and included in every structured JSON log line for that request.
- The server handles `SIGINT` and `SIGTERM` with a graceful shutdown that closes the HTTP server, the socket server and the database connection, with a 10-second forced-exit guard.
- Logs are emitted as single-line JSON for ingestion by a log aggregator.

---

## Roadmap

- Server-side proximity verification for checkpoint unlocking
- Continuous integration running the full test suite on every push
- Durable event analytics, retained beyond the activity TTL window
- Richer admin reporting: per-checkpoint timing and drop-off breakdowns

---

## License

Released under the [MIT License](LICENSE).

## Author

**Manoj**
[manojyadav23s04@gmail.com](mailto:manojyadav23s04@gmail.com) · [github.com/manoj2304s](https://github.com/manoj2304s)
