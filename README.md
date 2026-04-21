# Formesean Stack Template

Formesean Stack is a production-ready Turborepo starter template featuring a NestJS backend, Next.js frontend, and enterprise-grade Firebase authentication with multi-tenant RBAC. Start building your SaaS application with a professional foundation instead of wiring up auth, permissions, and type-safe APIs from scratch.

## Using This Template

### 1. Create your repository

Click **Use this template** on GitHub to create a new repo from this template.

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** and your desired sign-in providers.
3. Go to **Project Settings → Service Accounts → Generate new private key** to download your service account JSON.

### 3. Set up your database

Create a PostgreSQL database (recommended: [Supabase](https://supabase.com) or [Neon](https://neon.tech)).

> **Vercel deployments require the transaction pooler connection** (port `6543` on Supabase). Use the direct connection (port `5432`) for local development.

### 4. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in both files with your Firebase and database credentials.

### 5. Set up Vercel

1. Create two Vercel projects — one for `apps/api`, one for `apps/web`.
   - Set the **Root Directory** to `apps/api` or `apps/web` respectively.
   - Set **Framework** to `Other` for the API and `Next.js` for the web.
2. In each Vercel project, go to **Settings → Environment Variables** and add all variables from the corresponding `.env.example`.
3. For the API project, set `NODE_ENV=production` and use the **transaction pooler** DB credentials.
4. Disable Vercel's automatic GitHub deployments — the CD workflow handles this.
   - Both `vercel.json` files already have `"github": { "enabled": false }`.

### 6. Configure GitHub

**Secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID_API` | Vercel API project → Settings → General → Project ID |
| `VERCEL_PROJECT_ID_WEB` | Vercel Web project → Settings → General → Project ID |

**Variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Value |
|---|---|
| `VERCEL_PROJECT_NAME_API` | Your Vercel API project name |
| `VERCEL_PROJECT_NAME_WEB` | Your Vercel Web project name |

**Environments** (Settings → Environments) — create four environments:
- `Production – <api-project-name>`
- `Preview – <api-project-name>`
- `Production – <web-project-name>`
- `Preview – <web-project-name>`

### 7. Run locally

```bash
npm install
npm run dev:all
```

### 8. Deploy

Push to `main` — the CD pipeline will run migrations, deploy the API, then deploy the web.

---

## Technology Stack

- **Monorepo**: Turborepo (v2.9.6)
- **Node Version**: v22.22.1 (specified in `.nvmrc`)
- **Frontend**: Next.js 16.2.0 + React 19.1.0 + Tailwind CSS v3.4.17
- **Backend**: NestJS 11.1.11 + TypeORM 0.3.28
- **Database**: PostgreSQL
- **Authentication**: Firebase Authentication
- **API Documentation**: OpenAPI 3.1 (Scalar)
- **State Management**: TanStack Query v5
- **Runtime**: TypeScript 5.8.2
- **Package Manager**: npm (workspaces enabled)
- **Deployment**: Vercel

---

## Monorepo Structure

```
formesean-stack/
├── apps/
│   ├── web/                   # Next.js 16 + React 19 (port 4200)
│   └── api/                   # NestJS backend (port 3000)
│       └── src/
│           ├── app/[module]/
│           │   ├── entities/
│           │   ├── dto/
│           │   ├── [module].controller.ts
│           │   ├── [module].service.ts
│           │   └── [module].module.ts
│           └── db/
│               ├── data-source.ts    # Entity registrations
│               └── migrations/
└── packages/
    ├── @repo/api/                # Generated API client (openapi-typescript)
    ├── @repo/ui/                 # Shared React component library (shadcn/ui)
    ├── @repo/eslint-config/      # Shared ESLint configs
    └── @repo/typescript-config/  # Shared tsconfig bases
```

---

## File Organization

### Backend (NestJS)
```
src/app/<module>/
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.module.ts
├── dto/
└── entities/
```

### Frontend (Next.js)
```
src/
├── components/
├── hooks/
│   ├── queries/
│   └── mutations/
├── utils/
├── types/
├── constants/
└── services/
```

---

## Key Files & Locations

### Backend
- **Entities Registration**: `apps/api/src/db/data-source.ts`
- **Migrations**: `apps/api/src/db/migrations/`
- **Common (Enums/Guards)**: `apps/api/src/common/`
- **Spec Generation Module**: `apps/api/src/generate-app.module.ts`
- **Node version**: `.nvmrc` (v22.22.1)

### Frontend
- **Components**: `apps/web/src/components/`
- **Hooks**: `apps/web/src/hooks/`
- **Services**: `apps/web/src/services/`
- **Middleware**: `apps/web/src/proxy.ts` (Next.js 16 middleware convention)
- **Generated API client**: `@repo/api` (located in `packages/api/`)

## Development Commands

### Serve Applications
```bash
npm run dev:all          # Start all apps
npm run dev:api          # NestJS backend only
npm run dev:web          # Next.js frontend only
```

### Type Checking & Linting
```bash
npm run typecheck:all    # Type check all projects
npm run typecheck:api    # API only
npm run typecheck:web    # Web only
npm run lint:all         # Lint all projects
npm run format:all       # Format with Prettier
```

### Database Migrations (TypeORM)
```bash
npm run migration:generate <FileName>
npm run migration:run
npm run migration:revert
```

### Build & Deploy
```bash
npm run build:all        # Build everything
npm run build:api        # Build API only
npm run build:web        # Build Web only
```

> Build `@repo/api` before `apps/api` or `apps/web` — the apps depend on it.

### API Client Generation
```bash
npm run generate:api     # Generate TypeScript client from OpenAPI spec
```

> Run this manually after changing controllers or DTOs, then commit the updated files. CI enforces freshness on every PR.

### UI Components
```bash
npm run ui:add           # Add shadcn/ui components to packages/ui
```

### Turborepo Commands
```bash
npx turbo run <task>                 # Run task across workspace
npx turbo run <task> --filter=<pkg> # Run task for specific package
npx turbo run build --graph         # View project dependency graph
```

---

## Environment Setup

Copy the example files and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

See `apps/api/.env.example` and `apps/web/.env.example` for the complete list of required variables.

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): runs on PRs to `main`/`staging` — generates API types, lint, typecheck.
- **CD** (`.github/workflows/cd.yml`): on push to `main` (production) or `staging` (preview):
  1. `generate-types` — regenerates `openapi.json` and `schema.d.ts`
  2. `deploy-api` — runs DB migrations, then deploys API to Vercel
  3. `deploy-web` — downloads fresh types, then deploys web to Vercel

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID_API` | Vercel project ID for the API app |
| `VERCEL_PROJECT_ID_WEB` | Vercel project ID for the Web app |

### Required GitHub Variables

Environment names in the CD workflow are driven by repository variables so the workflow stays project-agnostic. Set these under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Example value |
|---|---|
| `VERCEL_PROJECT_NAME_API` | `my-app-api` |
| `VERCEL_PROJECT_NAME_WEB` | `my-app-web` |

These values must match the GitHub Environment names you create (e.g. `Production – my-app-api`, `Preview – my-app-api`).
