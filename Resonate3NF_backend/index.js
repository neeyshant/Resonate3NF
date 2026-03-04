const express = require('express');
const cors = require('cors');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const songsRoute = require('./routes/songs');
const { router: authRoutes } = require('./routes/auth');
const artistsRoute = require('./routes/artists'); 
const albumsRoute = require('./routes/albums');
const playlistsRoute= require('./routes/playlists');
const categoriesRoute= require('./routes/categories')
const categorySongsRouter = require('./routes/category_songs');
const userActivityRoute = require('./routes/userActivity');
const artistPreferencesRoute = require('./routes/artistPreferences');



const app = express();
app.use(cors());
app.use(express.json());
console.log('JWT Secret:', JWT_SECRET);


// Routes
app.use('/api/songs', songsRoute);
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistsRoute);
app.use('/api/albums', albumsRoute);
app.use('/api/playlists', playlistsRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/category_songs', categorySongsRouter);
app.use('/api/user-activity', userActivityRoute);
app.use('/api/artists', artistPreferencesRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
