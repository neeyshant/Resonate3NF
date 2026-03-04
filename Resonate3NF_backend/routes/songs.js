const express = require('express');
const router = express.Router();
const supabase = require('../db/supabaseClient');
const { isAdmin } = require('./auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mm = require('music-metadata');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Multer config for temp storage
const upload = multer({ dest: 'uploads/' });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/songs
 * Fetch all songs
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('songs').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch songs:', err);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

/**
 * Upload album cover image
 * Endpoint: POST /upload-image
 * Input: FormData with 'image' file
 * Output: { cloudinaryUrl }
 */
router.post('/upload-image', isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const cloudRes = await cloudinary.uploader.upload(req.file.path, {
      folder: 'album_covers',
      overwrite: true,
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    res.json({ cloudinaryUrl: cloudRes.secure_url });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Upload song audio + metadata extraction + DB insert
 * Endpoint: POST /upload
 * Input: FormData with 'songFile' file + fields title, album_id, artist_id, genre (optional)
 * Output: { song }
 */
router.post('/upload', isAdmin, upload.single('songFile'), async (req, res) => {
  try {
    const { title, album_id, artist_id, category_id } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Song file is required' });
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const filePath = req.file.path;

    // Upload to Cloudinary as 'video' resource type
    const cloudRes = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'songs',
      public_id: path.parse(req.file.originalname).name + '-' + Date.now(),
      overwrite: true,
    });

    // Extract duration using music-metadata
    const metadata = await mm.parseFile(filePath);
    const durationSeconds = metadata.format.duration;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
 

    // Remove local file
    fs.unlinkSync(filePath);

    // Insert song record
    const { data, error } = await supabase
      .from('songs')
      .insert([{
        title,
        album_id: album_id ? parseInt(album_id) : null,
        artist_id: artist_id ? parseInt(artist_id) : null,
        duration: durationStr,
        song_url: cloudRes.secure_url,
        cloudinary_id: cloudRes.public_id,
        category_id: category_id ? parseInt(category_id) : null,
      }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ success: true, song: data[0] });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload and save song' });
  }
});

/**
 * Create new album
 * Endpoint: POST /albums
 * Input: JSON with { name, artist_id, release_date, cover_url }
 * Output: created album object
 */
router.post('/albums', isAdmin, async (req, res) => {
  try {
    const { name, artist_id, release_date, cover_url } = req.body;

    if (!name || !artist_id || !cover_url) {
      return res.status(400).json({ error: 'Name, artist_id, and cover_url are required' });
    }

    const { data, error } = await supabase
      .from('albums')
      .insert([{ name, artist_id: parseInt(artist_id), release_date, cover_url }])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Album creation failed:', err);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

/**
 * Fetch albums list
 * Endpoint: GET /albums
 */
router.get('/albums', async (req, res) => {
  try {
    const { data, error } = await supabase.from('albums').select('*').order('release_date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

module.exports = router;