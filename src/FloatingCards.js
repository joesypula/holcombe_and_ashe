import React, { useRef, useEffect, useMemo } from 'react';
import './FloatingCards.css';

// Use React.memo to prevent re-renders
const FloatingCards = React.memo(() => {
  const emojisContainerRef = useRef(null);
  
  // Emojis to use
  const emojis = ['🃏', '💰', '🎲', '🎰'];
  
  // Create floating emojis with useMemo to ensure they don't recreate on re-render
  const floatingEmojis = useMemo(() => {
    return Array(15).fill(0).map((_, i) => {
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      return {
        id: `emoji-${i}`,
        emoji: randomEmoji,
        style: {
          left: `${Math.random() * 90}%`,
          top: `${Math.random() * 90}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${10 + Math.random() * 20}s`,
          transform: `rotate(${Math.random() * 360}deg) scale(${0.7 + Math.random() * 0.8})`,
          opacity: 0.85,
          fontSize: `${3 + Math.random() * 2}rem`,
          pointerEvents: 'none'
        }
      };
    });
  }, [emojis]); // Add emojis as a dependency

  // Force hardware acceleration and isolation with useEffect
  useEffect(() => {
    if (emojisContainerRef.current) {
      // Force a separate rendering layer
      emojisContainerRef.current.style.transform = 'translateZ(0)';
      emojisContainerRef.current.style.backfaceVisibility = 'hidden';
    }
  }, []);

  return (
    <div className="floating-cards-container" ref={emojisContainerRef}>
      {floatingEmojis.map(item => (
        <div 
          key={item.id} 
          className="floating-card"
          style={item.style}
        >
          <div className="floating-card-inner">
            <div className="emoji-container">
              {item.emoji}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default FloatingCards; 