import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import ConnectSQLite3 from 'connect-sqlite3';
import path from 'path';
import fs from 'fs';
import { requireAuth, verifyCredentials } from './auth';
import recipesRouter from './routes/recipes';
import tagsRouter from './routes/tags';

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR ?? './data';

fs.mkdirSync(DATA_DIR, { recursive: true });

const SQLiteStore = ConnectSQLite3(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR }) as session.Store,
  secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Auth routes (no requireAuth)
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' });
    return;
  }

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.session.userId = username;

  if (!rememberMe) {
    req.session.cookie.maxAge = undefined; // session cookie
  }

  res.json({ username });
});

app.post('/api/v1/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  res.json({ username: req.session.userId });
});

// Debug logging endpoint
app.post('/api/v1/debug/log', (req, res) => {
  console.log('[CLIENT DEBUG]', JSON.stringify(req.body, null, 2));
  try {
    fs.writeFileSync(
      path.join(__dirname, '../../debug_preset.json'),
      JSON.stringify(req.body, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Failed to write debug_preset.json', err);
  }
  res.json({ ok: true });
});

// Protected API routes
app.use('/api/v1/recipes', requireAuth, recipesRouter);
app.use('/api/v1/tags', requireAuth, tagsRouter);

// Serve uploaded photos
app.use('/photos', requireAuth, express.static(path.join(DATA_DIR, 'photos')));

// Serve Vue SPA (static build)
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`PabloColors running on http://localhost:${PORT}`);
});
