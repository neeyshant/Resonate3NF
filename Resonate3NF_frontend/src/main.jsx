import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import PlayerContextProvider from './context/PlayerContext';
import { UserProvider } from './context/UserContext';  // import UserProvider
import MusicContextProvider from './context/MusicContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <MusicContextProvider>
        <PlayerContextProvider>
          <App />
        </PlayerContextProvider>
        </MusicContextProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
);
