const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Middleware to verify JWT and attach user info
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info for downstream handlers
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Helper to check ownership of playlist
async function isOwner(req, res, next) {
  const playlistId = req.params.id;
  const userId = req.user.id;

  try {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (error || !playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.user_id !== userId) return res.status(403).json({ error: 'Forbidden: not owner' });

    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET all playlists (optional: public or user-specific)
// You can add query params to filter by user_id, is_public, etc.
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;  // <-- Correct way to get user ID

    // fetch playlists owned by user 
   const { data, error } = await supabase
  .from('playlists')
  .select('*')
  .eq('user_id', userId);
  

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET playlist details by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Playlist not found' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create playlist (user only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    const user_id = req.user.id;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { data, error } = await supabase
      .from('playlists')
      .insert([{ name, description, is_public: !!is_public, user_id }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update playlist (owner only)
router.put('/:id', authenticate, isOwner, async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, is_public } = req.body;

    const { data, error } = await supabase
      .from('playlists')
      .update({ name, description, is_public })
      .eq('id', id)
      .select();

    if (error) return res.status(404).json({ error: 'Playlist not found or update failed' });
    res.json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE playlist (owner only)
router.delete('/:id', authenticate, isOwner, async (req, res) => {
  try {
    const id = req.params.id;

    const { error } = await supabase.from('playlists').delete().eq('id', id);

    if (error) return res.status(404).json({ error: 'Playlist not found or delete failed' });

    res.json({ message: 'Playlist deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add song to playlist (owner only)
router.post('/:id/songs', authenticate, isOwner, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { song_id } = req.body;

    if (!song_id) return res.status(400).json({ error: 'song_id is required' });

    // Insert into join table (playlist_songs)
    const { data, error } = await supabase
      .from('playlist_songs')
      .insert([{ playlist_id: playlistId, song_id }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE remove song from playlist (owner only)
router.delete('/:id/songs/:songId', authenticate, isOwner, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const songId = req.params.songId;

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) return res.status(404).json({ error: 'Song not found in playlist or delete failed' });

    res.json({ message: 'Song removed from playlist' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
