import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PresenterView from './components/PresenterView';
import ViewerView from './components/ViewerView';

// Splash Screen Component
const SplashScreen = () => (
  <div style={{
    backgroundColor: '#f6f2ef',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  }}>
    <img 
      src="https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/Neutral%20Blue%20Minimalism%20Motivational%20Life%20Quote%20Desktop%20Wallpaper.png?alt=media&token=61d1ca82-a249-4878-9026-debaaff3a5f4" 
      alt="Loading..." 
      style={{ maxWidth: '80%', maxHeight: '80%' }}
    />
  </div>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timer for 5 seconds (5000ms)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/session/:id" element={<PresenterView />} />
        <Route path="/view/:id" element={<ViewerView />} />
      </Routes>
    </BrowserRouter>
  );
}