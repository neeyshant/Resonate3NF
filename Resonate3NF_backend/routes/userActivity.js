const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');

// POST /api/user-activity/play
router.post('/play', async (req, res) => {
  try {
    const { user_id, song_id, played_at } = req.body;
    
    if (!user_id || !song_id) {
      return res.status(400).json({ error: 'user_id and song_id are required' });
    }

    const { data, error } = await supabase
      .from('user_recently_played')
      .insert([{
        user_id: parseInt(user_id),
        song_id: parseInt(song_id),
        played_at: played_at || new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error recording song play:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      success: true, 
      message: 'Song play recorded successfully',
      data: data[0] 
    });
  } catch (error) {
    console.error('Error in play recording route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;