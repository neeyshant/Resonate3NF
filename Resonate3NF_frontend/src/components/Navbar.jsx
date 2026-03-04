import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/UserContext'

const Navbar = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useContext(UserContext);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    clearUser();
    setShowDropdown(false);
  };

  return (
    <>
    <div className='w-full flex justify-between items-center font-semibold'>
        <div className="flex items-center gap-2">
            <img onClick={()=>navigate(-1)} className='w-8 bg-black p-2 rounded-2xl cursor-pointer' src={assets.arrow_left} alt="" />
            <img onClick={()=>navigate(1)} className='w-8 bg-black p-2 rounded-2xl cursor-pointer' src={assets.arrow_right} alt="" />
        </div>
       <div className="flex items-center gap-4">
        <p className='bg-white text-black text-[15px] px-4 py-1 rounded-2xl hidden md:block cursor-pointer'>Explore Premium</p>
        <p className='bg-black py-1 px-3 rounded-2xl text-[15px] cursor-pointer'>Install App</p>
        
        {/* User avatar with dropdown */}
        <div className="relative">
          <div 
            className='bg-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors'
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm text-gray-300">Signed in as</p>
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
       </div>
    </div>
    
    {/* Backdrop to close dropdown when clicking outside */}
    {showDropdown && (
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setShowDropdown(false)}
      ></div>
    )}
    </>
  )
}

export default Navbar