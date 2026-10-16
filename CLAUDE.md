# CLAUDE.md — SocialMeet (working name)

A social media app combined with Zoom-style video meetings.
This file is the project brief and coding rules for Claude Code. Read it fully before any task.

---

## 1. Project goal

Build a portfolio-grade, production-style app where users can:
- Post, follow, react, comment, chat, and get notifications (social side).
- Create, schedule, and join video meetings with screen share, host controls, and recording (meeting side).
- Start a video call from a chat and share a meeting recording as a post (bridge features).

The developer is learning Express.js, TypeScript, and React. When writing code, prefer clear, idiomatic, well-structured code over clever code, and add short comments explaining non-obvious decisions.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js current Active LTS, TypeScript (strict mode) |
| Backend | Express 5 (native async error handling, no async wrapper libs) |
| Validation | Zod (schemas shared with frontend via `packages/shared`) |
| ORM / DB | Prisma + PostgreSQL |
| Cache / pub-sub | Redis (ioredis) |
| Background jobs | BullMQ |
| Realtime | Socket.IO + `@socket.io/redis-adapter` |
| Video | LiveKit (self-hosted in Docker for dev) — `livekit-server-sdk` on server, `livekit-client` + `@livekit/components-react` on client |
| File storage | S3 (MinIO in dev) via AWS SDK for JavaScript v3 only; CloudFront for serving |
| Frontend | React 19 + Vite + TypeScript |
| Routing | React Router |
| Server state | TanStack Query |
| Client state | Zustand |
| UI | Tailwind CSS + shadcn/ui |
| Auth | JWT access token (15 min) + rotating refresh token in httpOnly cookie; argon2id password hashing |
| Testing | Vitest (unit), Supertest (API integration), Playwright (later, e2e) |
| Logging | pino (structured JSON logs) |
| Dev infra | Docker Compose: postgres, redis, minio, livekit |
| CI | GitHub Actions: lint, typecheck, test, build |

Do NOT use: the deprecated `aws-sdk` v2 package, `express-async-handler`, `localStorage` for tokens, Mongoose/MongoDB, or class-validator. Ask before adding any new dependency not listed here.

---

## 3. Architecture

Three types of traffic, three server roles:

1. **REST API (Express)** — all CRUD and all authorization decisions.
2. **Realtime gateway (Socket.IO)** — pushes events: messages, typing, presence, notifications, waiting-room requests. Writes go through REST; sockets are mainly for delivery.
3. **Media server (LiveKit SFU + TURN)** — audio/video. The browser connects to LiveKit directly using a short-lived token signed by our API. Our API is the gatekeeper; LiveKit only trusts tokens we sign.

Data layer: PostgreSQL (source of truth), Redis (cache, presence, rate limits, socket adapter, queues), S3 (media), BullMQ workers (async jobs).

In development, API and Socket.IO run in the same Node process. Keep them in separate modules so they can be split later.

---

## 4. Repository structure (pnpm monorepo)

```
apps/
  api/
    src/
      modules/            # one folder per feature
        auth/             auth.routes.ts auth.controller.ts auth.service.ts auth.schema.ts auth.test.ts
        users/
        follows/
        posts/
        comments/
        reactions/
        feed/
        media/
        chat/
        presence/
        notifications/
        meetings/         meetings.service.ts livekit.client.ts webhooks.ts
        search/
        moderation/
      realtime/           socket.ts (auth handshake, rooms, redis adapter), emit.ts
      jobs/               queues.ts, workers/
      middleware/         requireAuth.ts validate.ts rateLimit.ts errorHandler.ts
      lib/                prisma.ts redis.ts s3.ts cdn.ts logger.ts env.ts
      app.ts              express app (no listen)
      server.ts           http server + socket.io + listen
    prisma/schema.prisma
  web/
    src/
      features/           auth/ feed/ posts/ chat/ meetings/ notifications/ profile/ search/
      components/ui/      shadcn components
      lib/                api client, socket client, query client
      routes/
packages/
  shared/                 Zod schemas, shared TypeScript types, event names
docker-compose.yml
.env.example
```

Organize by feature, not by file type. Controllers are thin (HTTP only); business logic lives in services; services never touch `req`/`res`.

---

## 5. Coding conventions

- TypeScript `strict: true`. No `any` unless justified in a comment.
- Validate every request body, query, and params with Zod via the `validate` middleware.
- Env vars are parsed and validated with Zod in `lib/env.ts`; the app fails fast on missing values.
- Errors: throw typed `AppError(status, code, message)`; the central `errorHandler` formats responses as `{ error: { code, message } }`. Never leak stack traces or DB errors to clients.
- Pagination: cursor-based (`?cursor=` encoding `createdAt,id`), never OFFSET for feeds, messages, or notifications.
- IDs: UUIDs for all public identifiers. Meeting links use a random non-guessable slug.
- Soft delete (`deletedAt`) for posts, comments, and messages.
- Counters (`likeCount`, `commentCount`) are updated in the same transaction as the write.
- Idempotency: chat messages carry a client-generated `clientMessageId` (unique index).
- Socket event names live in `packages/shared/events.ts` as constants, never as inline strings.
- Every new endpoint gets at least one Supertest test covering success and an authorization failure.
- Use structured logging (pino) with a request ID; never log passwords, tokens, or OTPs.

---

## 6. Features

### F1. Authentication & accounts
- Register (email + password), email verification via signed link, login, logout, logout all devices, password reset.
- Access token: JWT, 15 min, sent as `Authorization: Bearer`.
- Refresh token: httpOnly, Secure, SameSite=Lax cookie; stored hashed in `sessions`; rotated on every refresh; reuse of an old token revokes the whole session family.
- Socket.IO connections authenticate in `io.use()` using the access token; reject unauthenticated sockets.
- Rate limit login, register, and reset per IP and per email. Generic error messages.
- Later: Google OAuth, TOTP 2FA.

### F2. Profiles & social graph
- Profile: username (unique, URL-safe), display name, bio, avatar, cover.
- Follow / unfollow; followers and following lists (cursor-paginated).
- Private accounts: follows become requests that need approval.
- Block: hides content both ways, prevents DMs and meeting invites.

### F3. Posts, comments, reactions
- Post: text plus up to 10 images or 1 video; visibility `PUBLIC | FOLLOWERS | PRIVATE`. Edit and soft-delete.
- Comments with one level of replies.
- Reactions: one per user per post, toggle; types like/love/laugh/sad.
- Every read checks visibility (prevent IDOR on private/followers-only posts).
- Attaching media to a post must verify the media is owned by the user, `READY`, and not already attached.

### F4. News feed
- Home feed: posts from followed users + own posts, newest first, cursor pagination.
- Strategy: fan-out on read using index `(authorId, createdAt DESC)`. Do not implement fan-out on write unless asked.
- Response includes author summary, media URLs, counts, and `likedByMe`.

### F5. Media upload pipeline
1. `POST /media/presign` — validate MIME (jpeg, png, webp, mp4 only; never SVG/HTML) and size; create `Media` row `PENDING`; return S3 presigned POST with `content-length-range` and 5 min expiry. Key is server-generated: `uploads/<ownerId>/<mediaId>`.
2. Browser uploads directly to S3 (`uploads/` prefix is private quarantine).
3. `POST /media/:id/complete` — ownership check, `HeadObject` verification, atomic `PENDING → PROCESSING`, enqueue BullMQ job (jobId = mediaId).
4. Worker: verify magic bytes (`file-type`), `sharp` with `limitInputPixels`, auto-rotate, strip EXIF, output WebP variants (thumb 320, medium 960, large 1600) to `media/<ownerId>/<mediaId>/`, set `READY`, emit `media:ready` socket event. On failure set `FAILED`.
5. Serve via CloudFront (bucket private, OAC). Public media: plain CDN URL with long immutable cache. Private media (followers-only, DMs, recordings): CloudFront signed URL, 10 min expiry.
- Bucket lifecycle: delete `uploads/` after 1 day; abort incomplete multipart uploads after 7 days.

### F6. Direct messages & group chat
- 1:1 and group conversations; text, images, files; emoji reactions on messages.
- Typing indicator, read receipts (`lastReadMessageId` per member), unread counts.
- Send via REST `POST /conversations/:id/messages` → save → publish → Socket.IO emits to room `conversation:<id>`.
- Edit/delete own messages. Cursor-paginated history.
- "Start call" button creates an instant meeting and posts an invite message in the conversation.
- Only conversation members can read, send, or join the room (check on every request and every socket room join).

### F7. Presence
- Track sockets per user in Redis with heartbeat TTL. Statuses: online, offline, in-meeting; store `lastSeenAt`.
- Broadcast presence only to followers/conversation members, not globally.

### F8. Notifications
- Types: new follower, follow request, like, comment, mention, message (when offline), meeting invite, meeting starting soon, recording ready.
- Flow: domain event → BullMQ job → `notifications` row → socket emit if online → email for important types.
- Bell with unread count; mark read / mark all read; per-type mute settings.
- Group similar notifications ("A and 12 others liked your post").

### F9. Video meetings
- **Create/schedule:** instant or scheduled (title, start time, duration, invitees, optional password). Settings JSON: `waitingRoom` (default true), `muteOnEntry`, `allowScreenShare` (host only / everyone), `allowGuests`. Shareable link `/m/<slug>`. Invitees get notifications and an `.ics` email.
- **Join flow:** pre-join screen (camera/mic preview, device select) → `POST /meetings/:slug/join` → API checks existence, status, invite/public, password, blocks → if waiting room, return `202 waiting` and notify host via socket → when admitted, return a LiveKit token (TTL 5 min, `roomAdmin: false`) and LiveKit URL.
- **In meeting:** video grid + active speaker, mute/unmute, camera toggle, device switching, screen share, in-meeting chat (Socket.IO, persisted), raise hand, reactions, participant list.
- **Host controls:** admit/deny, mute participant, remove participant, lock meeting, end for all, promote co-host. Client calls our API → API checks host role → API calls LiveKit server SDK. Clients never get admin grants.
- **Recording:** host starts/stops → API calls LiveKit Egress → output to S3 → `egress_ended` webhook → `recordings` row → notify participants → optional "share as post".
- **Attendance:** LiveKit webhooks (`participant_joined`, `participant_left`, `room_finished`) update `meeting_participants`. Always verify webhook signatures.

### F10. Search
- Users (username, display name) and posts (text, hashtags).
- PostgreSQL full-text search (`tsvector` + GIN) and `pg_trgm` for fuzzy usernames. Respect post visibility and blocks in results.

### F11. Moderation & admin
- Report post / comment / user / meeting with reason.
- Admin area: review reports, hide content, suspend users, view audit log.
- `audit_logs` records admin actions and security events (login, password change, session revoke).
- Anti-spam rate limits on posting, commenting, DMs to non-followers, meeting creation, presign.

---

## 7. Data model (Prisma models)

- `User`, `Session` (hashed refresh token, family id, revokedAt)
- `Follow` (followerId, followeeId, status `ACTIVE | PENDING`, composite PK), `Block`
- `Post`, `Media` (status `PENDING | PROCESSING | READY | FAILED`, variants JSON), `Comment`, `Reaction` (unique userId + postId)
- `Conversation`, `ConversationMember` (role, lastReadMessageId), `Message` (unique clientMessageId)
- `Notification`, `NotificationSetting`
- `Meeting` (hostId, slug, scheduledAt, status, settings JSON, passwordHash), `MeetingInvite`, `MeetingParticipant` (role, joinedAt, leftAt), `Recording`
- `Report`, `AuditLog`

Required indexes: `Post(authorId, createdAt DESC)`, `Message(conversationId, createdAt DESC)`, `Notification(userId, readAt, createdAt DESC)`, `Follow(followeeId)`, GIN for search vectors.

---

## 8. Security rules (must follow)

- **Access control (OWASP A01):** check ownership/membership/visibility on every read and write, including socket room joins and media attach. Return 404 (not 403) for resources the user cannot see.
- **Secrets (A02):** all secrets from env / AWS Secrets Manager; never commit `.env`. Passwords with argon2id.
- **Injection & XSS (A03):** Prisma parameterized queries only; never `$queryRawUnsafe` with user input. Never render user HTML; no `dangerouslySetInnerHTML` without DOMPurify.
- **Insecure design (A04):** rate limits listed above; waiting room on by default for public meeting links.
- **Misconfiguration (A05):** `helmet`, strict CORS allowlist for Express and Socket.IO, private S3 bucket, bucket CORS limited to app origin.
- **Integrity (A08):** verify LiveKit webhook signatures; validate file magic bytes.
- **SSRF (A10):** if link previews are added, block private/internal IP ranges including `169.254.169.254`.
- Tokens: never in `localStorage`, never in URLs, never logged.

---

## 9. Local development

`docker-compose.yml` services: `postgres`, `redis`, `minio` (+ bucket init), `livekit` (dev mode with TURN enabled).

Intended scripts (create them in Phase 1):
- `pnpm dev` — run api and web together
- `pnpm db:migrate` / `pnpm db:seed` — Prisma migrate and seed
- `pnpm test` — Vitest + Supertest
- `pnpm lint` / `pnpm typecheck`
- `pnpm worker` — run BullMQ workers

Keep `.env.example` up to date whenever a new env var is added.

---

## 10. Roadmap (build in this order; one phase at a time)

- [ ] **Phase 1 — Foundation:** monorepo, Docker Compose, Express app skeleton, env validation, error handler, logging, Prisma setup, auth (F1), profiles & follows (F2), posts/comments/reactions (F3, text only), feed (F4), tests, CI.
- [ ] **Phase 2 — Realtime:** Socket.IO with auth handshake and Redis adapter, chat (F6), presence (F7), notifications (F8).
- [ ] **Phase 3 — Media:** upload pipeline (F5), media in posts and chat.
- [ ] **Phase 4 — 1:1 WebRTC (learning):** raw `RTCPeerConnection` with Socket.IO signaling (offer/answer/ICE) for 1:1 calls. Learning exercise; replaced in Phase 5.
- [ ] **Phase 5 — Meetings with LiveKit:** F9 create/join/waiting room/in-meeting/host controls.
- [ ] **Phase 6 — Recording & polish:** recording, attendance, search (F10), moderation (F11), AWS deploy, monitoring (Sentry, metrics).

Update the checkboxes above when a phase is complete.

---

## 11. How to work on this project (instructions for Claude Code)

- Before coding a feature, briefly state the plan: files to create/change, endpoints, DB changes, and tests.
- Work within the current phase. Don't build later-phase features unless asked.
- Make small, reviewable changes. Run `pnpm typecheck` and `pnpm test` after changes and fix failures before finishing.
- When a design choice has trade-offs, explain them briefly and pick the option that fits this document.
- Point out security risks, performance issues, and missing tests when you notice them.
- After finishing a task, summarize what changed and suggest the next step.
- The developer is learning: when introducing a new concept (e.g. Socket.IO adapter, refresh token rotation, WebRTC signaling), add a short explanation in your summary.
