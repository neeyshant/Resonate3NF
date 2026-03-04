import React, { useState, useEffect } from 'react';

export default function AdminPanel({ token, user, onLogout, onNavigate }) {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [message, setMessage] = useState('');

  // Album form state
  const [albumName, setAlbumName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistImageUrl, setArtistImageUrl] = useState('');
  const [useExistingArtist, setUseExistingArtist] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingSongs, setUploadingSongs] = useState(false);
  const [genres, setGenres] = useState([]);
  const [genreID, setGenreID]=useState('');
 

  useEffect(() => {
    async function fetchGenres() {
      try {
        const res = await fetch('http://localhost:3001/api/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch genres');
        const data = await res.json();
        // Extract just the names into genres array
        setGenres(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchGenres();
  }, [token]);



  // Songs state: array of { title, duration, file }
  const [songs, setSongs] = useState([]);

  const API_BASE = 'http://localhost:3001/api';

  // Use passed user/token or fallback to localStorage
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const currentToken = token || localStorage.getItem('token');
  
  // Helper function to get artist name by ID
  const getArtistName = (artistId) => {
    const artist = artists.find(a => a.id === artistId);
    return artist ? artist.name : `Artist ID: ${artistId}`;
  };

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // Token expiry check and message
  useEffect(() => {
    if (currentToken) {
      const decoded = parseJwt(currentToken);
      if (!decoded) {
        setMessage('Invalid token format.');
        return;
      }
      const expDate = new Date(decoded.exp * 1000);
      if (expDate < new Date()) {
        setMessage('Token expired. Please login again.');
      } else {
        setMessage('');
      }
    } else {
      setMessage('No token found. Please login.');
    }
  }, [currentToken]);

  // Check user and role
  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setMessage('Please login to access admin panel.');
      return;
    }
    if (currentUser.role !== 'admin') {
      setMessage('Access denied. Admin privileges required.');
    }
  }, [currentUser]);

  // Fetch albums and artists on mount
  useEffect(() => {
    if (!currentToken) {
      setMessage('Please login to view albums and artists.');
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/albums`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      }).then(res => res.json()),
      fetch(`${API_BASE}/artists`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      }).then(res => res.json())
    ])
      .then(([albumsData, artistsData]) => {
        setAlbums(albumsData);
        setArtists(artistsData);
      })
      .catch(() => setMessage('Failed to fetch albums or artists'));
  }, [currentToken]);

  // Audio duration helper
  const getAudioDuration = (file) =>
    new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const durationSec = audio.duration;
        const minutes = Math.floor(durationSec / 60);
        const seconds = Math.floor(durationSec % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      audio.onerror = () => resolve('0:00');
      audio.src = URL.createObjectURL(file);
    });

  // Cover upload handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentToken) {
      setMessage('Please login before uploading cover.');
      return;
    }

    setUploadingCover(true);
    setMessage('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/songs/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setCoverUrl(data.cloudinaryUrl);
        setCoverFile(file);
        setMessage('Cover image uploaded!');
      } else {
        setMessage(data.error || 'Upload failed');
        setCoverUrl('');
        setCoverFile(null);
      }
    } catch {
      setMessage('Server error during image upload.');
      setCoverUrl('');
      setCoverFile(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    else window.location.href = '/';
  };

  const goToHome = () => {
    if (onNavigate) onNavigate('/');
    else window.location.href = '/';
  };

  const goToLogin = () => {
    if (onNavigate) onNavigate('/login');
    else window.location.href = '/login';
  };

  const testToken = async () => {
    if (!currentToken) {
      setMessage('No token available');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/artists`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Token is valid! ✅');
      } else {
        setMessage(`Token test failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setMessage(`Token test error: ${err.message}`);
      console.error('Token test error:', err);
    }
  };

  const addSongInput = () => {
    setSongs(prev => [...prev, { title: '', duration: '', file: null }]);
  };

  const handleSongChange = async (index, field, value) => {
    const updated = [...songs];
    updated[index][field] = value;

    if (field === 'file' && value) {
      const duration = await getAudioDuration(value);
      updated[index].duration = duration;
    }

    setSongs(updated);
  };

  const isFormValid = () => {
    if (!albumName.trim() || !coverUrl) return false;
    if (useExistingArtist && !selectedArtistId) return false;
    if (!useExistingArtist && !artistName.trim()) return false;
    if (songs.length === 0) return false;
    for (let song of songs) {
      if (!song.title.trim() || !song.file) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!currentToken) {
      setMessage('Please login to upload.');
      return;
    }

    if (!isFormValid()) {
      setMessage('Please fill all required fields: album name, artist info, cover image, and at least one song.');
      return;
    }

    setUploadingSongs(true);

    try {
      let finalArtistId;

      if (useExistingArtist) {
        finalArtistId = parseInt(selectedArtistId, 10);
      } else {
        // Validate token by calling artists endpoint
        const tokenTestRes = await fetch(`${API_BASE}/artists`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!tokenTestRes.ok) {
          setMessage('Token validation failed. Please login again.');
          setUploadingSongs(false);
          return;
        }

        // Create new artist
        const artistRes = await fetch(`${API_BASE}/artists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            name: artistName,
            bio: artistBio || null,
            image_url: artistImageUrl || null,
          }),
        });

        const artistData = await artistRes.json();

        if (!artistRes.ok) {
          setMessage(artistData.error || artistData.message || 'Error creating artist');
          setUploadingSongs(false);
          return;
        }

        finalArtistId = artistData.id;
        setMessage('Artist created successfully!');
      }

      // Create album (NOTE: use 'name' key, NOT 'title')
      const albumRes = await fetch(`${API_BASE}/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          title: albumName,
          artist_id: finalArtistId || null,
          release_date: releaseDate || null,
          cover_url: coverUrl,
          category_id: genreID ? parseInt(genreID, 10) : null
        }),
      });
      

      const albumData = await albumRes.json();

      if (!albumRes.ok) {
        setMessage(albumData.error || 'Error creating album');
        setUploadingSongs(false);
        return;
      }

      const albumId = albumData.id;

      // Upload songs sequentially
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const songFormData = new FormData();
        songFormData.append('songFile', song.file);
        songFormData.append('title', song.title);
        songFormData.append('album_id', albumId);
        songFormData.append('artist_id', finalArtistId);
        songFormData.append('category_id', genreID);

        const uploadRes = await fetch(`${API_BASE}/songs/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
          body: songFormData,
        });
        if (!uploadRes.ok) {
        const errorData = await uploadRes.json();  // parse error details
        setMessage(`Error uploading song "${song.title}": ${errorData.error || 'unknown error'}`);
        setUploadingSongs(false);
        return;
        }

        const uploadData = await uploadRes.json();  // only parse JSON if response is OK
        
const newsongId = uploadData.song.id;
const newcategoryId = uploadData.song.category_id;

console.log(newsongId, newcategoryId);

// Now do the category-song link
const categorySongRes = await fetch(`${API_BASE}/category_songs`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${currentToken}`,
  },
  body: JSON.stringify({
    song_id: newsongId,
    category_id: newcategoryId,
  }),
});

const categorySongData = await categorySongRes.json();

if (!categorySongRes.ok) {
  setMessage(`Failed to link song "${song.title}" to category: ${categorySongData.error || 'unknown error'}`);
  setUploadingSongs(false);
  return;
}
      }
       

      setMessage('Album and all songs uploaded successfully!');

      // Reset form
      setAlbumName('');
      setArtistName('');
      setArtistBio('');
      setArtistImageUrl('');
      setUseExistingArtist(false);
      setSelectedArtistId('');
      setReleaseDate('');
      setCoverFile(null);
      setCoverUrl('');
      setSongs([]);
    } catch (err) {
      console.error(err);
      setMessage('Server error during upload.');
    } finally {
      setUploadingSongs(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <ul className="flex-1">
          <li className="mb-4 cursor-pointer hover:text-indigo-400">Albums</li>
          <li className="mb-4 cursor-pointer hover:text-indigo-400">Songs</li>
          <li className="mb-4 cursor-pointer hover:text-indigo-400">Users</li>
        </ul>

        {/* Navigation buttons */}
        <div className="space-y-2 border-t border-gray-700 pt-4">
          <button
            onClick={goToHome}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition text-left"
          >
            Go to Home
          </button>
          <button
            onClick={goToLogin}
            className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition text-left"
          >
            Go to Login
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition text-left"
          >
            Logout
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-left"
          >
            Refresh Page
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto space-y-8">
        {/* Existing Artists */}
        <section>
          <h1 className="text-3xl mb-6">Existing Artists</h1>
          {artists.length === 0 ? (
            <p>No artists found.</p>
          ) : (
            <div className="max-h-40 overflow-auto border-b border-gray-700 pb-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {artists.map(artist => (
                  <div
                    key={artist.id}
                    className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm"
                  >
                    <span>{artist.name}</span>
                    <span className="text-gray-400">ID: {artist.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Existing Albums */}
        <section>
          <h1 className="text-3xl mb-6">Existing Albums</h1>
          {albums.length === 0 ? (
            <p>No albums found.</p>
          ) : (
            <ul className="space-y-4 max-h-60 overflow-auto border-b border-gray-700 pb-4">
              {albums.map(album => (
                <li
                  key={album.id}
                  className="flex items-center space-x-4 border-b border-gray-700 pb-2"
                >
                  <img
                    src={album.cover_url}
                    alt={`${album.name} cover`}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <strong>{album.name}</strong> <br />
                    <span className="text-gray-300">by {getArtistName(album.artist_id)}</span> <br />
                    <span className="text-gray-400 text-sm">Release Date: {album.release_date || 'N/A'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upload Album & Songs */}
        <section>
          <h1 className="text-3xl mb-6">Upload New Album (with Songs)</h1>

          {/* Debug Tools */}
          <div className="mb-6 p-4 bg-gray-800 rounded">
            <h3 className="text-lg mb-2">Debug Tools</h3>
            <button
              type="button"
              onClick={testToken}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Test Token
            </button>
            <p className="text-sm text-gray-400 mt-2">
              User: {currentUser?.email || 'Not logged in'} ({currentUser?.role || 'No role'})
            </p>
            <p className="text-sm text-gray-400">
              Token status: {currentToken ? '✅ Present' : '❌ Missing'}
            </p>
            <p className="text-sm text-gray-400">
              Token length: {currentToken?.length || 0} characters
            </p>
            <p className="text-sm text-gray-400">
              Token preview: {currentToken ? currentToken.substring(0, 30) + '...' : 'No token'}
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <input
              type="text"
              placeholder="Album Name"
              value={albumName}
              onChange={e => setAlbumName(e.target.value)}
              required
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
            <label className="block text-sm font-medium mb-2">Genre</label>
           <select
            value={genreID}             // selected genre string
            onChange={e => setGenreID(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4"
           >
          <option value="">Select a genre</option>
            {genres.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
            ))}
            </select>


            {/* Artist Selection */}
            <div className="space-y-4 p-4 border border-gray-700 rounded">
              <h3 className="text-lg font-medium">Artist Information</h3>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="artistChoice"
                    checked={!useExistingArtist}
                    onChange={() => setUseExistingArtist(false)}
                    className="mr-2"
                  />
                  Create New Artist
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="artistChoice"
                    checked={useExistingArtist}
                    onChange={() => setUseExistingArtist(true)}
                    className="mr-2"
                  />
                  Use Existing Artist
                </label>
              </div>

              {useExistingArtist ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Artist</label>
                  <select
                    value={selectedArtistId}
                    onChange={e => setSelectedArtistId(e.target.value)}
                    required
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                  >
                    <option value="">Choose an existing artist</option>
                    {artists.map(artist => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name} (ID: {artist.id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Artist Name *</label>
                    <input
                      type="text"
                      placeholder="Artist Name"
                      value={artistName}
                      onChange={e => setArtistName(e.target.value)}
                      required
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Artist Bio</label>
                    <textarea
                      placeholder="Artist Bio (optional)"
                      value={artistBio}
                      onChange={e => setArtistBio(e.target.value)}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Artist Image URL</label>
                    <input
                      type="text"
                      placeholder="Artist Image URL (optional)"
                      value={artistImageUrl}
                      onChange={e => setArtistImageUrl(e.target.value)}
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Release Date</label>
              <input
                type="date"
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
                className="p-2 rounded bg-gray-800 border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Album Cover Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
              {uploadingCover && <p>Uploading cover image...</p>}
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="Album cover"
                  className="mt-4 w-32 h-32 object-cover rounded"
                />
              )}
            </div>

            {/* Songs */}
            <div>
              <h3 className="text-lg font-medium mb-2">Songs *</h3>

              {songs.length === 0 && <p>No songs added yet.</p>}

              {songs.map((song, idx) => (
                <div
                  key={idx}
                  className="relative mb-4 p-4 border border-gray-700 rounded bg-gray-800 space-y-2"
                >
                <button
                type="button"
                onClick={() => {
                const updatedSongs = [...songs];
                updatedSongs.splice(idx, 1);
                setSongs(updatedSongs);
               }}
        className="absolute top-0 right-1 text-red-500 hover:text-red-400
                   w-6 h-6 flex items-center justify-center
                   rounded-full hover:bg-red-900/30
                   transition-all duration-200
                   hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"
        title="Remove song"
      >
        ×
      </button>
                  <input
                    type="text"
                    placeholder="Song Title"
                    value={song.title}
                    onChange={e => handleSongChange(idx, 'title', e.target.value)}
                    required
                    className="w-full p-2 rounded bg-gray-900 border border-gray-600"
                  />
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={e => handleSongChange(idx, 'file', e.target.files[0])}
                    required
                    className="w-full p-2 rounded bg-gray-900 border border-gray-600"
                  />
                  <p className="text-sm text-gray-400">Duration: {song.duration || 'N/A'}</p>
                </div>
              ))}

              <button
                type="button"
                onClick={addSongInput}
                className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
              >
                Add Song
              </button>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={uploadingSongs}
              className={`mt-6 w-full py-3 rounded font-semibold ${
                uploadingSongs ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploadingSongs ? 'Uploading...' : 'Upload Album & Songs'}
            </button>

            {message && <p className="mt-4 text-center text-red-400">{message}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
