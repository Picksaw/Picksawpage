// Frontend ↔ Worker posts API.
//
// The Cloudflare Worker (backed by D1) is the source of truth. This module
// wraps the network calls. Public reads use plain fetch; admin writes use
// authFetch() so the existing server-side token verification applies.
//
// The Worker already returns posts in the exact frontend `Post` shape
// (camelCase, with derived color/icon/timestamp), so no mapping is needed here.

import { ADMIN_API_BASE, ADMIN_ENABLED, POSTS_ENDPOINTS } from "../config/adminConfig";
import { authFetch } from "../hooks/useAdmin";
import { type Post } from "../types";

// Raised when an admin write fails because the session is invalid/expired.
export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

// Data the admin panel provides when creating a post. The Worker derives
// color/icon/timestamp and assigns id/likes, so we only send the essentials.
export interface NewPostInput {
  type: Post["type"];
  title: string;
  description: string;
  tags: string[];
  mediaUrl?: string;
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * PUBLIC: load all posts. No authentication required.
 * Returns [] if the API base is not configured (site still renders).
 */
export async function fetchPosts(): Promise<Post[]> {
  if (!ADMIN_API_BASE) return [];
  const res = await fetch(`${ADMIN_API_BASE}${POSTS_ENDPOINTS.list}`);
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
  const data = await parseJson(res);
  return Array.isArray(data.posts) ? (data.posts as Post[]) : [];
}

/**
 * ADMIN: create a post via the authenticated Worker endpoint.
 * Returns the persisted Post (with server-assigned id) on success.
 * Throws AuthError on 401 so the caller can trigger logout.
 */
export async function createPostApi(input: NewPostInput): Promise<Post> {
  if (!ADMIN_ENABLED) throw new AuthError("Admin API not configured");
  const res = await authFetch(POSTS_ENDPOINTS.create, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new AuthError();
  const data = await parseJson(res);
  if (!res.ok || !data.success || !data.post) {
    throw new Error((data.error as string) || "Failed to create post");
  }
  return data.post as Post;
}

/**
 * ADMIN: update a post via the authenticated Worker endpoint.
 */
export async function updatePostApi(id: string, patch: Partial<NewPostInput>): Promise<Post> {
  if (!ADMIN_ENABLED) throw new AuthError("Admin API not configured");
  const res = await authFetch(POSTS_ENDPOINTS.item(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (res.status === 401) throw new AuthError();
  const data = await parseJson(res);
  if (!res.ok || !data.success || !data.post) {
    throw new Error((data.error as string) || "Failed to update post");
  }
  return data.post as Post;
}

/**
 * ADMIN: delete a post via the authenticated Worker endpoint.
 * Throws AuthError on 401, Error on other failures.
 */
export async function deletePostApi(id: string): Promise<void> {
  if (!ADMIN_ENABLED) throw new AuthError("Admin API not configured");
  const res = await authFetch(POSTS_ENDPOINTS.item(id), { method: "DELETE" });
  if (res.status === 401) throw new AuthError();
  const data = await parseJson(res);
  if (!res.ok || !data.success) {
    throw new Error((data.error as string) || "Failed to delete post");
  }
}
