// contexts/MusicContext.js - Your simple core + advanced features
import { useContext } from "react";
import { createContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";

export const MusicContext = createContext();

const MusicContextProvider = ({ children }) => {
    const{user}=useContext(UserContext);
    // Your original simple state - keeping it exactly as you had it
    const [songs, setSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Additional state for advanced features (optional - won't break anything if not used)
    const [categories, setCategories] = useState([]);
    const [userTopCategories, setUserTopCategories] = useState([]);
    const [userTopArtists, setUserTopArtists] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
 
    const API_BASE_URL = 'http://localhost:3001/api';

    // Your original fetch functions - keeping them exactly as they were
    const fetchSongs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/songs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const songsData = await response.json();
            setSongs(songsData);
            console.log('✅ Songs fetched:', songsData.length);
        } catch (err) {
            setError(`Failed to fetch songs: ${err.message}`);
            console.error('❌ Error fetching songs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlaylists = async (userId = user?.id) => {
        try {
             const token = localStorage.getItem('token'); // get token from localStorage
    if (!token) {
      throw new Error('No auth token found');
    }
              const response = await fetch('http://localhost:3001/api/playlists', {
      headers: {
        'Authorization': `Bearer ${token}`, // IMPORTANT: send token here
        'Content-Type': 'application/json',
      },
    });
            if (!response.ok) throw new Error('Failed to fetch playlists');
            const playlistsData = await response.json();
            setPlaylists(playlistsData);
            console.log('✅ Playlists fetched:', playlistsData.length);
        } catch (err) {
            console.error('❌ Error fetching playlists:', err);
        }
    };

    const fetchArtists = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/artists`);
            if (!response.ok) throw new Error('Failed to fetch artists');
            const artistsData = await response.json();
            setArtists(artistsData);
            console.log('✅ Artists fetched:', artistsData.length);
        } catch (err) {
            console.error('❌ Error fetching artists:', err);
        }
    };

    const fetchAlbums = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/albums`);
            if (!response.ok) throw new Error('Failed to fetch albums');
            const albumsData = await response.json();
            setAlbums(albumsData);
            console.log('✅ Albums fetched:', albumsData.length);
        } catch (err) {
            console.error('❌ Error fetching albums:', err);
        }
    };

    // Your original utility functions - keeping them as they were
    const getSongById = (id) => {
        return songs.find(song => song.id === id);
    };

    const getSongByAlbumId = (id) => {
        return songs.find(song => song.album_id === id);
    };

    const getSongsByAlbumId = (id) => {
        return songs.filter(song => song.album_id === id);
    };

    const getAlbumById = (id) => {
        return albums.find(album => album.id === id);
    };

    const searchSongs = (query) => {
        return songs.filter(song => 
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase()) ||
            song.album.toLowerCase().includes(query.toLowerCase())
        );
    };

    const searchAlbums = (query) => {
        return albums.filter(album => 
            album.title.toLowerCase().includes(query.toLowerCase()) ||
            album.artist.toLowerCase().includes(query.toLowerCase())
        );
    };

    // NEW ADVANCED FEATURES - These are additions that don't break your existing code

    // Fetch categories (new feature)
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data);
            console.log('✅ Categories fetched:', data.length);
        } catch (err) {
            console.error('❌ Error fetching categories:', err);
        }
    };

    // User preferences functions (matching your backend API routes)
    const fetchUserTopCategories = async (userId = user?.id, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/user/${userId}/preferences?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch user categories');
            const data = await response.json();
            setUserTopCategories(data);
            console.log('✅ User top categories fetched:', data.length);
        } catch (err) {
            console.error('❌ Error fetching user categories:', err);
        }
    };

    const fetchUserTopArtists = async (userId = user?.id, limit = 10) => {
        try {
            // Note: You'll need to implement this route in your backend
            // For now, we'll extract from dashboard or implement separately
            const response = await fetch(`${API_BASE_URL}/artists/user/${userId}/preferences?limit=${limit}`);
            if (!response.ok) {
                console.log('Top artists endpoint not available, will get from dashboard');
                return;
            }
            const data = await response.json();
            setUserTopArtists(data);
            console.log('✅ User top artists fetched:', data.length);
        } catch (err) {
            console.error('❌ Error fetching user artists:', err);
        }
    };

    const fetchRecommendations = async (userId = user?.id, limit = 20) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/user/${userId}/recommendations?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            setRecommendations(data);
            console.log('✅ Recommendations fetched:', data.length);
        } catch (err) {
            console.error('❌ Error fetching recommendations:', err);
        }
    };

    const fetchCategorySongs = async (categoryId, userId = user?.id, limit = 50) => {
        try {
            const url = userId 
                ? `${API_BASE_URL}/categories/${categoryId}/songs?userId=${userId}&limit=${limit}`
                : `${API_BASE_URL}/categories/${categoryId}/songs?limit=${limit}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch category songs');
            const data = await response.json();
            console.log(`✅ Category ${categoryId} songs fetched:`, data.length);
            return data;
        } catch (err) {
            console.error('❌ Error fetching category songs:', err);
            return [];
        }
    };

    // Record song play (you'll need to implement this route)
    const recordSongPlay = async (songId, userId = user?.id) => {
    try {
        console.log(`Recording play for song ${songId} by user ${userId}`); // Debug log
        
        const response = await fetch(`${API_BASE_URL}/user-activity/play`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using auth
            },
            body: JSON.stringify({ 
                user_id: userId,
                song_id: songId,
                // played_at will be set by the server automatically
            })
        });

        const result = await response.json(); // Always parse JSON
        
        if (!response.ok) {
            console.error('Play record failed:', result.error || result.message);
            return { success: false, error: result.error };
        }

        console.log('✅ Song play recorded:', result);
        
        // Immediate refresh instead of setTimeout
        await Promise.all([
            fetchUserTopCategories(userId),
            fetchRecommendations(userId)
        ]);
        
        return { success: true, data: result };
        
    } catch (error) {
        console.error('❌ Error recording song play:', error);
        return { success: false, error: error.message };
    }
};
    // Calculate/recalculate user preference scores
    const calculateUserPreferences = async (userId = user?.id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/user/${userId}/calculate-preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log('✅ Preference scores calculated');
                // Refresh user data to reflect new scores
                setTimeout(() => {
                    fetchUserTopCategories(userId);
                    fetchRecommendations(userId);
                }, 500);
            }
        } catch (error) {
            console.error('❌ Error calculating preferences:', error);
        }
    };

    const playWithId = async (songId) => {
        // Record the play for analytics
        await recordSongPlay(songId);
        
        // Your existing play logic here...
        console.log(`🎵 Playing song ${songId}`);
        
        // Return the song data in case you need it
        return getSongById(songId);
    };

    // Bulk user dashboard fetch (using your existing dashboard route)
    const fetchUserDashboard = async (userId = user?.id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/user/${userId}/dashboard`);
            if (!response.ok) throw new Error('Failed to fetch dashboard');
            const data = await response.json();
            
            setUserTopCategories(data.topCategories || []);
            setUserTopArtists(data.topArtists || []);
            setRecommendations(data.recommendations || []);
            setRecentlyPlayed(data.recentlyPlayed || []);
            
            console.log('✅ User dashboard data fetched');
            return data;
        } catch (err) {
            console.error('❌ Error fetching dashboard:', err);
        }
    };

    // Helper function for categories
    const getCategoryById = (id) => {
        return categories.find(category => category.id === id);
    };

    // Your original debug logging - keeping it exactly as you had it
    useEffect(() => {
        console.log('🎨 Artists state updated:', artists);
    }, [artists]);

    useEffect(() => {
        console.log('💿 Albums state updated:', albums);
    }, [albums]);

    // Your original initialization - enhanced but keeping the same structure
    useEffect(() => {
        console.log('🚀 MusicContext initializing...');
        
        // Your original basic data fetching
        fetchSongs();
        fetchPlaylists();
        fetchArtists();
        fetchAlbums();
        
        // New optional features - these won't break anything if backend doesn't support them
        fetchCategories();
       
        
        // Fetch user-specific data if user is set (optional)
        if (user?.id) {
            fetchUserDashboard();
        }
    }, [user?.id]);

    // Your original context value - expanded but keeping all your original functions
    const contextValue = {
        // Your original state
        songs,
        artists,
        albums,
        playlists,
        setSongs,
        setPlaylists,
        setAlbums,
        loading,
        error,
        
        // Your original functions
        fetchSongs,
        fetchPlaylists,
        fetchArtists,
        fetchAlbums,
        getSongById,
        getSongByAlbumId,
        getSongsByAlbumId,
        getAlbumById,
        searchSongs,
        searchAlbums,
        
        // NEW FEATURES (optional - use them when you're ready)
        categories,
        userTopCategories,
        userTopArtists,
        recommendations,
        recentlyPlayed,
       
        
        // New functions (matching your PostgreSQL schema)
        fetchCategories,
        fetchUserTopCategories,
        fetchUserTopArtists,
        fetchRecommendations,
        fetchCategorySongs,
        recordSongPlay,
        calculateUserPreferences, // New function for recalculating scores
        playWithId,
        fetchUserDashboard,
        getCategoryById,
        
    };

    return (
        <MusicContext.Provider value={contextValue}>
            {children}
        </MusicContext.Provider>
    );
};

export default MusicContextProvider;