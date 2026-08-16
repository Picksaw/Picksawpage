// ─────────────────────────────────────────────────────────────
//  Admin API configuration (SAFE TO COMMIT — no secrets here)
// ─────────────────────────────────────────────────────────────
//
// The real admin password lives ONLY in a Cloudflare Worker Secret
// (ADMIN_PASSWORD) and is verified server-side. Nothing secret is
// stored in the frontend bundle.
//
// This file only holds the public URL of the Worker that performs
// authentication. Set it via a build-time env var (VITE_ADMIN_API_BASE)
// or edit the fallback default below to your deployed Worker URL.
//
// Examples:
//   https://picksaw-admin.<your-subdomain>.workers.dev
//   https://api.yourdomain.com        (if routed through a custom domain)
//
// If empty, admin login is simply unavailable (public site still works).

const RAW_BASE =
  (import.meta.env.VITE_ADMIN_API_BASE as string | undefined)?.trim() || "";

// Normalize: strip a trailing slash so we can safely append paths.
export const ADMIN_API_BASE: string = RAW_BASE.replace(/\/+$/, "");

// Admin sign-in is possible only if we know where the Worker lives.
export const ADMIN_ENABLED: boolean = ADMIN_API_BASE.length > 0;

// Endpoint paths (served by the Cloudflare Worker).
export const ADMIN_ENDPOINTS = {
  login: "/api/admin/login",
  verify: "/api/admin/verify",
  logout: "/api/admin/logout",
} as const;

// Posts API paths (D1-backed via the Worker).
export const POSTS_ENDPOINTS = {
  list: "/api/posts", // GET  (public)
  create: "/api/posts", // POST (admin)
  item: (id: string) => `/api/posts/${encodeURIComponent(id)}`, // PUT/DELETE (admin)
  like: (id: string) => `/api/posts/${encodeURIComponent(id)}/like`, // POST (public)
  unlike: (id: string) => `/api/posts/${encodeURIComponent(id)}/unlike`, // POST (public)
} as const;