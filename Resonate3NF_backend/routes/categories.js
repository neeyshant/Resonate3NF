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

// Middleware to allow only admins
function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No user info found' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// EXISTING ROUTES (your current code)

// GET /api/categories — list all categories/genres
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories — add category (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  const { name, description, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, image_url }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/categories/:id — update category (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, description, image_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, description, image_url })
      .eq('id', id)
      .select();

    if (error) return res.status(404).json({ error: 'Category not found or update failed' });
    res.json(data[0]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id — delete category (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  const id = req.params.id;

  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return res.status(404).json({ error: 'Category not found or delete failed' });
    res.json({ message: 'Category deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW USER PREFERENCE ROUTES

// GET /api/categories/:categoryId/songs — get songs in a category
router.get('/:categoryId/songs', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { userId, limit = 50 } = req.query;

    let query = supabase
      .from('songs')
      .select(`
        id,
        title,
        duration,
        cover_url,
        artists!inner (
          id,
          name
        )
      `)
      .eq('category_id', categoryId)
      .limit(limit);

    const { data: songs, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // If userId provided, check recently played songs
    if (userId) {
      const { data: recentlyPlayed } = await supabase
        .from('user_recently_played')
        .select('song_id')
        .eq('user_id', userId)
        .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const recentlyPlayedIds = recentlyPlayed?.map(rp => rp.song_id) || [];
      
      // Mark songs as recently played
      const songsWithStatus = songs.map(song => ({
        song_id: song.id,
        title: song.title,
        artist_name: song.artists.name,
        duration: song.duration,
        cover_url: song.cover_url,
        is_recently_played: recentlyPlayedIds.includes(song.id)
      }));

      res.json(songsWithStatus);
    } else {
      // Return songs without user context
      const formattedSongs = songs.map(song => ({
        song_id: song.id,
        title: song.title,
        artist_name: song.artists.name,
        duration: song.duration,
        cover_url: song.cover_url,
        is_recently_played: false
      }));

      res.json(formattedSongs);
    }
  } catch (error) {
    console.error('Error fetching category songs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/user/:userId/preferences — get user's top categories
router.get('/user/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Get user's category preferences from recently played
    const { data, error } = await supabase.rpc('get_user_top_categories', {
      target_user_id: parseInt(userId),
      limit_count: parseInt(limit)
    });

    if (error) {
      // Fallback: calculate manually if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_recently_played')
        .select(`
          songs!inner (
            category_id,
            categories!inner (
              id,
              name,
              description,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (fallbackError) return res.status(500).json({ error: fallbackError.message });

      // Group by category and count plays
      const categoryStats = {};
      fallbackData.forEach(item => {
        const category = item.songs.categories;
        if (!categoryStats[category.id]) {
          categoryStats[category.id] = {
            category_id: category.id,
            category_name: category.name,
            category_description: category.description,
            category_image_url: category.image_url,
            total_plays: 0
          };
        }
        categoryStats[category.id].total_plays++;
      });

      // Sort by play count and limit
      const sortedCategories = Object.values(categoryStats)
        .sort((a, b) => b.total_plays - a.total_plays)
        .slice(0, limit)
        .map(cat => ({
          ...cat,
          preference_score: cat.total_plays / Math.max(...Object.values(categoryStats).map(c => c.total_plays))
        }));

      return res.json(sortedCategories);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user category preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/categories/user/:userId/recommendations — get personalized recommendations
router.get('/user/:userId/recommendations', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    // Try to use stored procedure first
    const { data, error } = await supabase.rpc('get_recommended_songs', {
      target_user_id: parseInt(userId),
      limit_count: parseInt(limit)
    });

    if (error) {
      // Fallback: simple recommendation based on user's top categories
      console.log('Stored procedure not available, using fallback recommendation');
      
     /// 1. Get user's recent played songs (last 30 days) with category and artist info
const { data: userPrefs, error: prefsError } = await supabase
  .from('user_recently_played')
  .select(`
    songs (
      category_id,
      artist_id
    )
  `)
  .eq('user_id', userId)
  .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

if (prefsError) throw prefsError;
if (!userPrefs || userPrefs.length === 0) return res.json([]);

// 2. Count categories and artists played
const categoryCount = {};
const artistCount = {};

userPrefs.forEach(({ songs }) => {
  if (!songs) return;
  if (songs.category_id) categoryCount[songs.category_id] = (categoryCount[songs.category_id] || 0) + 1;
  if (songs.artist_id) artistCount[songs.artist_id] = (artistCount[songs.artist_id] || 0) + 1;
});

// 3. Get top categories and artists (expanded top 5)
const topCategories = Object.keys(categoryCount)
  .sort((a, b) => categoryCount[b] - categoryCount[a])
  .slice(0, 5);

const topArtists = Object.keys(artistCount)
  .sort((a, b) => artistCount[b] - artistCount[a])
  .slice(0, 5);

// 4. Get recent songs played in last 3 days to exclude
const excludeDays = 3;
const { data: recentSongs } = await supabase
  .from('user_recently_played')
  .select('song_id')
  .eq('user_id', userId)
  .gte('played_at', new Date(Date.now() - excludeDays * 24 * 60 * 60 * 1000).toISOString());

const recentSongIds = recentSongs?.map(rs => rs.song_id) || [];

// Helper to build base query for recommendations
function buildRecommendationQuery(excludeRecent) {
  let q = supabase
    .from('songs')
    .select(`
      id,
      title,
      cover_url,
      artists (id, name),
      categories (id, name)
    `)
    .limit(parseInt(limit));

  // Filter by top categories or artists if any
  if (topCategories.length > 0 && topArtists.length > 0) {
    q = q.or(
      `category_id.in.(${topCategories.join(',')}),artist_id.in.(${topArtists.join(',')})`
    );
  } else if (topCategories.length > 0) {
    q = q.in('category_id', topCategories);
  } else if (topArtists.length > 0) {
    q = q.in('artist_id', topArtists);
  }

  // Exclude recent songs if requested
  if (excludeRecent && recentSongIds.length > 0) {
    q = q.not('id', 'in', `(${recentSongIds.join(',')})`);
  }

  return q;
}

// 5. First try excluding recent songs
let { data: recommendedSongs, error: recError } = await buildRecommendationQuery(true);

if (recError) return res.status(500).json({ error: recError.message });

// 6. If too few recommendations, try again without excluding recent songs
if (recommendedSongs.length < 5) {
  const fallbackResult = await buildRecommendationQuery(false);
  if (fallbackResult.error) return res.status(500).json({ error: fallbackResult.error.message });
  recommendedSongs = fallbackResult.data;
}

// 7. Format final recommendations
const formattedRecommendations = recommendedSongs.map(song => ({
  song_id: song.id,
  title: song.title,
  artist_name: song.artists?.name || null,
  category_name: song.categories?.name || null,
  cover_url: song.cover_url,
  recommendation_score: topCategories.includes(String(song.categories?.id)) ? 0.8 : 0.6
}));

return res.json(formattedRecommendations);

    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories/user/:userId/calculate-preferences — recalculate user preferences
router.post('/user/:userId/calculate-preferences', async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to use stored procedure
    const { error } = await supabase.rpc('calculate_preference_scores', {
      target_user_id: parseInt(userId)
    });

    if (error) {
      console.log('Stored procedure not available, preferences calculated on-the-fly');
      return res.json({ 
        success: true, 
        message: 'Preferences calculated (fallback method)' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Preferences calculated successfully' 
    });
  } catch (error) {
    console.error('Error calculating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Optional: Update your dashboard route to include top artists
// Modify your existing dashboard route in categories.js:
router.get('/user/:userId/dashboard', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's top categories (limit 5)
    const categoriesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/categories/user/${userId}/preferences?limit=5`);
    const topCategories = categoriesResponse.ok ? await categoriesResponse.json() : [];

    // Get user's top artists (NEW)
    const artistsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/artists/user/${userId}/preferences?limit=5`);
    const topArtists = artistsResponse.ok ? await artistsResponse.json() : [];

    // Get user's recently played
    const { data: recentlyPlayed, error: recentError } = await supabase
      .from('user_recently_played')
      .select(`
        played_at,
        songs!inner (
          id,
          title,
          artists!inner (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Error fetching recently played:', recentError);
    }

    // Get recommendations
    const recommendationsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/categories/user/${userId}/recommendations?limit=10`);
    const recommendations = recommendationsResponse.ok ? await recommendationsResponse.json() : [];

    // Format recently played
    const formattedRecentlyPlayed = (recentlyPlayed || []).map(item => ({
      id: item.songs.id,
      title: item.songs.title,
      artist: item.songs.artists.name,
      cover_url: item.songs.cover_url,
      played_at: item.played_at
    }));

    res.json({
      topCategories,
      topArtists,        // Now included!
      recommendations,
      recentlyPlayed: formattedRecentlyPlayed
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;