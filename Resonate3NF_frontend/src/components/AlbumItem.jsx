import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MusicContext } from '../context/MusicContext';

const AlbumItem = ({image,name,desc,id}) => {
    const navigate =useNavigate();
    const {albums}=useContext(MusicContext);

  return (
    <div onClick={()=>navigate(`/album/${id}`)} className=' min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26] '>
        <img className='w-full h-48 object-cover rounded' src={albums[id]?.cover_url} alt="" />
        <p className='font-bold mt-2 mb-1'>{albums[id]?.title}</p>
    </div>
  )
}

export default AlbumItem