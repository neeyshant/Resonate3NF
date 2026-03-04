import React, { useEffect, useContext } from 'react'
import Navbar from './Navbar'
import { albumsData, songsData } from '../assets/assets'
import AlbumItem from './AlbumItem'
import SongItem from './SongItem'
import { useNavigate } from 'react-router-dom'
import { MusicContext } from '../context/MusicContext'
import SongItemm from './SongItemm'

const DisplayPodcast = () => {
  const navigate = useNavigate();
  const { songs, loading, error, fetchSongs } = useContext(MusicContext);
  
  return (
    <>
      <Navbar />
      
      {/* Navigation Pills */}
      <div className="flex items-center gap-2 mt-4">
        <p 
          onClick={() => navigate('/')} 
          className='bg-black text-white px-4 py-1 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors'
        >
          All
        </p>
        <p 
          onClick={() => navigate(`/music`)} 
          className='bg-black text-white px-4 py-1 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors'
        >
          Music
        </p>
        <p onClick={()=>navigate(`/podcast`)} className='bg-white text-black px-4 py-1 rounded-2xl cursor-pointer border border-white/20'>
          Podcast
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-white">Loading podcasts...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Today's Biggest Hits */}
      <div className='mb-4'>
        <h1 className='my-5 font-bold text-2xl text-white'>Today's Biggest Hits</h1>
        <div className='flex overflow-auto gap-4 pb-4'>
          {songs.length > 0 ? (
            songs.map((item, index) => (
              <SongItemm 
                key={item.id || index} 
                songs={item} // Fixed: pass individual song, not songs[index]
              />
            ))
          ) : (
            <div className="text-white/60">No songs available</div>
          )}
        </div>
      </div>

      {/* Featured Charts */}
      <div className='mb-4'>
        <h1 className='my-5 font-bold text-2xl text-white'>Featured Charts</h1>
        <div className='flex overflow-auto gap-4 pb-4'>
          {albumsData.map((item, index) => (
            <AlbumItem 
              key={item.id || index} 
              name={item.name} 
              desc={item.desc} 
              id={item.id} 
              image={item.image}
            />
          ))}
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className='h-20'></div>
    </>
  )
}

export default DisplayPodcast