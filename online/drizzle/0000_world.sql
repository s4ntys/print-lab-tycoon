CREATE TABLE players (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE, country TEXT NOT NULL, language TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, recovery_hash TEXT NOT NULL UNIQUE, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, active_ms INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX leaderboard_score ON players(score DESC, created_at ASC);
--> statement-breakpoint
CREATE TABLE join_limits (bucket TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL);
