import React, { useState } from "react";

export default function AddSong() {
  const [title, setTitle] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [artistId, setArtistId] = useState("");
  const [duration, setDuration] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Backend API endpoint
    const API_URL = "http://localhost:3001/api/songs";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          album_id: albumId ? Number(albumId) : null,
          artist_id: artistId ? Number(artistId) : null,
          duration,
          song_url: songUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Song "${data.title}" added successfully!`);
        setTitle("");
        setAlbumId("");
        setArtistId("");
        setDuration("");
        setSongUrl("");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to connect to the server.");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h2>Add New Song</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Album ID"
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Artist ID"
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Duration (e.g. 3:22)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <input
          type="url"
          placeholder="Song URL"
          value={songUrl}
          onChange={(e) => setSongUrl(e.target.value)}
          required
        />
        <button type="submit">Add Song</button>
      </form>
    </div>
  );
}
