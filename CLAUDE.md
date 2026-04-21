# CLAUDE.md

## About This Template

**Formesean Stack** is a production-ready Turborepo starter template featuring a NestJS backend, Next.js frontend, and enterprise-grade Firebase authentication with multi-tenant RBAC. It provides a robust foundation for SaaS applications, ensuring end-to-end type safety and professional project organization.

**What's included:**
- **NestJS 11** backend with TypeORM and PostgreSQL
- **Next.js 16** (App Router) frontend with Turbopack and React 19
- **Firebase Authentication** identity layer with server-side validation
- **Role-Based Access Control (RBAC)** via NestJS Guards and custom decorators
- **End-to-end Type Safety** via OpenAPI/Swagger generated TypeScript clients
- **Shared UI Library** using shadcn/ui and Tailwind CSS
- **TanStack Query v5** for robust frontend data fetching and caching
- **Pre-configured CI/CD** via GitHub Actions and Vercel

**Perfect for:** Scalable SaaS applications, complex internal tools, and multi-tenant platforms requiring strong type safety and security.

## Development Commands

```bash
# Serve Applications
npm run dev:all          # Start all apps (API + Web) with TUI
npm run dev:api          # NestJS backend only
npm run dev:web          # Next.js frontend only

# Code Quality
npm run lint:all         # Run ESLint across workspace
npm run typecheck:all    # Run TypeScript compiler checks
npm run format:all       # Format all files with Prettier

# Database (TypeORM)
npm run migration:generate <Name>  # Generate a new migration
npm run migration:run              # Execute pending migrations
npm run migration:revert           # Roll back last migration

# Workspaces & UI
npm run generate:api     # Regenerate @repo/api types from NestJS spec
npm run ui:add           # Add shadcn/ui components to packages/ui
```

## Architecture

### API Documentation (NestJS + Swagger)

Interactive API documentation is automatically generated from NestJS decorators (dev only):
- **Scalar UI**: `/docs` - Modern interactive API explorer
- **Swagger UI**: `/openapi` - Standard Swagger documentation
- **OpenAPI Spec**: `/openapi.json` - JSON specification file

### API → Web Type Safety Flow

The project uses `@repo/api` to bridge the backend and frontend with zero manual type maintenance:

1. **API Source**: NestJS decorators (`@ApiProperty`, `@ApiResponse`) define the schema in Controllers/DTOs.
2. **Spec Generation**: `npm run generate:api` bootstraps `GenerateAppModule` (a stub module with no DB/Firebase dependencies) to export `packages/api/openapi.json`.
3. **Type Generation**: `openapi-typescript` converts the JSON spec to `packages/api/src/schema.d.ts`.
4. **Consumption**: The `web` app imports types from the `@repo/api` package for full E2E type safety.

> **IMPORTANT:** Never manually edit `packages/api/openapi.json` or `packages/api/src/schema.d.ts`. These are auto-generated files — all changes must originate from NestJS decorators in `apps/api`. Run `npm run generate:api` manually after changing controllers or DTOs, and commit the updated files. CI enforces this on every PR.

### NestJS Module Pattern

Each domain follows a strict modular structure in `apps/api/src/app/`:
- **Module**: `[feature].module.ts` - Orchestrates providers and controllers.
- **Controller**: `[feature].controller.ts` - Handles HTTP requests and Swagger docs.
- **Service**: `[feature].service.ts` - Contains business logic.
- **Entity**: `entities/[feature].entity.ts` - TypeORM database model.
- **DTO**: `dto/*.dto.ts` - Data transfer objects for request validation.

### Web Data Fetching Pattern

Frontend data fetching is centralized in `apps/web/src/hooks/queries` and `hooks/mutations`:
- **Services** (`src/services/`): Thin wrappers over an `axios` instance for raw API calls.
- **Queries**: `useQuery` hooks with stable query keys for fetching.
- **Mutations**: `useMutation` hooks for state-changing operations (POST/PATCH/DELETE) with automatic cache invalidation.

## Authentication & RBAC

### Firebase Integration

Firebase handles the identity layer for the entire stack:
- **Frontend**: `AuthProvider` listens to `onAuthStateChanged`, retrieves ID tokens, syncs users via `POST /users/sync`, then force-refreshes the token to pull in the custom role claim.
- **Backend**: `FirebaseAuthGuard` verifies the Bearer token using `firebase-admin`. The decoded token (including custom claims) is attached to `request.user`.

### Role-Based Access Control (RBAC)

**System Overview:**
- **Roles**: Defined in `UserRole` enum (`admin`, `photographer`, `participant`, etc.).
- **Enforcement**: Managed via `RolesGuard` and the `@Roles()` decorator on the backend, and `CanAccess` + middleware on the frontend.

**Backend Route Protection:**
```typescript
@Get()
@Roles(UserRole.ADMIN)
@UseGuards(FirebaseAuthGuard, RolesGuard)
async findAll() { ... }
```

**How roles reach the token:**
On every `POST /users/sync`, the backend calls `admin.auth().setCustomUserClaims(uid, { role })`. The frontend immediately force-refreshes the token (`getIdToken(true)`) so the new claim is available for subsequent requests. `RolesGuard` reads `request.user.role` from the decoded custom claim.

**Context Access**:
Use the `@AuthUser()` decorator to extract the authenticated user's Firebase data directly in handlers.

### Frontend RBAC

**How it works:**
After login, `AuthProvider` writes a `session_role` cookie with the user's role. The Next.js middleware (`src/proxy.ts`) reads this cookie on every request — before the page loads — and redirects if the user is unauthenticated or lacks the required role.

**Two layers of enforcement:**
1. **Middleware** (`src/proxy.ts`) — redirects at the network level using `session_role` cookie
2. **`CanAccess` component** (`src/components/can-access.tsx`) — hides UI elements per role inside pages

**Protecting a page by role:**

Add the route to `src/lib/auth/route-permissions.ts`:
```typescript
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/dashboard': ['admin', 'photographer'],
};
```

Any authenticated user can access routes not listed here. Unauthenticated users are always redirected to `/login`.

**Hiding UI elements by role:**
```tsx
import { CanAccess } from '@/components/can-access';

<CanAccess role="admin">
  <DeleteButton />
</CanAccess>

<CanAccess role={['admin', 'photographer']} fallback={<p>No access</p>}>
  <UploadButton />
</CanAccess>
```

**Public routes** are defined in `src/lib/constants/routes.ts`. Add any route that should be accessible without authentication to the `PUBLIC_ROUTES` array.

## Database (TypeORM)

### Schema & Entities
- Tables are defined as TypeORM entities in `src/app/[feature]/entities/`.
- Every entity should extend a base class or implement standard columns (`id` as UUID, `createdAt`, `updatedAt`).

### Validations
- Use `class-validator` decorators (`@IsString`, `@IsEmail`) in DTOs for automatic request validation.
- Every property in a DTO MUST have corresponding `@ApiProperty()` decorators for Swagger documentation.

## Code Style

### Comments
- Explain the **why**, not the **what**.
- Avoid restating logic; use comments for complex business rules or non-obvious branching.

### Icons
- **ALWAYS use Lucide Icons** (`lucide-react`).
- Pattern: `import { User as IconUser } from 'lucide-react'` (renaming `User` to `IconUser` for clarity).

### Forms
- ALWAYS use **React Hook Form** with the **Controller** pattern for complex inputs.
- Use `zod` for frontend schema validation to match backend DTO constraints.
- Utilize custom field wrappers from `@/components/ui` for consistent error handling and labels.

## Key Patterns

### Adding a New Entity (Backend)

1. Create `entities/[name].entity.ts` and define the TypeORM model.
2. Register the entity in `src/db/data-source.ts`.
3. Create DTOs (`create-[name].dto.ts`, `update-[name].dto.ts`).
4. Generate a migration: `npm run migration:generate Add[Name]Table`.
5. Register the controller and its stub provider in `apps/api/src/generate-app.module.ts` so spec generation stays in sync.

### Adding a New API Endpoint

1. **Controller**: Define the endpoint with `@Get/Post/etc.`, add `@ApiOperation`, and specify `@ApiResponse({ type: DTO })`.
2. **Service**: Implement the business logic and database interaction.
3. **Client Generation**: Run `npm run generate:api` to propagate types to the `@repo/api` package.

### Adding a New Feature (Frontend)

1. **Service**: Add the API call in `src/services/[name].service.ts`.
2. **Hook**: Create a `useQuery` or `useMutation` hook in `src/hooks/`.
3. **Component**: Consume the hook in your UI, utilizing `shadcn/ui` components for styling.

### RBAC Implementation

1. **Add Role**: Update `UserRole` enum in `apps/api/src/common/enums/user-role.enum.ts` and the `UserRole` type in `apps/web/src/components/providers/auth-provider.tsx`.
2. **Apply Backend Guard**: Add `@Roles(UserRole.NEW_ROLE)` to the relevant controller or method.
3. **Protect a Page Route**: Add the route to `PAGE_PERMISSIONS` in `apps/web/src/lib/auth/route-permissions.ts`.
4. **Hide UI Elements**: Wrap components in `<CanAccess role="new_role">` for component-level gating.
