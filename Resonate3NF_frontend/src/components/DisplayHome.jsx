import React, { useContext, useEffect } from 'react'
import Navbar from './Navbar'
import { albumsData, songsData } from '../assets/assets'
import AlbumItem from './AlbumItem'
import SongItem from './SongItem'
import SongItemm from './SongItemm'
import { MusicContext } from '../context/MusicContext'
import ArtistItem from './ArtistItem'

import { Navigate, useNavigate } from 'react-router-dom'
const DisplayHome = () => {
  const navigate= useNavigate();
   const { songs, loading, error, fetchSongs, albums, userTopArtists, recommendations } = useContext(MusicContext);
   useEffect(()=>{
    console.log("user's top artist")
    console.log(recommendations);
   })
   
  return (
    <>
    <Navbar/>
    <div className="flex items-center gap-2 mt-4">
      <p onClick={()=>navigate('/')} className='bg-white text-black px-4 py-1 rounded-2xl cursor-pointer'>All</p>
      <p onClick={()=>navigate(`/music`)} className='bg-black px-4 py-1 rounded-2xl cursor-pointer'>Music</p>
      <p onClick={()=>navigate(`/podcast`)} lassName='bg-black px-4 py-1 rounded-2xl cursor-pointer'>Podcast</p>
    </div>
    <div className='mb-4'>
      <h1 className='my-5 font-bold text-2xl'>Your Top Artists</h1>
      <div className='flex overflow-auto'>
      {userTopArtists.map((item,index)=>(<ArtistItem artist={userTopArtists[index]} id={index}/>))}
     </div>
     </div>
     <div className='mb-4'>
      <h1 className='my-5 font-bold text-2xl'>Songs For You</h1>
      <div className='flex overflow-auto'>
      {recommendations.map((item,index)=>(<SongItem recommendations={item} id={index}/>))}
     </div>
    </div>
    <div className='mb-4'>
      <h1 className='my-5 font-bold text-2xl'>Songs For You</h1>
      <div className='flex overflow-auto'>
      {songs.map((item,index)=>(<SongItemm songs={songs[index]}/>))}
     </div>
    </div>
    <div className='mb-4'>
      <h1 className='my-5 font-bold text-2xl'>Featured Charts</h1>
      <div className='flex overflow-auto'>
      {albums.map((item,index)=>(<AlbumItem key={index} name={item.name} desc={item.desc} id={index} image={item.image}/>))}
     </div>
    </div>
    
    </>
  )
}

export default DisplayHome