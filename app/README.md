# Reecall WebRTC Demo

A full-stack application for interacting with Reecall AI voice assistants through WebRTC. Browse assistants, make real-time voice calls, transfer calls to human agents via Twilio, and view AI-generated post-call evaluations.

## Architecture

```
Browser (React) ──► Fastify Backend ──► Reecall API
                         │
                         ├── Keeps API key server-side
                         ├── Twilio (SIP transfer + audio bridge)
                         └── SSE (evaluation streaming)

Browser ◄──────── LiveKit (WebRTC audio) ──────► Reecall Agent
```

### Frontend

**Features:**

- **Assistant browsing** — List and inspect assistants with their voice config, models, tools, MCP servers, and knowledge bases.
- **WebRTC calling** — Real-time voice calls via LiveKit with audio visualization, mute/hangup controls, and mic level indicators.
- **Call transfers** — RPC-based transfer handshake with the agent, with a mulaw audio bridge fallback for Twilio interop.
- **Post-call evaluation** — Streams AI-generated call analysis (tone, clarity, fluidity, resolution) via SSE.

**Structure:**

```
frontend/src/
├── api/reecall.ts           # API client (health, assistants, channels, calls, transfers)
├── components/
│   ├── ui/                  # Radix/shadcn primitives (button, card, dialog, etc.)
│   ├── AssistantList.tsx     # Sidebar with assistant cards
│   ├── AssistantDetail.tsx   # Selected assistant details
│   ├── CallView.tsx          # Active call UI with LiveKit
│   ├── AgentStatus.tsx       # Agent state badge + audio visualizer
│   ├── CallControls.tsx      # Mute / hangup buttons
│   ├── EvaluationView.tsx    # Post-call evaluation display
│   └── ...
├── hooks/
│   ├── useConfig.ts          # Backend health check on init
│   ├── useAudioBridge.ts     # WebSocket + Web Audio API (mulaw codec)
│   └── useEvaluation.ts      # SSE listener for evaluation streaming
├── types/reecall.ts          # TypeScript interfaces
└── App.tsx                   # State machine: connecting → browsing → in_call → post_call
```

### Backend

**Features:**

- **Reecall API proxy** — Transparently forwards requests to the Reecall API with automatic Bearer token injection.
- **Call initiation** — Proxies WebRTC channel calls, returns LiveKit token + WebSocket URL.
- **SIP transfer** — Initiates outbound Twilio calls to human agents, long-polls for result (60s timeout).
- **Audio bridge** — Bidirectional WebSocket relay between Twilio media streams and the browser (mulaw 8kHz base64).
- **Evaluation webhook + SSE** — Receives evaluation results from Reecall and pushes them to connected frontends via Server-Sent Events.

**Structure:**

```
backend/src/
├── index.ts                  # Fastify setup, middleware, route registration
├── config.ts                 # Environment variable validation
├── routes/
│   ├── reecall-proxy.ts      # GET/POST/PUT/DELETE → Reecall API
│   ├── calls-proxy.ts        # POST /api/calls/:channelId
│   ├── transfers.ts          # POST /api/transfers
│   ├── twilio-webhooks.ts    # TwiML, media stream WS, status callbacks
│   └── evaluation.ts         # POST webhook + GET SSE stream
└── services/
    ├── twilio.ts             # Twilio outbound call initiation
    ├── audio-bridge.ts       # WebSocket audio relay (Twilio ↔ browser)
    └── transfer-store.ts     # In-memory pending transfer state
```

## Setup

### Prerequisites

- Node.js 24+ (or Docker)
- pnpm (via corepack: `corepack enable pnpm`)
- A **project-scoped** Reecall API key (not organization-level)

### Environment variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `REECALL_API_KEY` | Yes | Project-scoped API key (must start with `sk_`) |
| `REECALL_BASE_URL` | Yes | Reecall data API URL (e.g. `https://newprd.reecall.io/data_next`) |
| `REECALL_CALLS_URL` | Yes | Reecall calls URL (e.g. `https://newprd.reecall.io/calls`) |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID (required for call transfers) |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token (required for call transfers) |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number for outbound calls (required for call transfers) |
| `PUBLIC_BASE_URL` | No | Public URL for Twilio webhooks — use ngrok for local dev (required for call transfers) |

### Install & run

```bash
docker compose up --build
```

Frontend runs on `http://localhost:8080`, backend runs on `http://localhost:3000`.

## Links

- [Reecall Documentation](https://docs.reecall.io)
