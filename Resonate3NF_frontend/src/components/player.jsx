import React, { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { PlayerContext } from '../context/playerContext'
import { MusicContext } from '../context/MusicContext';

const Player = () => {
    const {
        seekBar, seekBg, playStatus, play, pause, track, time, audioRef,
        isDragging, previous, next, songs, artists, currentArtist
    } = useContext(PlayerContext);
    const{albums}=useContext(MusicContext);
    const currentAlbum=albums.find(album => track?.album_id == album.id);

    const [previewPercent, setPreviewPercent] = useState(null);

    // Fallback to get artist name if currentArtist is not set
    const getArtistName = () => {
        if (currentArtist?.name) {
            return currentArtist.name;
        }
        
        if (track?.artist_id && artists) {
            const foundArtist = artists.find(a => a.id === track.artist_id);
            return foundArtist?.name || 'Unknown Artist';
        }
        
        return 'Unknown Artist';
    };

    // Fallback to get track title
    const getTrackTitle = () => {
        if (track?.title) {
            return track.title;
        }
        
        if (songs && songs.length > 0) {
            return songs[0]?.title || 'No track selected';
        }
        
        return 'No track selected';
    };

    const updateSeekPreview = (clientX) => {
        const rect = seekBg.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        setPreviewPercent(percent);
    };

    const finalizeSeek = (clientX) => {
        const rect = seekBg.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);
        if (audioRef.current && audioRef.current.duration) {
            audioRef.current.currentTime = percent * audioRef.current.duration;
        }
        setPreviewPercent(null);
    };

    const handleSeekClick = (e) => {
        finalizeSeek(e.clientX);
    };

    const handleMouseDown = () => {
        isDragging.current = true;

        const handleMouseMove = (e) => {
            if (isDragging.current) {
                updateSeekPreview(e.clientX);
            }
            document.body.style.userSelect = 'none';
        };

        const handleMouseUp = (e) => {
            if (isDragging.current) {
                finalizeSeek(e.clientX);
                isDragging.current = false;
                document.body.style.userSelect = 'auto';
            }

            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className='h-[10%] bg-black flex justify-between items-center text-white px-4'>
            <div className="hidden lg:flex items-center gap-4">
                <img 
                    className='w-12 h-12 rounded object-cover bg-gray-700' 
                    src={currentAlbum?.cover_url || track?.image || assets?.default_album_cover || ''} 
                    alt={track?.title || "Album cover"}
                    onError={(e) => {
                        e.target.src = assets.default_album_cover || '';
                    }}
                />
                <div>
                    <p className='text-sm font-medium truncate max-w-40'>
                        {getTrackTitle()}
                    </p>
                    <p className='text-xs text-gray-400 truncate max-w-40'>
                        {getArtistName()}
                    </p>
                </div>
            </div>

            <div className='flex flex-col items-center gap-1 m-auto'>
                <div className='flex gap-4'>
                    <img 
                        className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                        src={assets.shuffle_icon} 
                        alt="Shuffle" 
                    />
                    <img 
                        onClick={previous} 
                        className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                        src={assets.prev_icon} 
                        alt="Previous" 
                    />
                    {playStatus ? (
                        <img 
                            onClick={pause} 
                            className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                            src={assets.pause_icon} 
                            alt="Pause" 
                        />
                    ) : (
                        <img 
                            onClick={play} 
                            className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                            src={assets.play_icon} 
                            alt="Play" 
                        />
                    )}
                    <img 
                        onClick={next} 
                        className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                        src={assets.next_icon} 
                        alt="Next" 
                    />
                    <img 
                        className="w-4 cursor-pointer hover:opacity-80 transition-opacity" 
                        src={assets.loop_icon} 
                        alt="Loop" 
                    />
                </div>

                <div className='flex items-center gap-5'>
                    <p className='text-xs min-w-10 text-center'>
                        {time.currentTime.minute}:{time.currentTime.second.toString().padStart(2, '0')}
                    </p>
                    <div 
                        ref={seekBg}
                        onClick={handleSeekClick}
                        onMouseDown={handleMouseDown} 
                        className="w-[60vw] max-w-[500px] bg-gray-300 rounded-full cursor-pointer relative"
                    >
                        <hr 
                            ref={seekBar}   
                            style={{
                                width: `${previewPercent !== null
                                    ? previewPercent * 100
                                    : (audioRef.current?.currentTime / audioRef.current?.duration) * 100 || 0}%`
                            }} 
                            className='h-1 border-none w-0 bg-green-800 rounded-full transition-all duration-100'
                        />
                    </div>
                    <p className='text-xs min-w-10 text-center'>
                        {time.totalTime.minute}:{time.totalTime.second.toString().padStart(2, '0')}
                    </p>
                </div>
            </div>

            <div className='hidden lg:flex items-center gap-2 opacity-75'>
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.plays_icon} 
                    alt="Queue" 
                />
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.mic_icon} 
                    alt="Lyrics" 
                />
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.queue_icon} 
                    alt="Queue" 
                />
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.speaker_icon} 
                    alt="Connect" 
                />
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.volume_icon} 
                    alt="Volume" 
                />
                <div className='w-20 bg-slate-50 h-1 rounded cursor-pointer'>
                    <div className='w-16 bg-white h-1 rounded'></div>
                </div>
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.mini_player_icon} 
                    alt="Mini player" 
                />
                <img 
                    className='w-4 cursor-pointer hover:opacity-100 transition-opacity' 
                    src={assets.zoom_icon} 
                    alt="Full screen" 
                />
            </div>
        </div>
    )
}

export default Player