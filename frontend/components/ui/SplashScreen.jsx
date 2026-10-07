'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fading out after 1.5s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    // Remove from DOM after 1.8s
    const removeTimer = setTimeout(() => setLoading(false), 1800);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
      style={{
        transition: 'opacity 0.3s ease-out',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <div className="relative w-56 h-56 mb-8" style={{ animation: 'splashBounce 1s infinite alternate' }}>
        <img src="/logo-transparent.png" alt="Loading PKbizMap..." className="w-full h-full object-contain" />
      </div>
      <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 rounded-full" 
          style={{ animation: 'splashProgress 1.5s ease-out forwards' }}
        ></div>
      </div>
    </div>
  );
}
