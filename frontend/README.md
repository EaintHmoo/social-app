# Frontend

React + TypeScript + Tailwind client for the Express/Mongo API in [`../backend`](../backend).

## Running it

The backend must be up first — the frontend is only a client.

```bash
# terminal 1 — database + API
cd backend
docker compose up -d        # mongo on :27017, API on :3000
# or: npm run dev, with your own mongo running

# terminal 2 — this app
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload, on :5173 |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run lint` | oxlint |
| `npm run preview` | Serves the built `dist/` locally |

## How it is put together

```
src/
  main.tsx            mounts <App> into index.html
  App.tsx             BrowserRouter + AuthProvider, nothing else
  routes/             the route table (AppRoutes.tsx) — this app's routes/web.php
  pages/              one component per URL: Login, Register, Tasks, Sessions, NotFound
  layouts/            the shells pages render inside: AppLayout (nav + sign-out), AuthLayout
  features/           domain modules; each owns its API calls and its own components/hooks
    auth/
      api.ts            one function per route in backend/src/routes/auth.ts
      AuthContext.ts    the context object, alone in its file so Fast Refresh keeps working
      components/       AuthProvider (who is signed in), RouteGuards (RequireAuth/RequireGuest)
      hooks/useAuth.ts  reads the context, and throws a useful error outside the provider
      index.ts          the feature's public surface — import from here, never from inside
    tasks/
      api.ts            GET /tasks, POST /tasks
      index.ts
  components/         reusable UI, one folder each: Alert, Button, Spinner, TextField
  services/           app-wide infrastructure, no React anywhere in it
    apiClient.ts        fetch wrapper: auth header, refresh-and-retry, error translation
    ApiError.ts         one error type for every failed request
    tokens.ts           reading/writing the two tokens in localStorage
  utils/format.ts     dates and user-agent strings, for display
  config/index.ts     the only module that reads import.meta.env
  types/api.ts        the JSON shapes the backend sends — mirrors backend/src/types/resources.ts
  hooks/              shared hooks (empty today — see the README inside)
  store/              global client state, if it is ever needed (see the README inside)
  assets/             images and fonts imported by code; fixed-URL files go in public/
```

The dependency direction is one-way: `pages → features → services → config`. Shared `components/`
and `utils/` sit at the bottom and import nothing above them; `services/` imports no React, which
is what keeps the token logic testable and free of hooks.

Two rules keep it from degrading:

- **Cross-feature imports go through the barrel.** A page imports `{ useAuth, authApi }` from
  `features/auth`, never from `features/auth/components/AuthProvider`. The barrel is the contract;
  everything else inside the folder can be moved without touching a caller.
- **Shared when it is actually shared.** A component or hook lives inside the feature that uses it
  and moves up to `components/` or `hooks/` the moment a second feature needs it — not in
  anticipation of one.

Two departures from the usual sketch of this layout, both because of what is already installed:
there are no `*.module.css` files (Tailwind v4 does the styling with utility classes), and no
`*.test.tsx` files (no test runner in `package.json` yet — those sit next to the component they
cover when one is added).

## Three things worth knowing

**1. No CORS on the backend, so dev uses a proxy.**
`backend/src/server.ts` registers no CORS middleware, so the browser would block a direct call from
:5173 to :3000. [`vite.config.ts`](vite.config.ts) proxies `/api/*` to the backend instead,
stripping the prefix as it goes, which makes every request same-origin. The prefix is load-bearing:
proxying `/tasks` directly would shadow the *page* at that same URL. Deploying means either
serving `dist/` from the same origin as the API, or adding `cors` to the backend and setting
`VITE_API_URL`.

**2. Access tokens last 15 seconds.**
That is `JWT_EXPIRES_IN=15s` in `backend/.env` — a deliberately short value for exercising the
refresh flow. So a 401 is normal, not exceptional: `apiFetch` catches it, refreshes, and retries
once, and the calling component never finds out.

**3. Refreshing is single-flight, across tabs.**
The backend rotates the refresh token on every use and treats a *second* use of an already-rotated
token as theft — it revokes the whole session (`sessionService.ts`, "reuse detection"). Two
simultaneous refreshes would therefore log the user out everywhere. `apiClient.ts` prevents that
twice over: a module-level promise collapses concurrent refreshes within one tab, and a
[Web Lock](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) serialises them *across*
tabs. Whichever tab loses the race notices the stored token changed and reuses the winner's result
instead of rotating again.

## What the UI cannot do yet, and why

These are backend gaps, not missing frontend work. Each needs a route before a control can exist:

| Missing | Needed for |
| --- | --- |
| `PATCH /tasks/:id` | Ticking a task off — `done` is currently read-only |
| `DELETE /tasks/:id` | Removing a task |
| Scoping `GET /tasks` to `req.user` | `taskService.listTasks()` returns *every* user's tasks |
| `DELETE /auth/sessions/:id` | Revoking one device; `revokeSession()` exists but no route exposes it |

## A note on token storage

The tokens live in `localStorage`, because the backend authenticates with an
`Authorization: Bearer` header and JavaScript therefore has to be able to read them. The trade-off
is that an XSS bug would expose them. The stricter alternative is httpOnly cookies, which is a
backend change: issuing cookies, CSRF protection, and a `credentials: "include"` client.
