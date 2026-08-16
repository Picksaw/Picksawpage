/**
 * Picksaw Admin Auth Worker (Cloudflare)
 * ---------------------------------------
 * Performs server-side admin authentication so the real password never
 * lives in the frontend bundle or the public GitHub repo.
 *
 * Endpoints:
 *   POST /api/admin/login   { password }  -> { success, token?, expiresAt? }
 *   GET  /api/admin/verify  (Bearer token) -> { success }
 *   POST /api/admin/logout  -> { success }  (stateless; client discards token)
 *
 * Protected admin operations (create/edit/delete posts, set game link, etc.)
 * MUST send the token and be validated with requireAdmin() before acting.
 *
 * SECRETS (configured in Cloudflare, never committed):
 *   ADMIN_PASSWORD  - the real admin password
 *   AUTH_SIGNING_KEY - random string used to sign session tokens (HMAC)
 *
 * The token is a short-lived HMAC-signed value. It does NOT contain the
 * password. It cannot be forged without AUTH_SIGNING_KEY (server-only).
 */

export interface Env {
  ADMIN_PASSWORD: string;
  AUTH_SIGNING_KEY: string;
  // Optional: comma-separated list of allowed origins for CORS.
  // e.g. "https://yourname.github.io,https://picksaw.pages.dev"
  ALLOWED_ORIGINS?: string;
  // Cloudflare D1 database binding (configured in wrangler.toml).
  DB: D1Database;
}

// How long an admin session token stays valid (seconds).
const TOKEN_TTL_SECONDS = 60 * 30; // 30 minutes

// ---------- helpers ----------

function textEncoder() {
  return new TextEncoder();
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signToken(env: Env): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  // Random nonce so two tokens issued in the same second still differ.
  const nonce = base64UrlEncode(crypto.getRandomValues(new Uint8Array(12)));
  const payload = { sub: "admin", exp: expiresAt, nonce };
  const payloadB64 = base64UrlEncode(textEncoder().encode(JSON.stringify(payload)));

  const key = await importHmacKey(env.AUTH_SIGNING_KEY);
  const sig = await crypto.subtle.sign("HMAC", key, textEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(sig);

  return { token: `${payloadB64}.${sigB64}`, expiresAt };
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifyToken(env: Env, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  const key = await importHmacKey(env.AUTH_SIGNING_KEY);
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder().encode(payloadB64)
  );
  const provided = base64UrlDecode(sigB64);
  if (!timingSafeEqual(new Uint8Array(expected), provided)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    if (payload.sub !== "admin") return false;
    if (typeof payload.exp !== "number") return false;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return false; // expired
    return true;
  } catch {
    return false;
  }
}

/**
 * Constant-time-ish password comparison. We hash both sides with HMAC using
 * the signing key so we never branch on raw password contents.
 */
async function passwordMatches(env: Env, submitted: string): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false;
  const key = await importHmacKey(env.AUTH_SIGNING_KEY);
  const a = await crypto.subtle.sign("HMAC", key, textEncoder().encode(submitted));
  const b = await crypto.subtle.sign("HMAC", key, textEncoder().encode(env.ADMIN_PASSWORD));
  return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

// ---------- CORS ----------

/**
 * Returns the origin to echo back, or null if it is not allowed.
 * - With ALLOWED_ORIGINS set: only exact matches are permitted (recommended).
 * - Without it set: only same-origin requests get CORS (localhost during dev
 *   still works because wrangler dev serves the Worker on the same origin).
 *   Unknown cross-origins receive NO allow-origin header → browser blocks them.
 */
function resolveCorsOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null; // non-CORS (e.g. same-origin / curl) — no header needed

  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    // No allow-list configured: do NOT reflect arbitrary origins.
    return null;
  }
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  const allowOrigin = resolveCorsOrigin(request, env);
  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }
  return headers;
}

function json(
  data: unknown,
  request: Request,
  env: Env,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(request, env),
    },
  });
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Use this at the top of any protected admin operation.
 * Returns true only for a valid, unexpired admin token.
 */
async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  const token = getBearerToken(request);
  if (!token) return false;
  return verifyToken(env, token);
}

// ---------- posts data layer (D1) ----------

type PostType = "video" | "image" | "music";

// Derived presentation values kept identical to the frontend's types.ts,
// so the public API returns the SAME shape the UI already expects.
const TYPE_ICONS: Record<PostType, string> = {
  video:
    "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  image:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
};
const TYPE_COLORS: Record<PostType, string> = {
  video: "from-sky-500/30 via-cyan-400/15 to-transparent",
  image: "from-violet-500/30 via-purple-400/15 to-transparent",
  music: "from-emerald-500/30 via-teal-400/15 to-transparent",
};

function timeAgo(createdAtMs: number): string {
  const seconds = Math.floor((Date.now() - createdAtMs) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Raw DB row shape (snake_case).
interface PostRow {
  id: string;
  type: string;
  title: string;
  description: string;
  tags: string; // JSON string
  likes: number;
  media_url: string | null;
  created_at: number;
  updated_at: number;
}

// Public-facing post shape (camelCase) — matches frontend types.ts Post.
// Only intended-public fields are exposed. No secrets ever touch this.
function rowToPublicPost(row: PostRow) {
  const type = (["video", "image", "music"].includes(row.type) ? row.type : "image") as PostType;
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    type,
    title: row.title,
    description: row.description,
    tags,
    likes: row.likes,
    mediaUrl: row.media_url ?? undefined,
    // Derived (not stored) — keeps frontend Post interface unchanged.
    color: TYPE_COLORS[type],
    icon: TYPE_ICONS[type],
    timestamp: timeAgo(row.created_at),
  };
}

// Validated, sanitized input for create/update.
interface PostInput {
  type: PostType;
  title: string;
  description: string;
  tags: string[];
  likes: number;
  mediaUrl: string | null;
}

// Strict server-side validation. Never trust the client body.
function validatePostBody(body: unknown, partial = false): PostInput | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid body" };
  const b = body as Record<string, unknown>;

  // type
  let type: PostType = "image";
  if (b.type !== undefined) {
    if (b.type !== "video" && b.type !== "image" && b.type !== "music") {
      return { error: "Invalid type" };
    }
    type = b.type;
  } else if (!partial) {
    return { error: "Missing type" };
  }

  // title
  let title = "";
  if (b.title !== undefined) {
    if (typeof b.title !== "string") return { error: "Invalid title" };
    title = b.title.trim().slice(0, 200);
    if (!title) return { error: "Title required" };
  } else if (!partial) {
    return { error: "Missing title" };
  }

  // description
  let description = "";
  if (b.description !== undefined) {
    if (typeof b.description !== "string") return { error: "Invalid description" };
    description = b.description.slice(0, 5000);
  }

  // tags
  let tags: string[] = [];
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) return { error: "Invalid tags" };
    tags = b.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 20);
  }

  // likes
  let likes = 0;
  if (b.likes !== undefined) {
    if (typeof b.likes !== "number" || !Number.isFinite(b.likes) || b.likes < 0) {
      return { error: "Invalid likes" };
    }
    likes = Math.floor(b.likes);
  }

  // mediaUrl (optional). Only allow http(s) or data: URLs.
  let mediaUrl: string | null = null;
  if (b.mediaUrl !== undefined && b.mediaUrl !== null) {
    if (typeof b.mediaUrl !== "string") return { error: "Invalid mediaUrl" };
    const url = b.mediaUrl.trim().slice(0, 200000);
    if (url && !/^(https?:|data:)/i.test(url)) return { error: "Invalid mediaUrl scheme" };
    mediaUrl = url || null;
  }

  return { type, title, description, tags, likes, mediaUrl };
}

async function listPosts(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT id, type, title, description, tags, likes, media_url, created_at, updated_at FROM posts ORDER BY created_at DESC"
  ).all<PostRow>();
  return (results ?? []).map(rowToPublicPost);
}

async function getPostRow(env: Env, id: string): Promise<PostRow | null> {
  const row = await env.DB.prepare(
    "SELECT id, type, title, description, tags, likes, media_url, created_at, updated_at FROM posts WHERE id = ?"
  )
    .bind(id)
    .first<PostRow>();
  return row ?? null;
}

async function createPost(env: Env, input: PostInput) {
  const now = Date.now();
  const id =
    (crypto.randomUUID?.() as string | undefined) ??
    `${now}-${Math.random().toString(36).slice(2)}`;

  await env.DB.prepare(
    "INSERT INTO posts (id, type, title, description, tags, likes, media_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      input.type,
      input.title,
      input.description,
      JSON.stringify(input.tags),
      input.likes,
      input.mediaUrl,
      now,
      now
    )
    .run();

  const row = await getPostRow(env, id);
  return row ? rowToPublicPost(row) : null;
}

async function updatePost(env: Env, id: string, body: unknown) {
  const existing = await getPostRow(env, id);
  if (!existing) return { notFound: true as const };

  const validated = validatePostBody(body, true);
  if ("error" in validated) return { error: validated.error };

  const b = body as Record<string, unknown>;
  // Only overwrite fields explicitly provided; otherwise keep existing.
  const type = b.type !== undefined ? validated.type : (existing.type as PostType);
  const title = b.title !== undefined ? validated.title : existing.title;
  const description = b.description !== undefined ? validated.description : existing.description;
  const tags = b.tags !== undefined ? validated.tags : JSON.parse(existing.tags || "[]");
  const likes = b.likes !== undefined ? validated.likes : existing.likes;
  const mediaUrl = b.mediaUrl !== undefined ? validated.mediaUrl : existing.media_url;
  const now = Date.now();

  await env.DB.prepare(
    "UPDATE posts SET type = ?, title = ?, description = ?, tags = ?, likes = ?, media_url = ?, updated_at = ? WHERE id = ?"
  )
    .bind(type, title, description, JSON.stringify(tags), likes, mediaUrl, now, id)
    .run();

  const row = await getPostRow(env, id);
  return { post: row ? rowToPublicPost(row) : null };
}

async function deletePost(env: Env, id: string) {
  const result = await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  // D1 reports affected rows in meta.changes
  const changes = (result as { meta?: { changes?: number } }).meta?.changes ?? 0;
  return changes > 0;
}

/**
 * PUBLIC like/unlike.
 *
 * POST /api/posts/:id/like    → +1, returns the new count
 * POST /api/posts/:id/unlike  → -1 (floored at 0), returns the new count
 *
 * No admin token required: likes are a public interaction (like any social
 * site). The count lives in D1 so it is shared across ALL devices/browsers.
 * (Simple increment for now — add rate limiting here later if ever needed.)
 */
async function changeLikes(
  env: Env,
  id: string,
  delta: 1 | -1
): Promise<{ notFound: true } | { likes: number }> {
  const existing = await getPostRow(env, id);
  if (!existing) return { notFound: true };
  const likes = Math.max(0, existing.likes + delta);
  await env.DB.prepare("UPDATE posts SET likes = ? WHERE id = ?").bind(likes, id).run();
  return { likes };
}

// ---------- router ----------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // POST /api/admin/login
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      let body: { password?: string };
      try {
        body = await request.json();
      } catch {
        return json({ success: false }, request, env, 400);
      }
      const password = typeof body.password === "string" ? body.password : "";

      if (!(await passwordMatches(env, password))) {
        // Do not reveal whether the password field was empty vs wrong.
        return json({ success: false }, request, env, 401);
      }

      const { token, expiresAt } = await signToken(env);
      return json({ success: true, token, expiresAt }, request, env, 200);
    }

    // GET /api/admin/verify  (checks a token is still valid)
    if (url.pathname === "/api/admin/verify" && request.method === "GET") {
      const ok = await requireAdmin(request, env);
      return json({ success: ok }, request, env, ok ? 200 : 401);
    }

    // POST /api/admin/logout  (stateless: client just discards the token)
    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      return json({ success: true }, request, env, 200);
    }

    // ─────────────────────────────────────────────────────────────
    // POSTS API (Cloudflare D1 is the source of truth)
    // ─────────────────────────────────────────────────────────────

    // GET /api/posts  — PUBLIC (no auth). Returns public posts.
    if (url.pathname === "/api/posts" && request.method === "GET") {
      try {
        const posts = await listPosts(env);
        return json({ success: true, posts }, request, env, 200);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    // POST /api/posts/:id/like — PUBLIC. +1 like, returns new count.
    const likeMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/like$/);
    if (likeMatch && request.method === "POST") {
      try {
        const result = await changeLikes(env, decodeURIComponent(likeMatch[1]), 1);
        if ("notFound" in result) {
          return json({ success: false, error: "Not found" }, request, env, 404);
        }
        return json({ success: true, likes: result.likes }, request, env, 200);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    // POST /api/posts/:id/unlike — PUBLIC. -1 like (floored at 0).
    const unlikeMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/unlike$/);
    if (unlikeMatch && request.method === "POST") {
      try {
        const result = await changeLikes(env, decodeURIComponent(unlikeMatch[1]), -1);
        if ("notFound" in result) {
          return json({ success: false, error: "Not found" }, request, env, 404);
        }
        return json({ success: true, likes: result.likes }, request, env, 200);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    // POST /api/posts  — PROTECTED. Create a post.
    if (url.pathname === "/api/posts" && request.method === "POST") {
      if (!(await requireAdmin(request, env))) {
        return json({ success: false, error: "Unauthorized" }, request, env, 401);
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "Malformed JSON" }, request, env, 400);
      }
      const validated = validatePostBody(body, false);
      if ("error" in validated) {
        return json({ success: false, error: validated.error }, request, env, 400);
      }
      try {
        const post = await createPost(env, validated);
        return json({ success: true, post }, request, env, 201);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    // PUT /api/posts/:id  — PROTECTED. Update a post.
    const putMatch = url.pathname.match(/^\/api\/posts\/([^/]+)$/);
    if (putMatch && request.method === "PUT") {
      if (!(await requireAdmin(request, env))) {
        return json({ success: false, error: "Unauthorized" }, request, env, 401);
      }
      const id = decodeURIComponent(putMatch[1]);
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "Malformed JSON" }, request, env, 400);
      }
      try {
        const result = await updatePost(env, id, body);
        if ("notFound" in result) {
          return json({ success: false, error: "Not found" }, request, env, 404);
        }
        if ("error" in result) {
          return json({ success: false, error: result.error }, request, env, 400);
        }
        return json({ success: true, post: result.post }, request, env, 200);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    // DELETE /api/posts/:id  — PROTECTED. Delete a post.
    const delMatch = url.pathname.match(/^\/api\/posts\/([^/]+)$/);
    if (delMatch && request.method === "DELETE") {
      if (!(await requireAdmin(request, env))) {
        return json({ success: false, error: "Unauthorized" }, request, env, 401);
      }
      const id = decodeURIComponent(delMatch[1]);
      try {
        const removed = await deletePost(env, id);
        if (!removed) {
          return json({ success: false, error: "Not found" }, request, env, 404);
        }
        return json({ success: true }, request, env, 200);
      } catch {
        return json({ success: false, error: "Database error" }, request, env, 500);
      }
    }

    return json({ success: false, error: "Not found" }, request, env, 404);
  },
};