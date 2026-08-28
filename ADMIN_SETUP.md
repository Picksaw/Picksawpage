# 🔐 Admin Setup — Cloudflare Worker Authentication

Picksaw has a single **admin** (you). Only authenticated admin requests may
create / edit / delete posts or set the game link. The public can always view.

**The real admin password never exists in this repo or the frontend bundle.**
It lives only as a **Cloudflare Worker Secret** and is verified server-side.

---

## Architecture

```
Browser  ──POST /api/admin/login {password}──▶  Cloudflare Worker
                                                 (compares against ADMIN_PASSWORD secret)
Browser  ◀──── { success, token } ────────────  (short-lived HMAC-signed token)

Browser  ──protected request + Bearer token──▶  Worker verifies token, then allows op
```

- The browser sends the password **over HTTPS** to the Worker for login only.
- The Worker returns a **short-lived signed token** (default 30 min) — **not** the password.
- The token is stored in `sessionStorage` (cleared on tab close) and re-verified on load.
- Every protected admin operation must be verified server-side with `requireAdmin()`.
- A frontend `isAdmin = true` is **only a UI hint** — it is never trusted for authorization.

---

## 1) Files created / changed

**Frontend (safe to commit — no secrets):**
- `src/config/adminConfig.ts` — holds only the **public Worker URL** + endpoint paths.
- `src/hooks/useAdmin.ts` — now calls the Worker, stores only a short-lived token,
  exposes `authFetch()` for protected calls.
- `src/components/LoginModal.tsx` — login is now async (awaits the Worker).
- `src/App.tsx` — `handleLogin` is now async.
- `.gitignore` — ignores local Worker dev secrets.

**Removed (they leaked the password into the bundle):**
- `src/config/adminSecret.ts` ❌ deleted
- `src/config/adminSecret.example.ts` ❌ deleted

**Cloudflare Worker (new folder `worker/`):**
- `worker/src/index.ts` — the auth Worker (login / verify / logout + `requireAdmin`).
- `worker/wrangler.toml` — Worker config (**no secrets**).
- `worker/package.json`, `worker/tsconfig.json` — Worker tooling.
- `worker/.dev.vars.example` — template for **local** dev secrets (copy to `.dev.vars`).

---

## 2) Which Worker to create/update

Create a Worker named **`picksaw-admin`** (name is set in `worker/wrangler.toml`).
Deploy the code in `worker/src/index.ts`.

---

## 3) Secrets you must add

| Secret name         | Purpose                                             |
|---------------------|-----------------------------------------------------|
| `ADMIN_PASSWORD`    | Your real admin password (verified server-side).    |
| `AUTH_SIGNING_KEY`  | A long random string used to sign session tokens.   |

> Generate a strong signing key, e.g. run in a terminal:
> `openssl rand -base64 48`

---

## 4) Where to add them (Cloudflare dashboard)

**Dashboard → Workers & Pages → `picksaw-admin` → Settings → Variables and Secrets
→ Add → Type: _Secret_ (Encrypted).**

Add both `ADMIN_PASSWORD` and `AUTH_SIGNING_KEY` there, then **Deploy**.

Or via CLI (from the `worker/` folder):
```bash
npx wrangler secret put ADMIN_PASSWORD      # paste your password when prompted
npx wrangler secret put AUTH_SIGNING_KEY    # paste a long random string
```

---

## 5) Environment variable / secret names

Use exactly: **`ADMIN_PASSWORD`** and **`AUTH_SIGNING_KEY`** (encrypted secrets).
The non-secret **`ALLOWED_ORIGINS`** var (in `wrangler.toml` `[vars]`) is optional CORS config.

---

## 6) URL the frontend calls (after deployment)

After deploy, your Worker URL looks like:
```
https://picksaw-admin.<your-subdomain>.workers.dev
```

Point the frontend at it with a build-time env var (recommended):
```bash
# .env  (or .env.local — both are git-ignored)
VITE_ADMIN_API_BASE=https://picksaw-admin.<your-subdomain>.workers.dev
```
Then rebuild (`npm run build`). If unset, admin sign-in is simply hidden and the
public site works normally.

The frontend will call:
- `POST {BASE}/api/admin/login`
- `GET  {BASE}/api/admin/verify`
- `POST {BASE}/api/admin/logout`

---

## 7) CORS configuration

The Worker already sends CORS headers and handles `OPTIONS` preflight.
Set the allowed origin(s) in `worker/wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGINS = "https://YOUR-USERNAME.github.io,https://yourdomain.com"
```
(Comma-separated. If left blank, the Worker echoes the request origin — fine for
testing, but set your real origin(s) for production.)

---

## 8) Deployment steps

```bash
cd worker
npm install
npx wrangler login                    # once, to authenticate wrangler

npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put AUTH_SIGNING_KEY

# (edit wrangler.toml ALLOWED_ORIGINS to your site origin)
npx wrangler deploy
```

Then set `VITE_ADMIN_API_BASE` to the deployed URL and rebuild the frontend.

**Local Worker testing:**
```bash
cp .dev.vars.example .dev.vars        # fill in local values (git-ignored)
npx wrangler dev
```

---

## Security summary

- ✅ Real password lives only in a Cloudflare Secret — never in Git, never in the bundle.
- ✅ Login verification happens server-side in the Worker.
- ✅ Frontend receives only a short-lived, server-signed token (not the password).
- ✅ Protected operations must pass `requireAdmin()` (server-validated token).
- ✅ Public visitors can view everything; only a valid token authorizes admin ops.

---

# 🗄️ Persistent Posts — Cloudflare D1

Posts are now stored in **Cloudflare D1** (SQLite). The Worker is the ONLY thing
that touches the database; the frontend never connects to D1 directly.

## Posts API

| Method & path         | Auth      | Purpose                    |
|-----------------------|-----------|----------------------------|
| `GET /api/posts`      | 🌐 Public | List all posts (the feed). |
| `POST /api/posts`     | 🔒 Admin  | Create a post.             |
| `PUT /api/posts/:id`  | 🔒 Admin  | Update a post.             |
| `DELETE /api/posts/:id` | 🔒 Admin | Delete a post.            |

Admin endpoints call the existing `requireAdmin()` (Bearer token verification).
No request is trusted merely because the frontend claims to be admin.

## Database schema

Table `posts` (see `worker/migrations/0001_create_posts.sql`):

| Column        | Type    | Maps to frontend        |
|---------------|---------|-------------------------|
| `id`          | TEXT PK | `id`                    |
| `type`        | TEXT    | `type` (video/image/music) |
| `title`       | TEXT    | `title`                 |
| `description` | TEXT    | `description`           |
| `tags`        | TEXT    | `tags` (JSON array)     |
| `likes`       | INTEGER | `likes`                 |
| `media_url`   | TEXT    | `mediaUrl`              |
| `created_at`  | INTEGER | (drives `timestamp`)    |
| `updated_at`  | INTEGER | —                       |

> `color`, `icon`, and `timestamp` are DERIVED by the Worker from `type` /
> `created_at`, so the frontend `Post` interface is unchanged.

## Set up D1 (one time)

```bash
cd worker

# 1) Create the database (prints a database_id — copy it):
npx wrangler d1 create picksaw-db

# 2) Paste that id into worker/wrangler.toml under [[d1_databases]] database_id.

# 3) Apply the migration locally (optional, for `wrangler dev`):
npx wrangler d1 migrations apply picksaw-db --local

# 4) Apply the migration to PRODUCTION D1:
npx wrangler d1 migrations apply picksaw-db --remote

# 5) Deploy the Worker (now with DB binding + posts API):
npx wrangler deploy
```

To inspect an existing DB before changing anything:
```bash
npx wrangler d1 execute picksaw-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Frontend wiring (already done)

- On load, the app calls `GET /api/posts` and fills the feed.
- Admin create → `POST /api/posts` via `authFetch`; state updates only on success.
- Admin delete → `DELETE /api/posts/:id` via `authFetch`; removed from state only on success.
- If a session expires mid-operation (401), the app logs out and surfaces the error.

## Seeding initial content

There are **no hardcoded/default posts** in the source (the app started with an
empty list), so nothing is being deleted or lost. To add starter content, either
use the admin panel after deploy, or insert rows manually, e.g.:
```bash
npx wrangler d1 execute picksaw-db --remote --command \
  "INSERT INTO posts (id,type,title,description,tags,likes,media_url,created_at,updated_at) \
   VALUES ('seed1','image','Hello','First post','[\"intro\"]',0,NULL,1710000000000,1710000000000);"
```

## D1 security notes

- ✅ All queries are parameterized (`.bind(...)`) — no SQL string concatenation.
- ✅ Incoming post bodies are validated server-side before any DB write.
- ✅ Public `GET` returns only intended-public fields; no secrets/env values.
- ✅ D1 is reached only via the `DB` binding — no DB credentials in source.
