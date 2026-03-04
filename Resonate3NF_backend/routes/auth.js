const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabaseClient'); // your supabase client instance
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'; // ideally from .env

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No auth header');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT verify error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function isAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    console.log('User role:', req.user.role);
    if (req.user.role !== 'admin') {
      console.log('User is not admin');
      return res.status(403).json({ error: 'Admin only' });
    }
    next();
  });
}



// POST /api/auth/register — Register new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email, and password are required' });

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, password_hash, role: 'user' }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: data.id, username: data.username, email: data.email, role: data.role },
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login — Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log(token);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — Logout (for JWT, this is client-side; optionally blacklist token server-side)
router.post('/logout', (req, res) => {
  // For stateless JWT, logout is handled client-side by deleting the token.
  // Implement token blacklist if needed.
  res.json({ message: 'Logout successful (delete token client-side)' });
});

// GET /api/auth/me — Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/users/:id — Get user profile (optional, protected)
router.get('/users/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const { data, error } = await supabase.from('users').select('id, username, email, role').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id — Update user info/profile (optional, protected)
// Only user himself or admin can update
router.put('/users/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, email, password } = req.body;

  if (!id) return res.status(400).json({ error: 'Invalid user ID' });

  // Allow only the user or admin to update
  if (req.user.id !== id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: 'Nothing to update' });

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      message: 'User updated successfully',
      user: { id: data.id, username: data.username, email: data.email, role: data.role },
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, isAdmin, authenticateToken };
