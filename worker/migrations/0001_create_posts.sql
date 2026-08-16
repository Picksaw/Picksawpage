-- Picksaw posts table (Cloudflare D1 / SQLite)
--
-- Maps the existing frontend Post interface:
--   id          -> id          (TEXT, primary key)
--   type        -> type        (TEXT: 'video' | 'image' | 'music')
--   title       -> title       (TEXT)
--   description -> description (TEXT)
--   tags[]      -> tags        (TEXT, stored as JSON array string)
--   likes       -> likes       (INTEGER)
--   mediaUrl?   -> media_url    (TEXT, nullable)
--   createdAt   -> created_at   (INTEGER epoch ms)
--   updatedAt   -> updated_at   (INTEGER epoch ms)
--
-- NOTE: `color`, `icon`, and `timestamp` from the frontend Post interface are
-- DERIVED values (color/icon come from `type`; timestamp is a relative label from
-- created_at). They are intentionally NOT stored — the Worker recomputes them so
-- the frontend interface stays identical without duplicating derivable data.

CREATE TABLE IF NOT EXISTS posts (
  id          TEXT    PRIMARY KEY,
  type        TEXT    NOT NULL CHECK (type IN ('video', 'image', 'music')),
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  tags        TEXT    NOT NULL DEFAULT '[]',   -- JSON array of strings
  likes       INTEGER NOT NULL DEFAULT 0,
  media_url   TEXT,
  created_at  INTEGER NOT NULL,                -- epoch milliseconds
  updated_at  INTEGER NOT NULL                 -- epoch milliseconds
);

-- Public feed is ordered newest-first.
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
