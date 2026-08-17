# Fiscal Insights

AI-powered financial and business insights assistant.

## Requirements

- Node.js 24+
- pnpm 9+
- PostgreSQL (for `apps/api`)

## Setup

```bash
pnpm install
cp .env.example .env   # then fill in DATABASE_URL, etc.
```

## Project structure

```
apps/
  web/    React + Vite frontend
  api/    Express API server
packages/
  db/           Drizzle ORM schema and database client
  api-spec/     OpenAPI spec (source of truth for the API contract)
  api-client/   React Query client, generated from the OpenAPI spec
  api-schemas/  Zod request/response schemas, generated from the OpenAPI spec
```

## Common tasks

| Task                              | Command                                          |
| ---------------------------------- | ------------------------------------------------- |
| Run the API server (dev)           | `pnpm dev:api`                                     |
| Run the web app (dev)              | `pnpm dev:web`                                     |
| Typecheck everything                | `pnpm run typecheck`                               |
| Build everything                    | `pnpm run build`                                   |
| Regenerate API client/schemas       | `pnpm --filter @workspace/api-spec run codegen`    |
| Push DB schema changes (dev only)   | `pnpm --filter @workspace/db run push`             |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Database: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval, generated from `packages/api-spec/openapi.yaml`
- Build: esbuild (API), Vite (web)
