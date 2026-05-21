import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { Recipe } from '../types';

const router = Router();

const DATA_DIR = process.env.DATA_DIR ?? './data';
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

function rowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    name: row.name as string,
    scenario: row.scenario as Recipe['scenario'],
    description: (row.description as string | null) ?? undefined,
    tags: JSON.parse(row.tags as string),
    samplePhotoPath: (row.sample_photo_path as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    settings: JSON.parse(row.settings as string),
  };
}

router.get('/', (req: Request, res: Response) => {
  const { scenario, tag, search } = req.query;

  let sql = 'SELECT * FROM recipes WHERE 1=1';
  const params: unknown[] = [];

  if (scenario) {
    sql += ' AND scenario = ?';
    params.push(scenario);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += ' ORDER BY updated_at DESC';

  let rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

  if (tag) {
    rows = rows.filter(r => {
      const tags: string[] = JSON.parse(r.tags as string);
      return tags.includes(tag as string);
    });
  }

  res.json(rows.map(rowToRecipe));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(rowToRecipe(row));
});

router.post('/', (req: Request, res: Response) => {
  const { name, scenario, description, tags, settings } = req.body;

  if (!name || !scenario || !settings) {
    res.status(400).json({ error: 'name, scenario, and settings are required' });
    return;
  }

  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO recipes (id, name, scenario, description, tags, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, scenario, description ?? null, JSON.stringify(tags ?? []), JSON.stringify(settings), now, now);

  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Record<string, unknown>;
  res.status(201).json(rowToRecipe(row));
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const { name, scenario, description, tags, settings } = req.body;

  if (!name || !scenario || !settings) {
    res.status(400).json({ error: 'name, scenario, and settings are required' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE recipes SET name = ?, scenario = ?, description = ?, tags = ?, settings = ?, updated_at = ?
    WHERE id = ?
  `).run(name, scenario, description ?? null, JSON.stringify(tags ?? []), JSON.stringify(settings), now, req.params.id);

  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToRecipe(row));
});

router.delete('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }

  if (row.sample_photo_path) {
    const photoPath = path.join(DATA_DIR, row.sample_photo_path as string);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

router.post('/:id/photo', upload.single('photo'), (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  if (row.sample_photo_path) {
    const oldPath = path.join(DATA_DIR, row.sample_photo_path as string);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const relativePath = `photos/${req.file.filename}`;
  db.prepare('UPDATE recipes SET sample_photo_path = ?, updated_at = ? WHERE id = ?')
    .run(relativePath, new Date().toISOString(), req.params.id);

  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToRecipe(updated));
});

router.delete('/:id/photo', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }

  if (row.sample_photo_path) {
    const photoPath = path.join(DATA_DIR, row.sample_photo_path as string);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  db.prepare('UPDATE recipes SET sample_photo_path = NULL, updated_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);

  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id) as Record<string, unknown>;
  res.json(rowToRecipe(updated));
});

export default router;
