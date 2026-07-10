import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/connection.js';
import { initDB } from './db/init.js';
import { verifyToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173'),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the Vite build
const clientPath = path.join(__dirname, '../dist');
app.use(express.static(clientPath));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'connected' }));

// Register (email)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, provider, verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, provider, avatar',
      [name, email, hash, 'email', true]
    );
    const user = result.rows[0];

    // Create income row
    await pool.query('INSERT INTO income (user_id, amount) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, 0]);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, provider: user.provider, avatar: user.avatar } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login (email)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (!user.password) return res.status(401).json({ error: 'Use social login' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, provider: user.provider, avatar: user.avatar } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Social login simulation (Google / GitHub)
app.post('/api/auth/social', async (req, res) => {
  try {
    const { provider, name, email, avatar } = req.body;
    if (!provider || !email) return res.status(400).json({ error: 'Invalid request' });

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const result = await pool.query(
        'INSERT INTO users (name, email, password, provider, avatar, verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, provider, avatar',
        [name || 'User', email, null, provider, avatar || null, true]
      );
      user = result.rows[0];
      await pool.query('INSERT INTO income (user_id, amount) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, 0]);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, provider: user.provider, avatar: user.avatar } });
  } catch (e) {
    console.error('Social auth error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, provider, avatar FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Expenses
app.get('/api/expenses', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [req.user.id]);
    res.json({ expenses: result.rows });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    if (!title || !amount || !category || !date) return res.status(400).json({ error: 'Missing fields' });
    const result = await pool.query(
      'INSERT INTO expenses (user_id, title, amount, category, date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, amount, category, date, notes || '']
    );
    res.json({ expense: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/expenses/:id', verifyToken, async (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET title=$1, amount=$2, category=$3, date=$4, notes=$5 WHERE id=$6 AND user_id=$7 RETURNING *',
      [title, amount, category, date, notes || '', req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ expense: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Income
app.get('/api/income', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT amount FROM income WHERE user_id = $1', [req.user.id]);
    const amount = result.rows.length > 0 ? result.rows[0].amount : 0;
    res.json({ amount });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/income', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    await pool.query(
      'INSERT INTO income (user_id, amount) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP',
      [req.user.id, amount]
    );
    res.json({ amount });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the React app for all other routes (SPA routing)
// Serve React app for all other routes (SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

async function start() {
  await initDB();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

async function start() {
  await initDB();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
