 import './App.css';
import {HashRouter as  Router,Route, Routes } from 'react-router-dom';
 import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contents/AuthContext';
import VideoMeetComponent from './pages/ViedoMeet';
import HomeComponent from './pages/home';
import History from './pages/histroy';

function App() {
  return (
   <>
    <Router>

     <AuthProvider>

     <Routes>
     <Route path="/" element={<LandingPage/>} />
     <Route path="/auth" element={<Authentication/>} />
     <Route path="/home" element={<HomeComponent/>} />
     <Route path="/history" element={<History/>} />
     <Route path="/:url" element={<VideoMeetComponent/>} />
    
    </Routes>
</AuthProvider>

    </Router>
   </>  
  );
}

export default App;
