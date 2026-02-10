# WakeNet — Project Management Plan (PMP-Based)

**Project name:** WakeNet — Event-Driven Signal Infrastructure for AI Agents (Clawdbots)

---

## 1. Project Charter

**Purpose:** Build a scalable, low-cost, event-driven signal infrastructure that replaces polling for AI agents, reducing token spend, compute waste, and operational complexity.

**Business need:** AI agents rely on cron-based polling → excessive token usage, delayed reactions, duplicate logic, fragile integrations. WakeNet provides push-based, structured, deduplicated events that wake agents only when action is required.

**Objectives (SMART)**
- Deliver an MVP supporting 3 feed types within 30 days
- Enable webhook and pull-based delivery to Clawdbots
- Demonstrate >80% token reduction vs polling agents
- Maintain infra cost under $150/month at MVP scale

**Success criteria**
- Agents successfully triggered via WakeNet
- Duplicate events suppressed
- Delivery reliability >99% (non-SLA)
- At least 3 real Clawdbots using it end-to-end

---

## 2. Scope Management

**In-scope (MVP)**
- RSS/Atom ingestion
- GitHub Releases ingestion
- Generic HTTP JSON polling
- Event normalization (single schema)
- Deduplication + keyword filtering
- Webhook + pull delivery
- Clawdbot integration example
- Basic UI + API
- Cost and usage metrics

**Out of scope**
- X/Twitter ingestion
- ML ranking or embeddings
- Custom per-user schemas
- Enterprise SLAs
- Long-term archival (>30 days)

---

## 3. Deliverables (WBS)

### Level 1: Core System
1. Signal ingestion service  
2. Event processing pipeline  
3. Delivery mechanism  
4. Storage & persistence  
5. Clawdbot integration  
6. Admin UI  
7. Documentation  

### Level 2: Detailed

| # | Deliverable | Components |
|---|-------------|------------|
| 1 | **Ingestion** | RSS poller, GitHub releases poller, HTTP JSON poller, poll scheduling |
| 2 | **Event processing** | Normalization engine, deduplication (hash + TTL), keyword filters, rule-based priority scoring |
| 3 | **Delivery** | Webhook delivery + retries, pull-based queue endpoints, HMAC signing/verification, delivery logs |
| 4 | **Persistence** | Feeds table, Subscriptions table, Events table, Deliveries table |
| 5 | **Clawdbot** | Example skill `wakenet_listener`, webhook verification, event routing example, demo workflow |
| 6 | **UI** | Feed creation form, subscription management, event log viewer, enable/disable toggles |
| 7 | **Docs** | OpenAPI spec, integration guide, cost/token savings explanation |

---

## 4. Schedule (High-Level)

| Phase | Days | Focus |
|-------|------|--------|
| 1 Planning | 1–2 | Requirements, architecture, data model |
| 2 Core build | 3–12 | Ingestion, normalization, dedupe, DB |
| 3 Delivery | 13–18 | Webhooks, retries, pull, signing |
| 4 Integration | 19–22 | Clawdbot skill, E2E, examples |
| 5 UI & docs | 23–27 | Minimal UI, API docs, README |
| 6 Validation | 28–30 | Load test, token demo, cost check |

---

## 5. Cost Management

**MVP monthly:** Compute $20–60, DB $20–50, Redis $10–30, Network ~$0–10 → **$50–150 total**

**Controls:** No LLM, centralized polling, short retention.

---

## 6. Quality

- Deterministic schemas, idempotent delivery, retry-safe webhooks, bounded payloads  
- Metrics: duplicate suppression, event latency, delivery failure rate, token savings  

---

## 7. Resources

- **Stack:** Node.js or Python, Postgres, Redis, background job queue, Fly.io / Render / ECS  
- **Roles:** Backend, Frontend (minimal), Agent integrator, Product owner  

---

## 8. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Feed noise | Strong filtering + dedupe |
| Third-party rate limits | Conditional requests |
| Webhook failures | Retry + pull fallback |
| “Just feeds” perception | Emphasize token savings + agent-native |

---

## 9. Definition of Done

- Agent can subscribe to a feed  
- Event detected, normalized, duplicate suppressed  
- Event delivered to Clawdbot  
- Clawdbot executes workflow  
- Token savings demonstrated  
- Monthly cost validated < $150  

---

*One-line summary: WakeNet is a low-risk, high-leverage infrastructure project that converts polling-based agent systems into scalable, event-driven workflows with measurable cost and efficiency gains.*
