import React, { useContext,useEffect,useMemo } from 'react'
import Navbar from './Navbar'
import { useParams } from 'react-router-dom'
import { assets, albumsData, songsData } from '../assets/assets';
import { PlayerContext } from '../context/playerContext';
import { MusicContext } from '../context/MusicContext';

const DisplayAlbum = () => {
    const {id}=useParams();
    const albumData =albumsData[id];
    const {playWithId} = useContext(PlayerContext);
    const {albums, getSongsByAlbumId, getAlbumById,artists}=useContext(MusicContext);
    const currentAlbum = getAlbumById(parseInt(albums[id]?.id));
   const currentArtist = artists.find(artist => currentAlbum?.artist_id == artist.id);
    
        const albumSongs = useMemo(() => {
        return getSongsByAlbumId(parseInt(currentAlbum?.id));
    }, [getSongsByAlbumId, id]);

  return (
    <>
    <Navbar/>
    <div className='mt-10 flex gap-8 flex-col md:flex-row md:items-end'>
        <img className=' w-48 rounded' src={currentAlbum?.cover_url} alt="" />
        <div className="flex flex-col">
            <p>Album</p>
            <h2 className='text-5xl font-bold mb-4 md:text-7xl'>{albums[id]?.title}</h2>
            <p className='mt-1'>
                <img className='inline-block w-6 rounded-full' src={currentArtist?.image_url} alt="" />
                <b> {currentArtist?.name}</b>
                • {currentAlbum?.release_date?.substring(0, 4)} 
                • <b>{albumSongs.length} songs, </b>
about {(() => {
    const totalSeconds = albumSongs.reduce((total, song) => {
        // Assuming duration is in "MM:SS" format, convert to seconds
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return total + (minutes * 60) + seconds;
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}hr ${minutes}min`;
    } else {
        return `${minutes}min ${seconds}sec`;
    }
})()}
            </p>
        </div>
    </div>
    <div className="grid grid-cols-[4fr_2fr_1fr] sm:grid-cols-[4fr_2fr_1fr_1fr] gap-4 mt-10 mb-4 pl-2 text-[#a7a7a7]">
  <p>
    <b className="mr-4">#</b> Title
  </p>
  <p className="hidden sm:block">Date Added</p>
  <img className="m-auto w-4" src={assets.clock_icon} alt="" />
</div>
<hr />
{
  albumSongs.map((item, index) => (
    <div
      onClick={() => playWithId(item.id)}
      key={index}
      className="grid grid-cols-[4fr_2fr_1fr] sm:grid-cols-[4fr_2fr_1fr_1fr] gap-4 p-2 items-center text-[#a7a7a7] hover:bg-[#ffffff2b] cursor-pointer"
    >
      <p className="text-white truncate">
        <b className="mr-4 text-[#a7a7a7]">{index + 1}</b>
        {item.title}
      </p>
      <p className="text-[15px] hidden sm:block">5 days ago</p>
      <p className="text-[15px] text-center">{item.duration}</p>
    </div>
  ))
}

    </>
  )
}

export default DisplayAlbum