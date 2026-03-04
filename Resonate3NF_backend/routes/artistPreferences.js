const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');

// GET /api/artists/user/:userId/preferences
router.get('/user/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase.rpc('get_user_top_artists', {
      target_user_id: parseInt(userId),
      limit_count: parseInt(limit)
    });

    if (error) {
      // Fallback implementation
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_preferences')
        .select(`
          preference_key,
          preference_score,
          total_plays,
          last_played,
          artists!inner (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId)
        .eq('preference_type', 'artist')
        .order('preference_score', { ascending: false })
        .order('total_plays', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return res.status(500).json({ error: fallbackError.message });
      }

      const formattedData = fallbackData.map(item => ({
        artist_id: parseInt(item.preference_key),
        artist_name: item.artists.name,
        artist_image_url: item.artists.image_url,
        preference_score: item.preference_score,
        total_plays: item.total_plays,
        last_played: item.last_played
      }));

      return res.json(formattedData);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user top artists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;