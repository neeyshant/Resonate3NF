const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');
const { isAdmin } = require('./auth'); // adjust path if needed

// GET all albums
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('albums').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET album by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from('albums').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Album not found' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add new album (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, artist_id, release_date, cover_url,category_id } = req.body;
    const categoryIdInt = category_id ? parseInt(category_id, 10) : null;
    

    if (!title || !artist_id) {
      return res.status(400).json({ error: 'Title and artist_id are required' });
    }

    // Check if album already exists for same artist and title
    const { data: existingAlbum, error: fetchError } = await supabase
      .from('albums')
      .select('id')
      .eq('title', title)
      .eq('artist_id', artist_id)
      .limit(1);

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (existingAlbum.length > 0) return res.status(409).json({ error: 'Album already exists' });

    const { data, error } = await supabase
      .from('albums')
      .insert([{ title, artist_id, release_date, cover_url, category_id:categoryIdInt }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(500).json({ error: 'Failed to create album' });

    res.status(201).json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update album (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, artist_id, release_date, cover_url, category_id } = req.body;

    // Convert category_id to an integer or null
    
    const categoryIdInt = category_id ? parseInt(category_id, 10) : null;

    const { data, error } = await supabase
      .from('albums')
      .update({
        title,
        artist_id,
        release_date,
        cover_url,
        category_id: categoryIdInt
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(404).json({ error: 'Album not found or update failed' });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE album (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    const { error } = await supabase.from('albums').delete().eq('id', id);

    if (error) return res.status(404).json({ error: 'Album not found or delete failed' });

    res.json({ message: 'Album deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
