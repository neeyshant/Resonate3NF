const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');
const { authenticateToken, isAdmin } = require('../routes/auth');

// GET all category-song links (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('category_songs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create a category-song link (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { song_id, category_id } = req.body;

  if (!song_id || !category_id) {
    return res.status(400).json({ error: 'song_id and category_id are required' });
  }
  const categoryIdInt = parseInt(category_id, 10);

  try {
    const { data, error } = await supabase
      .from('category_songs')
      .insert([{ song_id, category_id: categoryIdInt }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE category-song link by id (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const { error } = await supabase.from('category_songs').delete().eq('id', id);
    if (error) return res.status(404).json({ error: 'Not found or delete failed' });
    res.json({ message: 'Category-song link deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
