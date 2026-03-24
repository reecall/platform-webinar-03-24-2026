# API Collection

Collection of requests to create a complete Reecall Assistant step by step:

1. **Setup** — fetch available models
2. **Assistant & Channel** — create a minimal assistant and a WebRTC channel
3. **Knowledge Base** — attach a knowledge base with FAQ entries (hours, parking, accessibility, appointment reasons)
4. **Tools & MCP** — add a call transfer tool and connect an MCP server for appointment booking
5. **Post-conversation** — retrieve past exchanges
6. **Workflows & Hooks** — set up a post-conversation evaluation workflow (3 parallel LLM agents) triggered by a hook
7. **Blueprints** — provision all the above resources in a single request

Requests are meant to be run in order.

## Setup

### Variables to configure

| Variable | Description |
|---|---|
| `apiKey` | Reecall API bearer token (secret) |
| `mcpToken` | MCP server auth token (secret) |
| `mcpUrl` | HTTP URL of the MCP server used for appointment booking |
| `transferNumber` | Phone number for call transfers (secret) |

### Bruno

1. Open Bruno and import the `webinar-bruno-collection/` folder as a collection
2. Select the **Webinar** environment (under `environments/`)
3. Fill in the secret variables and update `mcpUrl` if needed

### Postman

1. Import `webinar-postman-collection/webinar-reecall.postman_collection.json`
2. Import `webinar-postman-collection/Webinar.postman_environment.json`
3. Select the **Webinar** environment and fill in the secret variables and update `mcpUrl` if needed
