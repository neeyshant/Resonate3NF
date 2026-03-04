import React,{ useContext, useEffect } from 'react'

import { PlayerContext } from '../context/playerContext'

const SongItem = ({recommendations,id}) => {
  const {playWithId}= useContext(PlayerContext);
  const getArtistName = () => {
    if (songs?.artist_id && artists && artists.length > 0) {
      const foundArtist = artists.find(artist => artist.id === songs.artist_id);
      return foundArtist?.name || songs?.artist || 'Unknown Artist';
    }
    return songs?.artist || songs?.desc || 'Unknown Artist';
  };
 
  return (
    <div onClick={()=>playWithId(recommendations?.song_id)} className='min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26]'>
        <img className='w-48 h-48 rounded' src={recommendations?.cover_url} alt="" />
        <p className='font-bold mt-2 mb-1'>{recommendations?.title}</p>
        <p className='text-slate-200 text-sm'>{recommendations?.artist_name}</p>
    </div>
  )
}

export default SongItem