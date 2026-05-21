import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR ?? './data';
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'photos'), { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'pablocolors.db');

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    scenario          TEXT NOT NULL DEFAULT 'other',
    description       TEXT,
    tags              TEXT NOT NULL DEFAULT '[]',
    sample_photo_path TEXT,
    settings          TEXT NOT NULL,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_recipes_name     ON recipes(name);
  CREATE INDEX IF NOT EXISTS idx_recipes_scenario ON recipes(scenario);
`);
