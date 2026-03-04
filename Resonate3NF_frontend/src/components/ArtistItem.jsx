import React, { use, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MusicContext } from '../context/MusicContext';

const ArtistItem = ({artist,id}) => {
    const navigate =useNavigate();
    const {artists}=useContext(MusicContext);
    useEffect(()=>{
        console.log(artist);
    })

  return (
    <div onClick={()=>navigate(`/album/${id}`)} className=' min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26] '>
        <img className='w-48 h-48 object-cover rounded' src={artist?.artist_image_url} alt="" />
        <p className='font-bold mt-2 mb-1'>{artist?.artist_name}</p>
    </div>
  )
}

export default ArtistItem