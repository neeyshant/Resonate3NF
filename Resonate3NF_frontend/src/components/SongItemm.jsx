import React, { useContext } from 'react'
import { PlayerContext } from '../context/playerContext'
import { MusicContext } from '../context/MusicContext'

const SongItemm = ({ songs }) => {
  const { playFromUrl, setTrack } = useContext(PlayerContext);
  const { artists,albums } = useContext(MusicContext);
  const currentAlbum=albums.find(album => songs?.album_id == album.id);
  
  // Find the artist name by matching artist_id
  const getArtistName = () => {
    if (songs?.artist_id && artists && artists.length > 0) {
      const foundArtist = artists.find(artist => artist.id === songs.artist_id);
      return foundArtist?.name || songs?.artist || 'Unknown Artist';
    }
    return songs?.artist || songs?.desc || 'Unknown Artist';
  };
  
  const handleClick = () => {
    console.log('🎵 SongItemm clicked - Song:', songs?.title);
    console.log('🎵 Song URL:', songs?.song_url);
    console.log('🎵 Artist ID:', songs?.artist_id);
    console.log('🎵 Found Artist:', getArtistName());
    
    if (songs) {
      // Set the track first so the player UI updates
      setTrack(songs);
      // Then play from URL
      playFromUrl(songs);
    } else {
      console.error('❌ No song data provided');
    }
  };
  
  return (
    <div 
      onClick={handleClick} 
      className='min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26]'
    >
      <img 
        className='rounded' 
        src={currentAlbum?.cover_url || songs?.album_cover || ''} 
        alt={songs?.title || 'Song'} 
      />
      <p className='font-bold mt-2 mb-1'>{songs?.title || 'Unknown Title'}</p>
      <p className='text-slate-200 text-sm'>{getArtistName()}</p>
    </div>
  )
}

export default SongItemm