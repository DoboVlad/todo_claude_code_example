# PROJECT_PLAN.md

> **Single source of truth** for the Personal TODO application.
> This document is a roadmap and architecture specification — **no application code is written here.**
> Future prompts will implement the project step-by-step against this plan.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Technology Choices](#3-technology-choices)
4. [Folder Structures](#4-folder-structures)
5. [Security Strategy](#5-security-strategy)
6. [Deployment Strategy](#6-deployment-strategy)
7. [Development Roadmap](#7-development-roadmap)
8. [Step-by-Step Implementation Plan](#8-step-by-step-implementation-plan)

---

## 1. Executive Summary

We are building a **modern, production-ready personal TODO application** consisting of:

- An **Angular 21** single-page frontend using Angular Material, standalone components, and Signals.
- A **NestJS** REST backend with a deliberately simple module structure.
- A **SQLite** database accessed through **Prisma**.
- **Google OAuth 2.0** login with **JWT access tokens** and a **refresh-token rotation** strategy.

### Goals

| Goal | How we achieve it |
|------|-------------------|
| Production-ready | Strong typing end-to-end, validation, guards, CI on every push |
| Easy to maintain | Clear feature-based folder structure, opinionated stack, no over-engineering |
| Easy to deploy | Single-platform deployment (Render) with a persistent disk for SQLite |
| Modern best practices | Signals, OnPush, lazy loading, deferrable views, standalone APIs |
| Secure | HTTP-only refresh cookie, short-lived access token, server-side guards |

### Non-Goals (intentional scope limits)

- No multi-tenant team features, sharing, or collaboration.
- No microservices — a single monolithic NestJS app is correct for personal scale.
- No heavy state-management library (NgRx is overkill here — Signals + services suffice).
- No server-side rendering (SSR) — a SPA is appropriate for an authenticated app shell.

### High-Level Architecture

```
┌──────────────────────────┐         HTTPS / JSON          ┌──────────────────────────┐
│   Angular 21 SPA          │  ───────────────────────────▶ │   NestJS REST API         │
│   - Material UI           │   Bearer access token (JWT)   │   - Auth module           │
│   - Signals store         │ ◀───────────────────────────  │   - Users module          │
│   - Route guards          │   HTTP-only refresh cookie    │   - Todos module          │
└──────────────────────────┘                                │   - Prisma service        │
            │                                                └────────────┬─────────────┘
            │  Google OAuth redirect                                      │ Prisma
            ▼                                                             ▼
   ┌──────────────────┐                                         ┌──────────────────┐
   │  Google Identity │                                         │  SQLite (file)   │
   └──────────────────┘                                         │  on persistent   │
                                                                │  disk            │
                                                                └──────────────────┘
```

---

## 2. Architecture Decisions

These are **Architecture Decision Records (ADRs)** in condensed form. Each states the decision and the reasoning.

### ADR-1: Monorepo with two apps (`frontend/`, `backend/`)

**Decision:** A single Git repository containing `frontend/` and `backend/` directories, each with its own `package.json`.

**Why:** A personal project benefits from atomic commits across both halves and one issue tracker. We avoid the tooling overhead of Nx/Turborepo because two independent npm projects are simpler to reason about and deploy. We can adopt a workspace tool later if needed.

### ADR-2: REST over GraphQL

**Decision:** Plain REST API with predictable resource routes.

**Why:** The domain is tiny (auth + todos). REST with NestJS controllers is less ceremony, easier to cache, and trivially testable with `curl`. GraphQL's flexibility solves problems we don't have.

### ADR-3: Prisma over TypeORM

**Decision:** Use **Prisma** as the ORM/data layer.

**Why:**
- **Type safety:** Prisma generates a fully typed client from the schema; queries are checked at compile time. TypeORM's decorator entities drift from the DB more easily.
- **Migrations:** `prisma migrate dev` produces deterministic, reviewable SQL migrations with almost no configuration — ideal for SQLite.
- **DX:** A single `schema.prisma` file is the readable source of truth for the data model. Prisma Studio gives a free GUI for inspecting the SQLite file.
- **SQLite support:** First-class and effectively zero-config (just a file path in `DATABASE_URL`).

**Tradeoff:** Prisma's client is a separate generated package and runs its own query engine. For our scale this is irrelevant. TypeORM would couple us to repository/decorator patterns that are heavier than needed.

### ADR-4: Signals-first state, RxJS only at boundaries

**Decision:** Use Angular **Signals** for component and feature state. Use **RxJS** only where it is the right tool: `HttpClient` calls and a few event streams.

**Why:** Signals give fine-grained reactivity, work naturally with OnPush, and remove most `async` pipe and subscription-management boilerplate. RxJS remains valuable for async HTTP and debounced inputs, so we keep it — but we don't build the app's state graph out of Subjects.

### ADR-5: Service-based Signal Store (no NgRx)

**Decision:** State lives in injectable services exposing `signal()`/`computed()` values, with methods that mutate via the HTTP layer.

**Why:** NgRx (or NGXS) adds actions, reducers, effects, and selectors — valuable for large teams and complex flows, but pure overhead for a single-user CRUD app. A `TodosStore` service with signals is testable, debuggable, and ~100 lines.

### ADR-6: Access token in memory, refresh token in HTTP-only cookie

**Decision:** The short-lived JWT **access token is held in memory** (a signal) in the SPA. The long-lived **refresh token is an HTTP-only, Secure, SameSite cookie** set by the backend.

**Why:** This is the strongest practical balance against XSS and CSRF for a SPA:
- Access token in memory → not readable by injected scripts via `localStorage`, and it's short-lived (15 min) so theft has limited value.
- Refresh token in HTTP-only cookie → JavaScript cannot read it (XSS-resistant); SameSite + a CSRF strategy mitigates CSRF.
- On app load / token expiry, the SPA silently calls `/auth/refresh`, which reads the cookie and issues a new access token.

(See [Security Strategy](#5-security-strategy) for full detail and the refresh-rotation flow.)

### ADR-7: Standalone components, no NgModules

**Decision:** Every component, directive, and pipe is **standalone**. Routing uses `provideRouter`; the app bootstraps with `bootstrapApplication`.

**Why:** This is the Angular 21 default and best practice. It removes NgModule boilerplate, makes lazy loading per-route trivial, and improves tree-shaking.

### ADR-8: SPA served as static files; API separate

**Decision:** Build the Angular app to static assets. Serve it either as a static site or from the NestJS app; the API is a separate service.

**Why:** Clean separation of concerns and independent scaling/caching. The frontend is a CDN-friendly static bundle; the backend is a stateful service bound to the SQLite disk.

---

## 3. Technology Choices

### Frontend

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Angular 21 | Required; latest standalone + signals APIs |
| UI kit | Angular Material + CDK | Required; accessible, themeable, comprehensive |
| Language | TypeScript (strict) | Type safety end-to-end |
| Components | Standalone | Modern default, better tree-shaking |
| Reactivity | Signals | Fine-grained, OnPush-friendly |
| Async | RxJS (boundaries only) | HTTP + debounce; not for app state |
| Routing | Angular Router + lazy routes | Route-level code splitting |
| Styling | SCSS + Material theming (tokens) | Theme system, light/dark |
| HTTP | `HttpClient` + functional interceptors | Auth header + refresh handling |
| Forms | Reactive Forms | Validation, typed forms |
| Build | Angular CLI (esbuild/Vite dev server) | Fast builds, default toolchain |

### Backend

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | NestJS | Structured, DI, guards/pipes/interceptors built in |
| Language | TypeScript (strict) | Shared discipline with frontend |
| API style | REST | Simple domain |
| ORM | Prisma | See ADR-3 |
| Validation | `class-validator` + `class-transformer` via global `ValidationPipe` | Declarative DTO validation |
| Config | `@nestjs/config` (env-based) | Typed, validated env vars |
| Auth | Passport (`passport-google-oauth20`, `passport-jwt`) + `@nestjs/jwt` | Battle-tested OAuth + JWT |
| Docs (optional) | `@nestjs/swagger` | Auto API docs in dev |

### Database

| Concern | Choice | Why |
|---------|--------|-----|
| Engine | SQLite | Zero-config, single file, perfect for personal scale |
| Access | Prisma client | Typed queries + migrations |
| Migrations | `prisma migrate` | Deterministic, reviewable |

> **Why SQLite is the right call here:** A personal TODO app has one user and low write volume. SQLite removes an entire class of operational complexity (no DB server, no connection pools, no separate hosting). The only constraint is that the host must provide a **persistent disk** — which drives the deployment recommendation.

### Tooling

| Concern | Choice |
|---------|--------|
| Linting | ESLint (Angular ESLint + `@typescript-eslint`) |
| Formatting | Prettier |
| Git hooks | Husky + lint-staged (lint/format on commit) |
| Testing (FE) | Jest or Karma/Jasmine (CLI default) + Angular Testing Library optional |
| Testing (BE) | Jest (Nest default) + Supertest for e2e |
| CI | GitHub Actions |

---

## 4. Folder Structures

### Repository Root

```
todo-app/
├── frontend/                # Angular 21 SPA
├── backend/                 # NestJS API
├── .github/
│   └── workflows/
│       ├── ci.yml           # lint + test + build on PR/push
│       └── deploy.yml       # deploy on main
├── .gitignore
├── README.md
└── PROJECT_PLAN.md          # this file
```

### Angular (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                     # singletons: app-wide services, guards, interceptors
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts        # signals: user, accessToken, isAuthenticated
│   │   │   │   ├── auth.guard.ts          # functional CanActivate
│   │   │   │   ├── auth.interceptor.ts    # attaches Bearer token, triggers refresh
│   │   │   │   └── auth.models.ts
│   │   │   ├── http/
│   │   │   │   └── api.config.ts          # base URL token
│   │   │   └── core.providers.ts          # provideHttpClient, interceptors, etc.
│   │   │
│   │   ├── shared/                   # reusable, presentational, no business logic
│   │   │   ├── ui/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   ├── empty-state/
│   │   │   │   ├── loading-spinner/
│   │   │   │   └── page-header/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   │
│   │   ├── layouts/                  # app shell
│   │   │   └── main-layout/
│   │   │       ├── main-layout.component.ts   # Material toolbar + sidenav + <router-outlet>
│   │   │       ├── header/
│   │   │       └── sidenav/                    # collapsible nav
│   │   │
│   │   ├── features/                 # lazy-loaded feature areas
│   │   │   ├── auth/
│   │   │   │   ├── login/                      # Login page + Google button
│   │   │   │   └── auth.routes.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   └── todos/
│   │   │       ├── data/
│   │   │       │   ├── todos.service.ts        # HTTP calls
│   │   │       │   ├── todos.store.ts          # signal store
│   │   │       │   └── todo.model.ts
│   │   │       ├── pages/
│   │   │       │   ├── all-tasks/
│   │   │       │   ├── active-tasks/
│   │   │       │   └── completed-tasks/
│   │   │       ├── components/
│   │   │       │   ├── todo-list/
│   │   │       │   ├── todo-item/
│   │   │       │   └── todo-form-dialog/       # create/edit dialog
│   │   │       └── todos.routes.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts             # application providers
│   │   └── app.routes.ts             # top-level routes (lazy loadChildren)
│   │
│   ├── styles/
│   │   ├── _theme.scss               # Material theme (light/dark) via tokens
│   │   ├── _variables.scss
│   │   └── styles.scss
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   └── main.ts                       # bootstrapApplication(AppComponent, appConfig)
├── angular.json
├── package.json
└── tsconfig.json
```

**Folder rules:**
- `core/` = app-wide singletons, imported once.
- `shared/` = dumb, reusable UI; no feature knowledge.
- `features/` = self-contained, lazily loaded; each owns its data/store/components.
- `layouts/` = the authenticated shell (toolbar + sidenav).

### NestJS (`backend/`)

```
backend/
├── prisma/
│   ├── schema.prisma             # data model (User, Todo, RefreshToken)
│   ├── migrations/               # generated SQL migrations
│   └── seed.ts                   # optional dev seed
├── src/
│   ├── main.ts                   # bootstrap, global pipes, CORS, cookie-parser
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── configuration.ts      # typed config factory
│   │   └── env.validation.ts     # validate env on boot
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts      # global
│   │   └── prisma.service.ts     # extends PrismaClient, onModuleInit connect
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # /auth/google, /auth/google/callback, /auth/refresh, /auth/logout, /auth/me
│   │   ├── auth.service.ts       # token issuing, refresh rotation
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── google-auth.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts      # find/create from Google profile
│   │   └── dto/
│   │
│   ├── todos/
│   │   ├── todos.module.ts
│   │   ├── todos.controller.ts   # REST CRUD, scoped to current user
│   │   ├── todos.service.ts
│   │   └── dto/
│   │       ├── create-todo.dto.ts
│   │       └── update-todo.dto.ts
│   │
│   └── common/
│       ├── filters/
│       │   └── http-exception.filter.ts   # uniform error shape
│       ├── interceptors/
│       │   └── logging.interceptor.ts
│       └── dto/
│           └── pagination.dto.ts           # if needed later
├── test/                         # e2e (Supertest)
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 5. Security Strategy

### Token model

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access (JWT) | ~15 min | **In-memory signal** in SPA | Authorize API calls via `Authorization: Bearer` |
| Refresh | ~7 days | **HTTP-only, Secure, SameSite cookie** | Obtain new access tokens silently |

### Authentication flow (Google OAuth + JWT)

```
1. User clicks "Login with Google" → SPA redirects to  GET /auth/google
2. NestJS (GoogleStrategy) redirects to Google consent screen
3. Google redirects back to  GET /auth/google/callback?code=...
4. Backend validates profile, upserts User, then:
     - issues access JWT  (returned to SPA)
     - issues refresh JWT (stored hashed in DB; set as HTTP-only cookie)
     - redirects SPA to a callback route carrying the access token
5. SPA stores access token in memory; user is authenticated
6. On 401 / near-expiry → SPA calls  POST /auth/refresh  (cookie sent automatically)
     - backend verifies refresh token against DB hash, ROTATES it (new refresh + revoke old)
     - returns new access token
7. Logout → POST /auth/logout  → backend revokes refresh token + clears cookie
```

### Refresh-token rotation

- Refresh tokens are **hashed (argon2/bcrypt) before storage** in a `RefreshToken` table — never stored in plaintext.
- Each refresh **rotates**: the old token is revoked and a new one issued. Reuse of a revoked token → treat as compromise, revoke the whole session family.
- Tokens carry an expiry; expired/revoked tokens are rejected.

### JWT storage rationale (why not localStorage)

- `localStorage` is readable by any injected script → XSS can exfiltrate a long-lived token.
- In-memory access token + HTTP-only refresh cookie limits XSS blast radius (short-lived, non-persistent access token) **and** CSRF exposure (cookie is HTTP-only and SameSite).

### CORS configuration

- Backend allows **only the known frontend origin(s)** (dev: `http://localhost:4200`; prod: the deployed domain) from config.
- `credentials: true` so the refresh cookie is sent/received.
- Restrict methods to those used (`GET, POST, PATCH, DELETE`).

### CSRF

- Because the refresh cookie is `SameSite=Strict` (or `Lax`) and the API requires a Bearer access token for state-changing requests, CSRF risk is low. The `/auth/refresh` endpoint is the sensitive cookie consumer; protect it with `SameSite` + origin checks. Add a CSRF token (double-submit) if we ever relax SameSite.

### Input validation & authorization

- **Global `ValidationPipe`** with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` → strips unknown fields, enforces DTO types.
- DTOs use `class-validator` decorators (`@IsString`, `@MaxLength`, `@IsBoolean`, `@IsOptional`).
- **`JwtAuthGuard`** protects all `/todos` and `/auth/me` routes.
- **Ownership enforcement:** every Todos query is scoped by `userId` from the JWT — a user can never read or mutate another user's todo (defense at the service layer, not just the route).

### Environment variables & secrets

`backend/.env` (never committed; `.env.example` is committed):

```
DATABASE_URL="file:./dev.db"
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_ACCESS_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_TTL=7d
FRONTEND_URL=http://localhost:4200
COOKIE_DOMAIN=localhost
NODE_ENV=development
```

- Env is **validated on boot** (`env.validation.ts`); the app refuses to start with missing/invalid secrets.
- In production, secrets are injected via the host's secret manager (Render environment variables), **not** files.
- Separate Google OAuth credentials and callback URLs per environment.

### Transport & headers

- HTTPS everywhere in production (host-provided TLS).
- Add `helmet` for sensible default security headers on the API.
- Rate-limit auth endpoints (`@nestjs/throttler`) to slow brute-force/abuse.

---

## 6. Deployment Strategy

### Development setup (local)

```
backend/   → npm run start:dev      (NestJS watch mode, http://localhost:3000)
             prisma migrate dev      (creates/updates ./dev.db)
frontend/  → npm start              (Angular dev server, http://localhost:4200, proxy to :3000)
```

- A `proxy.conf.json` in Angular forwards `/api` to `http://localhost:3000` so cookies and CORS behave like production.
- Use `.env` locally; Google OAuth configured with a `localhost` callback.

### CI/CD with GitHub Actions

**`ci.yml`** (runs on every PR and push):

1. **Build pipeline** — install deps (cached), `prisma generate`, build both `frontend` and `backend`. Fails the PR if either build breaks.
2. **Testing pipeline** — run ESLint, frontend unit tests, backend unit tests, and backend e2e (Supertest against a throwaway SQLite file). Type-check with `tsc --noEmit`.
3. Matrix is unnecessary; a single Node LTS version is fine.

**`deploy.yml`** (runs on push to `main`, after CI passes):

- **Deployment pipeline** — trigger the host's deploy. With Render, a Git-connected service auto-deploys on `main`; alternatively call Render's deploy hook. Run `prisma migrate deploy` as part of the backend release command so the schema is applied before the new version serves traffic.

Pipeline summary:

```
PR opened ──▶ ci.yml: lint → test → build  (must pass to merge)
merge to main ──▶ ci.yml (again) ──▶ deploy.yml: migrate + release
```

### Deployment platform comparison

| Platform | Angular static | NestJS service | **Persistent SQLite disk** | Free/cheap tier | Verdict |
|----------|----------------|----------------|----------------------------|-----------------|---------|
| **Vercel** | Excellent | Serverless functions only | ❌ No persistent FS (ephemeral) | Generous FE free tier | Great for FE, **cannot host SQLite** |
| **Netlify** | Excellent | Functions only | ❌ No persistent FS | Generous FE free tier | Same limitation as Vercel |
| **Railway** | OK | Good (long-running) | ✅ Volumes supported | Usage-based, small free credit | Viable; pricing is usage-metered |
| **Render** | ✅ Static Sites (free) | ✅ Web Service | ✅ Persistent Disk add-on | Free static + low-cost service | **Best all-in-one fit** |
| **Fly.io** | OK (via static) | ✅ Good (VMs) | ✅ Volumes | Small free allowance | Cheapest at scale, more ops knowledge needed |

**Why SQLite drives this:** Vercel and Netlify run the backend as **serverless functions with an ephemeral filesystem** — the SQLite file would be wiped on every cold start. They are excellent for the static frontend but disqualified for our database. We need a host that offers a **long-running process + a persistent disk**.

### Recommendation

> **Use Render.**
>
> - **Frontend:** Render **Static Site** (free) — builds the Angular app, serves from CDN, auto-deploys from `main`.
> - **Backend:** Render **Web Service** (Node) running NestJS, with a **Persistent Disk** mounted where `dev.db`/`prod.db` lives. `DATABASE_URL="file:/var/data/prod.db"`.
> - **Database:** SQLite file on that persistent disk. Zero extra hosting.
>
> **Why Render over the others:** It hosts the static frontend, the long-running backend, **and** the persistent disk for SQLite on one platform with the simplest configuration and a usable free/low tier. One dashboard, Git-connected auto-deploy, built-in TLS.
>
> **Tradeoffs:** A single persistent disk means the backend is a single instance (no horizontal scaling) — perfectly fine for a personal app, and a reason SQLite is appropriate. If we ever needed multi-instance scaling, we would migrate to Postgres (Render offers managed Postgres) — Prisma makes that change a one-line datasource swap plus a migration. **Fly.io** is the cheapest alternative and a good fallback if Render's free tier limits become a problem, at the cost of more manual VM/volume configuration.

**Backups:** schedule a periodic copy of the SQLite file off the disk (e.g., a cron job uploading to object storage), since a single file on a single disk is the only copy.

---

## 7. Development Roadmap

Complexity scale: **S** (small) · **M** (medium) · **L** (large).

### Phase 1 — Project Setup

- **Goals:** Establish the monorepo, tooling, and conventions before any feature work.
- **Tasks:**
  - Initialize Git repo + GitHub remote, add `.gitignore`, `README`.
  - Scaffold `frontend/` (Angular 21, standalone, SCSS, routing) and `backend/` (NestJS).
  - Configure ESLint + Prettier in both; add Husky + lint-staged.
  - Add base GitHub Actions CI (install + build + lint).
- **Deliverables:** Repo with two buildable apps, green CI, shared lint/format config.
- **Complexity:** S–M
- **Dependencies:** None.

### Phase 2 — Backend Foundation

- **Goals:** A running NestJS app with config, validation, and error handling baseline.
- **Tasks:**
  - `@nestjs/config` with env validation.
  - Global `ValidationPipe`, global exception filter (uniform error shape), logging interceptor.
  - CORS + cookie-parser + helmet + throttler wired in `main.ts`.
  - Health-check route.
- **Deliverables:** NestJS boots, validates env, returns consistent errors, health endpoint responds.
- **Complexity:** M
- **Dependencies:** Phase 1.

### Phase 3 — Authentication

- **Goals:** Working Google OAuth login issuing access + refresh tokens.
- **Tasks:**
  - Google + JWT Passport strategies; guards; `@CurrentUser` decorator.
  - `/auth/google`, `/auth/google/callback`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
  - Refresh-token rotation with hashed storage; HTTP-only cookie handling.
- **Deliverables:** End-to-end login from a test client; refresh and logout work; protected route returns user.
- **Complexity:** L
- **Dependencies:** Phase 2, Phase 4 (User + RefreshToken tables).

### Phase 4 — Database

- **Goals:** Data model and migrations via Prisma + SQLite.
- **Tasks:**
  - `schema.prisma` with `User`, `Todo`, `RefreshToken` models and relations.
  - `PrismaService` (global), connect on init.
  - First migration; optional seed.
- **Deliverables:** SQLite file created via migration; typed Prisma client generated; Prisma Studio inspectable.
- **Complexity:** S–M
- **Dependencies:** Phase 2. (Run before/with Phase 3 since auth needs User/RefreshToken.)

### Phase 5 — TODO CRUD

- **Goals:** Full REST CRUD for todos, scoped to the authenticated user.
- **Tasks:**
  - Create/Update DTOs with validation.
  - `TodosController` (`GET /todos`, `GET /todos/:id`, `POST`, `PATCH /:id`, `DELETE /:id`) under `JwtAuthGuard`.
  - `TodosService` enforcing `userId` ownership on every query.
  - Filtering for active/completed.
- **Deliverables:** Authenticated CRUD with ownership enforcement; e2e tests pass.
- **Complexity:** M
- **Dependencies:** Phases 3 & 4.

### Phase 6 — Angular UI

- **Goals:** The app shell and all screens with Material, responsive across breakpoints.
- **Tasks:**
  - Material theme system (light/dark via tokens), global styles.
  - `MainLayout` with Material toolbar (title, profile, logout) + collapsible sidenav (Dashboard, All/Active/Completed).
  - Login page with Google button.
  - Todo list/item components, create/edit dialog, confirm-delete dialog, snackbars, empty/loading states.
  - Responsive behavior (CDK `BreakpointObserver`); sidenav over/side mode per viewport.
- **Deliverables:** Navigable, responsive UI wired to mock or real data; light/dark toggle.
- **Complexity:** L
- **Dependencies:** Phase 1 (and benefits from Phase 5 for live data).

### Phase 7 — State Management

- **Goals:** Signal-based stores and HTTP integration; auth state in the SPA.
- **Tasks:**
  - `AuthService` signals (`user`, `accessToken`, `isAuthenticated`); functional auth interceptor attaching Bearer and handling 401→refresh.
  - `TodosStore` (signals + computed for filtered views) backed by `TodosService` HTTP.
  - Route guards (`authGuard`) and lazy routes wired to stores.
- **Deliverables:** UI fully driven by signals from the real API; optimistic or pending UI states.
- **Complexity:** M
- **Dependencies:** Phases 5 & 6.

### Phase 8 — Security

- **Goals:** Harden both ends and verify the threat model.
- **Tasks:**
  - Confirm cookie flags (HttpOnly/Secure/SameSite), CORS credentials, helmet, throttler.
  - Verify ownership scoping and validation whitelisting.
  - Secrets via env only; rotate dev secrets out of history if leaked.
  - Optional: CSRF double-submit if SameSite relaxed.
- **Deliverables:** Security checklist passed; auth endpoints rate-limited; no secrets in repo.
- **Complexity:** M
- **Dependencies:** Phases 3, 5, 7.

### Phase 9 — Testing

- **Goals:** Confidence via unit + e2e coverage on critical paths.
- **Tasks:**
  - Backend: unit tests (services), e2e (auth + todos) with Supertest and an isolated SQLite file.
  - Frontend: unit tests for stores/guards/interceptor; component tests for key UI.
  - Wire all tests into CI; enforce on PR.
- **Deliverables:** Green test suite in CI gating merges.
- **Complexity:** M
- **Dependencies:** Phases 5–8.

### Phase 10 — Deployment

- **Goals:** Live production app on Render with CI/CD.
- **Tasks:**
  - Create Render Static Site (frontend) + Web Service (backend) + Persistent Disk.
  - Configure prod env/secrets and prod Google OAuth credentials/callback.
  - Backend release runs `prisma migrate deploy`.
  - `deploy.yml` triggers on `main`; set up SQLite backup job.
  - Smoke-test prod login + CRUD.
- **Deliverables:** Public URL, auto-deploy on `main`, backups configured.
- **Complexity:** M–L
- **Dependencies:** All prior phases, green CI.

### Dependency overview

```
P1 ─▶ P2 ─▶ P4 ─▶ P3 ─▶ P5 ─▶ P7 ─▶ P8 ─▶ P9 ─▶ P10
            │            ▲      ▲
            └────────────┘      │
P1 ───────────────▶ P6 ─────────┘
```

---

## 8. Step-by-Step Implementation Plan

Each step is intentionally small and independently executable in a future prompt. Steps are grouped by phase but numbered sequentially.

### Phase 1 — Project Setup
1. Initialize the Git repository and create the GitHub remote; add root `.gitignore` and `README.md`.
2. Scaffold the Angular 21 workspace in `frontend/` (standalone, routing, SCSS).
3. Scaffold the NestJS app in `backend/`.
4. Add and configure ESLint + Prettier in `frontend/`.
5. Add and configure ESLint + Prettier in `backend/`.
6. Add Husky + lint-staged for pre-commit lint/format.
7. Add `.github/workflows/ci.yml` that installs deps and builds both apps.

### Phase 2 — Backend Foundation
8. Install and configure `@nestjs/config` with a typed `configuration.ts`.
9. Add `env.validation.ts` and fail-fast env validation on boot; create `.env.example`.
10. Register a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
11. Add a global HTTP exception filter producing a uniform error shape.
12. Add a logging interceptor.
13. Configure `main.ts`: CORS (credentials, frontend origin), `cookie-parser`, `helmet`, `@nestjs/throttler`.
14. Add a `GET /health` endpoint.

### Phase 3 — Database (run before auth service work)
15. Add Prisma; create `schema.prisma` with `User` model.
16. Add `Todo` model and relation to `User`.
17. Add `RefreshToken` model (hashed token, expiry, revoked flag, relation to `User`).
18. Create the `PrismaModule` + `PrismaService` (global, connect on init).
19. Generate the first migration and the Prisma client.

### Phase 4 — Authentication
20. Create the `UsersModule` + `UsersService` (find-or-create from Google profile).
21. Add `passport-google-oauth20` `GoogleStrategy` and `GoogleAuthGuard`.
22. Implement `GET /auth/google` and `GET /auth/google/callback`.
23. Add `AuthService` access-token issuance with `@nestjs/jwt`.
24. Add refresh-token issuance: hash + persist in `RefreshToken`, set HTTP-only cookie.
25. Add `passport-jwt` `JwtStrategy` + `JwtAuthGuard` + `@CurrentUser` decorator.
26. Implement `POST /auth/refresh` with rotation (verify, revoke old, issue new).
27. Implement `POST /auth/logout` (revoke + clear cookie) and `GET /auth/me`.

### Phase 5 — TODO CRUD
28. Create `CreateTodoDto` and `UpdateTodoDto` with `class-validator` decorators.
29. Create `TodosModule` + `TodosService` with `userId`-scoped queries.
30. Implement `GET /todos` (with active/completed filter) and `GET /todos/:id`.
31. Implement `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id` under `JwtAuthGuard`.
32. Add backend e2e tests for the todos endpoints (Supertest + isolated SQLite).

### Phase 6 — Angular UI
33. Add Angular Material + CDK; configure the theme system with light/dark tokens in `styles/`.
34. Build the `MainLayout` shell: Material toolbar (title, profile, logout) + `<router-outlet>`.
35. Add the collapsible Material sidenav with nav items (Dashboard, All/Active/Completed) and CDK `BreakpointObserver` responsiveness.
36. Build the Login page with the "Login with Google" button.
37. Create shared UI components: `confirm-dialog`, `empty-state`, `loading-spinner`, `page-header`.
38. Build `todo-list` and `todo-item` components (Material cards/table).
39. Build the `todo-form-dialog` for create/edit (Reactive Forms + Material dialog).
40. Build Dashboard, All Tasks, Active Tasks, Completed Tasks pages with OnPush and deferrable views where appropriate.

### Phase 7 — State Management
41. Implement `AuthService` signals (`user`, `accessToken`, `isAuthenticated`) and login/logout flow handling the OAuth callback.
42. Implement the functional auth interceptor (attach Bearer; on 401 call `/auth/refresh` then retry).
43. Implement `TodosService` (HTTP) and `TodosStore` (signals + computed filtered views).
44. Wire the `authGuard` and configure top-level lazy routes (`loadComponent`/`loadChildren`).
45. Connect all todo pages to `TodosStore`; add pending/empty/error UI states and Material snackbars.

### Phase 8 — Security
46. Verify refresh-cookie flags, CORS credentials, helmet, and throttler on auth endpoints.
47. Audit todos ownership scoping and DTO whitelisting; add any missing guards.
48. Confirm all secrets come from env; ensure none are committed; document `.env.example`.

### Phase 9 — Testing
49. Add frontend unit tests for `AuthService`, `TodosStore`, the auth interceptor, and the guard.
50. Add frontend component tests for key UI (todo list, form dialog).
51. Wire all frontend + backend tests into `ci.yml` so they gate PRs.

### Phase 10 — Deployment
52. Create the Render Static Site for `frontend/` (build + publish dir, auto-deploy on `main`).
53. Create the Render Web Service for `backend/` with a Persistent Disk and `DATABASE_URL` pointing to it.
54. Configure production env vars/secrets and production Google OAuth credentials + callback URL.
55. Set the backend release command to run `prisma migrate deploy`; add `deploy.yml`.
56. Add a scheduled SQLite backup job; smoke-test production login and full CRUD.

---

*End of PROJECT_PLAN.md — this plan is the agreed source of truth; implementation proceeds one step at a time in subsequent prompts.*
