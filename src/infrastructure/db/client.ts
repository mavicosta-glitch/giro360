import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForDb = globalThis as unknown as {
  __portalSqliteDb?: DatabaseSync;
  __portalDbInitialized?: boolean;
};

function resolveDbPath(): string {
  if (process.env.PORTAL_DB_PATH) {
    return process.env.PORTAL_DB_PATH;
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "portal-infoco.db");
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#05226B',
      display_order INTEGER NOT NULL DEFAULT 0,
      show_in_menu INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      subtitle TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      cover_alt TEXT NOT NULL,
      image_caption TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL DEFAULT 'Redação',
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published', 'draft')),
      is_hero INTEGER NOT NULL DEFAULT 0,
      is_breaking INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      views INTEGER NOT NULL DEFAULT 0,
      reading_time_minutes INTEGER NOT NULL DEFAULT 1,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_categories_order
      ON categories (display_order ASC, name ASC);

    CREATE INDEX IF NOT EXISTS idx_articles_status_published
      ON articles (status, published_at DESC);

    CREATE INDEX IF NOT EXISTS idx_articles_category_status
      ON articles (category_id, status, published_at DESC);

    CREATE INDEX IF NOT EXISTS idx_articles_views
      ON articles (status, views DESC);
  `);
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__portalSqliteDb) {
    const dbPath = resolveDbPath();
    globalForDb.__portalSqliteDb = new DatabaseSync(dbPath);
  }
  if (!globalForDb.__portalDbInitialized) {
    initializeSchema(globalForDb.__portalSqliteDb);
    globalForDb.__portalDbInitialized = true;
  }
  return globalForDb.__portalSqliteDb;
}

/**
 * Permite resetar a instância singleton em suítes de testes automatizados.
 */
export function resetDbForTesting(): void {
  if (globalForDb.__portalSqliteDb) {
    try {
      globalForDb.__portalSqliteDb.close();
    } catch {
      // ignore if already closed
    }
  }
  globalForDb.__portalSqliteDb = undefined;
  globalForDb.__portalDbInitialized = false;
}

