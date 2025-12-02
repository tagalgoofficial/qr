import React, { useState, useEffect, useRef } from 'react';
import './LoadingPage.css';
import restaurantService from '../services/restaurantService';
import { getImageUrl } from '../utils/imageUtils';

const LoadingPage = ({ onComplete, duration = 3000, logo = '/Logo-MR-QR.svg' }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [displayLogo, setDisplayLogo] = useState(logo);
  const loadingRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Try to fetch restaurant logo if we're on a menu page
    const path = window.location.pathname;
    const menuMatch = path.match(/\/menu\/([^\/]+)/);
    
    if (menuMatch && menuMatch[1]) {
      const restaurantSlug = menuMatch[1];
      // Fetch restaurant logo asynchronously (non-blocking)
      restaurantService.getRestaurant(null, restaurantSlug)
        .then(restaurant => {
          const restaurantLogo = restaurant?.logo_url || restaurant?.logo;
          if (restaurantLogo) {
            setDisplayLogo(getImageUrl(restaurantLogo));
          }
        })
        .catch(() => {
          // Keep default logo on error
        });
    }
  }, []);

  useEffect(() => {
    // Entry animation - start immediately
    setIsVisible(true);
    startTimeRef.current = Date.now();

    // Simulate loading progress
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        // Trigger splash animation when reaching 100%
        setShowSplash(true);
        
        // After splash, mark as complete
        setTimeout(() => {
          setIsComplete(true);
          
          // Exit animation
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
              onComplete();
            }
          }, 400); // Fade out duration
        }, 300); // Splash duration
      }
    };

    // Update progress every 16ms (60fps)
    intervalRef.current = setInterval(updateProgress, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, onComplete]);

  return (
    <div 
      ref={loadingRef}
      className={`loading-page ${isVisible ? 'visible' : 'hidden'} ${isComplete ? 'complete' : ''}`}
    >
      {/* Background with blur effect */}
      <div className="loading-background"></div>
      
      {/* Glassmorphism container */}
      <div className="loading-container">
        {/* Logo with liquid fill animation */}
        <div className="logo-container">
          <div className="logo-wrapper">
            <svg 
              className="logo-mask" 
              viewBox="0 0 200 200"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <clipPath id="logoClipPath">
                  <circle cx="100" cy="100" r="90" />
                </clipPath>
                {/* Liquid fill gradient */}
                <linearGradient id="liquidGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ff2d2d" stopOpacity="1" />
                  <stop offset="50%" stopColor="#ff5555" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ff2d2d" stopOpacity="0.8" />
                </linearGradient>
                {/* Filter for liquid shine */}
                <filter id="liquidGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Liquid fill */}
              <g clipPath="url(#logoClipPath)">
                {/* Main liquid fill */}
                <rect
                  className="liquid-fill"
                  x="0"
                  y="200"
                  width="200"
                  height="200"
                  fill="url(#liquidGradient)"
                  filter="url(#liquidGlow)"
                  style={{
                    transform: `translateY(-${progress}%)`,
                  }}
                />
                
                {/* Wave surface at liquid level */}
                {progress > 0 && (
                  <>
                    <path
                      className="liquid-wave"
                      d={`M 0 ${200 - (progress * 1.8)} Q 50 ${195 - (progress * 1.8)} 100 ${200 - (progress * 1.8)} T 200 ${200 - (progress * 1.8)} L 200 220 L 0 220 Z`}
                      fill="rgba(255, 255, 255, 0.15)"
                      style={{
                        transition: 'd 0.15s ease-out',
                      }}
                    />
                    
                    {/* Secondary wave for depth effect */}
                    <path
                      className="liquid-wave-secondary"
                      d={`M 0 ${205 - (progress * 1.8)} Q 50 ${200 - (progress * 1.8)} 100 ${205 - (progress * 1.8)} T 200 ${205 - (progress * 1.8)} L 200 220 L 0 220 Z`}
                      fill="rgba(255, 255, 255, 0.1)"
                      style={{
                        transition: 'd 0.15s ease-out',
                      }}
                    />
                  </>
                )}
                
                {/* Bubbles */}
                {[...Array(8)].map((_, i) => (
                  <circle
                    key={i}
                    className={`bubble bubble-${i}`}
                    cx={20 + (i * 25)}
                    cy={200}
                    r={3 + Math.random() * 3}
                    fill="rgba(255, 255, 255, 0.4)"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      transform: `translateY(-${progress * 0.8}%)`,
                    }}
                  />
                ))}
              </g>
            </svg>
            
            {/* Logo image overlay */}
            <div className="logo-image">
              <img 
                src={displayLogo} 
                alt="Logo" 
                onError={(e) => {
                  if (e.target.src !== '/Logo-MR-QR.svg') {
                    e.target.src = '/Logo-MR-QR.svg';
                  }
                }}
              />
            </div>
            
            {/* Splash effect on completion */}
            {showSplash && (
              <div className="splash-effect">
                <div className="splash-ring splash-ring-1"></div>
                <div className="splash-ring splash-ring-2"></div>
                <div className="splash-ring splash-ring-3"></div>
              </div>
            )}
          </div>
        </div>

        {/* Progress percentage */}
        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div 
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Touch Glow effect */}
        <div className="touch-glow"></div>
      </div>
    </div>
  );
};

export default LoadingPage;
