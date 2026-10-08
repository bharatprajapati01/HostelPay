import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const { PORT = 5000, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN = 'http://localhost:5173' } = process.env;

if (!JWT_SECRET || (!MONGODB_URI && process.env.NODE_ENV !== 'test')) {
  console.error('Missing MONGODB_URI or JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// ─── Model ───────────────────────────────────────────────
// One document per user. `data` is the app's full snapshot (accounts, transactions, ...).
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    usernameKey: { type: String, required: true, unique: true }, // lowercase, for case-insensitive lookup
    passwordHash: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false }
);
const User = mongoose.model('User', userSchema);

const DATA_KEYS = ['accounts', 'transactions', 'categories', 'cashWallet', 'savingsGoals', 'savingsTransfers'];

// ─── App ─────────────────────────────────────────────────
// The user model is passed in so tests can swap in an in-memory stand-in.
export function createApp(User) {
const app = express();
const origins = CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

const signToken = (user) => jwt.sign({ sub: String(user._id), u: user.username }, JWT_SECRET, { expiresIn: '30d' });

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long.' });

  const usernameKey = username.toLowerCase();
  if (await User.exists({ usernameKey })) {
    return res.status(409).json({ error: 'Username already exists. Choose a different one.' });
  }
  try {
    const user = await User.create({ username, usernameKey, passwordHash: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), username: user.username });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Username already exists. Choose a different one.' });
    console.error(err);
    res.status(500).json({ error: 'Could not create the account. Try again.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const usernameKey = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = await User.findOne({ usernameKey });
  if (!user) return res.status(404).json({ error: 'User not found. Try creating an account!' });
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }
  res.json({ token: signToken(user), username: user.username });
});

app.get('/api/data', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('data');
  if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' });
  res.json({ data: user.data });
});

app.put('/api/data', requireAuth, async (req, res) => {
  const body = req.body?.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid data.' });
  }
  const data = {};
  for (const key of DATA_KEYS) if (body[key] !== undefined) data[key] = body[key];
  // Merge into what is stored, so a partial upload can never wipe other collections
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' });
  user.data = { ...(user.data || {}), ...data };
  user.markModified('data');
  await user.save();
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

return app;
}

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI)
    .then(() => createApp(User).listen(PORT, () => console.log(`HostelPay API listening on :${PORT}`)))
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}
