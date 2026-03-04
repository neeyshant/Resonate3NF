const express = require('express');
const supabase = require('../db/supabaseClient');
const router = express.Router();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/artists - list all artists
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('artists').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/artists/:id - get artist by id
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase.from('artists').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Artist not found' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/artists - add new artist (admin only)
router.post('/', isAdmin, async (req, res) => {
  const { name, bio, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const { data, error } = await supabase.from('artists').insert([{ name, bio, image_url }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/artists/:id - update artist (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, bio, image_url } = req.body;

  try {
    const { data, error } = await supabase.from('artists').update({ name, bio, image_url }).eq('id', id).select();
    if (error || !data.length) return res.status(404).json({ error: 'Artist not found or update failed' });
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/artists/:id - delete artist (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const { data, error } = await supabase.from('artists').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: 'Artist not found' });
    res.json({ message: 'Artist deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
