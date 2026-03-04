import React, { useContext } from 'react';
import Sidebar from './components/sidebar';
import Player from './components/player';
import Display from './components/Display';
import { PlayerContext } from './context/PlayerContext';
import AdminPanel from './components/AdminPanel';
import { UserContext } from './context/UserContext';
import Login from './components/Login';

const App = () => {
  const { audioRef, track } = useContext(PlayerContext);
  const { user, loading } = useContext(UserContext);

  // Show loading while checking user
  if (loading) {
    return <div className="text-white p-4">Loading...</div>;
  }

  // Show login if no user
  if (!user) {
    return <Login />;
  }

  // Show admin panel if admin
  if (user.role === 'admin') {
    return <AdminPanel token={localStorage.getItem('token')} />;
  }

  // Normal user interface
  return (
    <div className='h-screen bg-black'>
      <div className="h-[90%] flex">
        <Sidebar />
        <Display />
      </div>
      <Player />
      <audio ref={audioRef} preload='auto' src={track?.file}></audio>
    </div>
  );
};

export default App;
