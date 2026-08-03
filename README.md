# Nest Payment Workflow Sample

A compact NestJS code sample designed for technical review. It demonstrates how I structure a reliability-sensitive transaction workflow without using proprietary employer code.

## What this sample demonstrates

- NestJS modules, controllers, services, dependency injection, and repository boundaries
- PostgreSQL persistence with TypeORM
- DTO validation with `class-validator`
- idempotent transaction initiation using an `Idempotency-Key`
- deterministic transaction state transitions
- replay-safe provider webhook handling
- HMAC signature verification abstraction
- structured API errors
- unit tests and one HTTP-level integration test
- Docker Compose for PostgreSQL
- GitHub Actions for lint, test, and build verification
- Swagger/OpenAPI documentation

## Workflow

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

Terminal states cannot be reversed. Repeated delivery of the same terminal result is treated idempotently.

## Architectural choices

### 1. Idempotency is persisted

The idempotency key has a database uniqueness constraint. The service first checks for an existing transaction and also handles a concurrent insert race by reading the winner after a PostgreSQL unique-constraint violation.

### 2. State transitions are explicit

A small domain state machine owns valid transitions. This prevents controllers, webhooks, or future workers from advancing state arbitrarily.

### 3. Provider results are replay-safe

A duplicate provider webhook that repeats the current terminal state returns the existing transaction. A conflicting terminal transition is rejected.

### 4. Signature verification is isolated

The controller delegates HMAC verification to a dedicated service. A real integration could replace this implementation with a provider-specific canonical payload and signature scheme without coupling cryptographic rules to transaction logic.

### 5. Persistence does not leak into controllers

Controllers validate transport concerns. The service coordinates domain behavior. The repository wraps TypeORM access so persistence can be changed or tested independently.

## Run locally

Requirements:

- Node.js 22+
- Docker

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run start:dev
```

API documentation:

```text
http://localhost:3000/docs
```

## Example requests

Create a transaction:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: order-123' \
  -d '{"amountMinor":250000,"currency":"USD"}'
```

Attach a provider reference and start processing:

```bash
curl -X POST http://localhost:3000/api/transactions/<TRANSACTION_ID>/process \
  -H 'Content-Type: application/json' \
  -d '{"providerReference":"provider-tx-123"}'
```

Generate a local webhook signature:

```bash
node -e "const c=require('crypto'); const p={providerReference:'provider-tx-123',status:'SUCCEEDED'}; console.log(c.createHmac('sha256','local-webhook-secret').update(JSON.stringify(p)).digest('hex'))"
```

Apply the provider result:

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

## Deliberate scope limits

This is a review-sized sample, not a full payment platform. Production extensions would include:

- database migrations instead of development-time `synchronize`
- transactional outbox for downstream event publication
- provider request idempotency and timeout recovery
- distributed tracing and structured request correlation
- authentication and authorization
- rate limiting
- immutable webhook receipt storage
- secrets management through a cloud provider
- deployment manifests and environment-specific configuration

## Suggested review path

1. `transactions.service.ts`
2. `transaction-state-machine.ts`
3. `transactions.repository.ts`
4. `webhooks.controller.ts` and `webhook-signature.service.ts`
5. unit and integration tests
