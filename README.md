# NestJS Transaction Workflow

A compact NestJS implementation of a reliability-sensitive transaction workflow, focused on persisted idempotency, explicit state transitions, replay-safe webhook handling, PostgreSQL persistence, and automated verification.

Built independently and contains no proprietary employer code.

## What it demonstrates

- Modular NestJS architecture with controllers, services, dependency injection, and repository boundaries
- PostgreSQL persistence with TypeORM
- DTO validation using `class-validator`
- Idempotent transaction initiation with a persisted `Idempotency-Key`
- Explicit, deterministic transaction state transitions
- Replay-safe provider webhook processing
- Isolated HMAC signature verification
- Structured API error handling
- Unit and HTTP-level integration tests
- Docker Compose for local PostgreSQL
- GitHub Actions for lint, test, and build verification
- Swagger/OpenAPI documentation

## Transaction workflow

```text
POST /transactions
        |
        | Idempotency-Key
        v
     PENDING
        |
POST /transactions/:id/process
        |
        | providerReference
        v
    PROCESSING
       / \
      /   \
 signed   signed
 webhook  webhook
    /       \
SUCCEEDED  FAILED
```

Terminal states cannot be reversed. Repeated delivery of the same terminal result is handled idempotently.

## Engineering decisions

### Persist idempotency at the database boundary

The idempotency key is protected by a database uniqueness constraint.

The service first checks for an existing transaction and also handles concurrent insert races by reading the winning record after a PostgreSQL unique-constraint violation.

This keeps idempotency from depending on process memory or request timing.

### Keep state transitions explicit

A small domain state machine owns valid transitions.

Controllers, webhooks, and future background workers cannot advance transaction state arbitrarily. Invalid or conflicting terminal transitions are rejected.

### Treat provider delivery as replayable

Provider webhooks may be delivered more than once.

Repeated delivery of the same terminal result returns the existing transaction, while a conflicting terminal result is rejected. This keeps retries safe without allowing terminal state to drift.

### Isolate provider verification

Webhook signature verification lives behind a dedicated service rather than inside transaction logic.

A production integration can replace the local HMAC implementation with a provider-specific canonical payload and signature scheme without coupling cryptographic rules to the transaction domain.

### Keep persistence behind a repository boundary

Controllers own transport concerns. The service coordinates domain behavior. The repository wraps TypeORM access.

This keeps HTTP, domain, and persistence responsibilities separate and makes the workflow easier to test and evolve.

## Run locally

### Requirements

- Node.js 22+
- Docker

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run start:dev
```

Swagger/OpenAPI documentation:

```text
http://localhost:3000/docs
```

## Example flow

### 1. Create a transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: order-123' \
  -d '{"amountMinor":250000,"currency":"USD"}'
```

### 2. Attach a provider reference and begin processing

```bash
curl -X POST http://localhost:3000/api/transactions/<TRANSACTION_ID>/process \
  -H 'Content-Type: application/json' \
  -d '{"providerReference":"provider-tx-123"}'
```

### 3. Generate a local webhook signature

```bash
node -e "const c=require('crypto'); const p={providerReference:'provider-tx-123',status:'SUCCEEDED'}; console.log(c.createHmac('sha256','local-webhook-secret').update(JSON.stringify(p)).digest('hex'))"
```

### 4. Apply the provider result

```bash
curl -X POST http://localhost:3000/api/webhooks/provider \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: <SIGNATURE>' \
  -d '{"providerReference":"provider-tx-123","status":"SUCCEEDED"}'
```

## Verification

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

The repository is configured so the same verification path can run in GitHub Actions.

## Deliberate scope

This repository is intentionally review-sized. It demonstrates the transaction boundary and reliability decisions without pretending to be a complete payment platform.

A production extension would likely add:

- database migrations instead of development-time `synchronize`
- transactional outbox for downstream event publication
- provider request idempotency and timeout recovery
- immutable webhook receipt storage
- distributed tracing and structured request correlation
- authentication and authorization
- rate limiting
- cloud-managed secrets
- deployment manifests and environment-specific configuration

## Suggested review path

For a quick technical review:

1. `src/transactions/transactions.service.ts`
2. `src/transactions/domain/transaction-state-machine.ts`
3. `src/transactions/infrastructure/transactions.repository.ts`
4. `src/webhooks/webhooks.controller.ts`
5. `src/webhooks/webhook-signature.service.ts`
6. unit and integration tests
