-- Bloxter: esquema do banco (Neon / Postgres)
-- A API cria estas tabelas sozinha na primeira requisição.
-- Este arquivo existe só pra você poder rodar manualmente no SQL Editor do Neon, se quiser.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  bio           TEXT NOT NULL DEFAULT '',
  link          TEXT NOT NULL DEFAULT '',
  avatar        TEXT,
  avatar_v      BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_user_idx ON posts (user_id, id DESC);

CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS messages_pair_idx ON messages (sender_id, receiver_id, id);
CREATE INDEX IF NOT EXISTS messages_recv_idx ON messages (receiver_id, read_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS appeals (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, email TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '', details TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), resolved_at TIMESTAMPTZ);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_staff BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_gradient TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_font TEXT NOT NULL DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_effect TEXT NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_animated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image TEXT;
CREATE TABLE IF NOT EXISTS post_comments (id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS post_comments_idx ON post_comments (post_id, id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_color_1 TEXT NOT NULL DEFAULT '#252525';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_color_2 TEXT NOT NULL DEFAULT '#565656';

ALTER TABLE messages ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS stories (id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,body TEXT NOT NULL DEFAULT '',image TEXT,link TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT now(),expires_at TIMESTAMPTZ NOT NULL DEFAULT (now()+interval '24 hours'));
CREATE INDEX IF NOT EXISTS stories_exp_idx ON stories(expires_at,user_id);
CREATE TABLE IF NOT EXISTS story_views (story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(story_id,viewer_id));
CREATE TABLE IF NOT EXISTS parental_settings (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,enabled BOOLEAN NOT NULL DEFAULT false,guardian_email TEXT NOT NULL DEFAULT '',restrict_messages BOOLEAN NOT NULL DEFAULT false,private_profile BOOLEAN NOT NULL DEFAULT false,safe_mode BOOLEAN NOT NULL DEFAULT true,bedtime_start TEXT NOT NULL DEFAULT '',bedtime_end TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');
INSERT INTO site_settings(key,value) VALUES('maintenance','{"enabled":false}') ON CONFLICT(key) DO NOTHING;
