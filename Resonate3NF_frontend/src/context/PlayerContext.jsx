import { createContext, useContext, useEffect, useRef, useState } from "react";
import { songsData } from "../assets/assets";
import { MusicContext } from "./MusicContext";

export const PlayerContext = createContext();

const PlayerContextProvider = (props) => {
    const { songs, getSongById, artists, recordSongPlay } = useContext(MusicContext);
    const audioRef = useRef();
    const seekBg = useRef();
    const seekBar = useRef();
    const animationRef = useRef(null);
    const isDragging = useRef(false);
    
    const [currentUrl, setCurrentUrl] = useState('');
    const [track, setTrack] = useState(null);
    const [playStatus, setPlayStatus] = useState(false);
    const [currentArtist, setCurrentArtist] = useState(null);
    const [currentContext, setCurrentContext] = useState('all');
    const [currentAlbumId, setCurrentAlbumId] = useState(null);
    const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
    
    const [time, setTime] = useState({
        currentTime: { second: 0, minute: 0 },
        totalTime: { second: 0, minute: 0 }   
    });

    // Helper function to update both track and artist
    const updateCurrentTrack = (newTrack) => {
        setTrack(newTrack);
    };

    useEffect(() => {
        if (songs && songs.length > 0 && !track) {
            setTrack(songs[0]);
        }
    }, [songs]);

    useEffect(() => {
        if (track && artists && artists.length > 0) {
            const foundArtist = artists.find(a => a.id === track.artist_id);
            if (!currentArtist || foundArtist?.id !== currentArtist?.id) {
                setCurrentArtist(foundArtist || null);
            }
        }
    }, [track, artists]);

    const getCurrentPlaylist = () => {
        const songList = songs && songs.length > 0 ? songs : songsData;
        
        switch (currentContext) {
            case 'album':
                if (currentAlbumId) {
                    return songList.filter(song => song.album_id === currentAlbumId);
                }
                break;
            case 'playlist':
                if (currentPlaylistId) {
                    return songList;
                }
                break;
            default:
                return songList;
        }
        return songList;
    };

    const getCurrentTrackIndex = (playlist, trackId) => {
        return playlist.findIndex(song => song.id === trackId);
    };

    const play = async () => {
        if (audioRef.current) {
            try {
                await audioRef.current.play();
                setPlayStatus(true);
                
                // Record play when starting playback
                if (track?.id && recordSongPlay) {
                    await recordSongPlay(track.id);
                }
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setPlayStatus(false);
        }
    };

    const playWithId = async (id, url = null, context = 'all', albumId = null, playlistId = null) => {
        try {
            let songToPlay;
            
            if (url) {
                await playFromUrl({ song_url: url, id });
                songToPlay = getSongById ? getSongById(id) : songsData[id];
                if (songToPlay) {
                    setTrack(songToPlay);
                }
            } else {
                songToPlay = getSongById ? getSongById(id) : songsData[id];
                
                if (songToPlay) {
                    setTrack(songToPlay);
                    
                    if (audioRef.current) {
                        audioRef.current.src = songToPlay.song_url || '';
                        
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
                            
                            const onCanPlay = () => {
                                clearTimeout(timeout);
                                audioRef.current.removeEventListener('canplay', onCanPlay);
                                resolve();
                            };
                            
                            if (audioRef.current.readyState >= 3) {
                                clearTimeout(timeout);
                                resolve();
                            } else {
                                audioRef.current.addEventListener('canplay', onCanPlay);
                                audioRef.current.load();
                            }
                        });
                        
                        await audioRef.current.play();
                        setPlayStatus(true);
                        
                        // Record play
                        if (recordSongPlay) {
                            await recordSongPlay(id);
                        }
                    }
                }
            }

            setCurrentContext(context);
            setCurrentAlbumId(albumId || songToPlay?.album_id);
            setCurrentPlaylistId(playlistId);
        } catch (error) {
            console.error('Error in playWithId:', error);
            setPlayStatus(false);
        }
    };

    const playWithContext = async (song, context = 'all', albumId = null, playlistId = null) => {
        try {
            updateCurrentTrack(song);
            setCurrentContext(context);
            setCurrentAlbumId(albumId);
            setCurrentPlaylistId(playlistId);
            
            if (audioRef.current) {
                audioRef.current.src = song.song_url || '';
                await audioRef.current.play();
                setPlayStatus(true);
                
                // Record play
                if (recordSongPlay) {
                    await recordSongPlay(song.id);
                }
            }
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const playFromUrl = async (songs) => {
        if (!songs.song_url) return;

        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.src = songs.song_url;
                setCurrentUrl(songs.song_url);
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Audio loading timeout'));
                    }, 10000);

                    const handleCanPlay = () => {
                        clearTimeout(timeout);
                        audioRef.current.removeEventListener('canplay', handleCanPlay);
                        audioRef.current.removeEventListener('error', handleError);
                        resolve();
                    };

                    const handleError = (e) => {
                        clearTimeout(timeout);
                        audioRef.current.removeEventListener('canplay', handleCanPlay);
                        audioRef.current.removeEventListener('error', handleError);
                        reject(e);
                    };

                    audioRef.current.addEventListener('canplay', handleCanPlay);
                    audioRef.current.addEventListener('error', handleError);
                    audioRef.current.load();
                });
                
                await audioRef.current.play();
                setPlayStatus(true);
                
                // Record play if we have an ID
                if (songs.id && recordSongPlay) {
                    await recordSongPlay(songs.id);
                }
            } catch (error) {
                console.error('Failed to play from URL:', error);
                setPlayStatus(false);
            }
        }
    };

    const previous = async () => {
        if (!track) return;
        
        const playlist = getCurrentPlaylist();
        const currentIndex = getCurrentTrackIndex(playlist, track.id);
        
        if (currentIndex > 0) {
            try {
                const prevSong = playlist[currentIndex - 1];
                setTrack(prevSong);
                
                if (audioRef.current) {
                    audioRef.current.src = prevSong.song_url || '';
                    await audioRef.current.play();
                    setPlayStatus(true);
                    
                    // Record play
                    if (recordSongPlay) {
                        await recordSongPlay(prevSong.id);
                    }
                }
            } catch (error) {
                console.error('Error playing previous track:', error);
            }
        }
    };

    const next = async () => {
        if (!track) return;
        
        const playlist = getCurrentPlaylist();
        const currentIndex = getCurrentTrackIndex(playlist, track.id);
        
        if (currentIndex < playlist.length - 1) {
            try {
                const nextSong = playlist[currentIndex + 1];
                setTrack(nextSong);
                
                if (audioRef.current) {
                    audioRef.current.src = nextSong.song_url || '';
                    await audioRef.current.play();
                    setPlayStatus(true);
                    
                    // Record play
                    if (recordSongPlay) {
                        await recordSongPlay(nextSong.id);
                    }
                }
            } catch (error) {
                console.error('Error playing next track:', error);
            }
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        const bar = seekBar.current;
        if (!audio || !bar) return;

        let lastUpdateTime = 0;

        const updateProgress = (timestamp) => {
            if (!isDragging.current && audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                bar.style.width = `${progress}%`;

                if (!lastUpdateTime || timestamp - lastUpdateTime > 200) {
                    setTime({
                        currentTime: {
                            second: Math.floor(audio.currentTime % 60),
                            minute: Math.floor(audio.currentTime / 60),
                        },
                        totalTime: {
                            second: Math.floor(audio.duration % 60),
                            minute: Math.floor(audio.duration / 60),
                        },
                    });
                    lastUpdateTime = timestamp;
                }
            }
            animationRef.current = requestAnimationFrame(updateProgress);
        };

        animationRef.current = requestAnimationFrame(updateProgress);
        return () => cancelAnimationFrame(animationRef.current);
    }, [track]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = async () => {
            setPlayStatus(false);
            audio.currentTime = 0;
            
            // Record play for the song that just finished
            if (track?.id && recordSongPlay) {
                await recordSongPlay(track.id);
            }
            
            // Auto-play next song
            await next();
        };

        const handleError = (e) => {
            console.error('Audio element error:', e);
            setPlayStatus(false);
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [audioRef?.current?.src, currentUrl, track]);

    const contextValue = {
        audioRef,
        seekBg,
        seekBar,
        track,
        setTrack,
        playStatus,
        setPlayStatus,
        time,
        setTime,
        play,
        pause,
        isDragging,
        playWithId,
        playWithContext,
        next,
        previous,
        playFromUrl,
        currentUrl,
        currentContext,
        currentAlbumId,
        currentPlaylistId,
        getCurrentPlaylist,
        songs,
        getSongById,
        artists,
        currentArtist,
        updateCurrentTrack
    };

    return (
        <PlayerContext.Provider value={contextValue}>
            {props.children}
        </PlayerContext.Provider>
    );
};

export default PlayerContextProvider;