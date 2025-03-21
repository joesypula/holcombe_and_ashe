import { useState, useEffect, useRef } from 'react';
import './Confetti.css';

const Confetti = ({ duration = 3000 }) => {
  const [pieces, setPieces] = useState([]);
  const animationRef = useRef(null);
  const piecesRef = useRef([]);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Detect if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Create confetti pieces - fewer pieces on mobile
    const numPieces = isMobile ? 20 : 50;
    const newPieces = [];
    
    for (let i = 0; i < numPieces; i++) {
      newPieces.push({
        id: i,
        x: 50, // Start at center X
        y: 0,  // Start at top of button
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? '#008000' : '#00A300', // Different greens
        vx: -5 + Math.random() * 10, // Random horizontal velocity
        vy: 1 + Math.random() * 5,   // Random vertical velocity, all going down
        vr: -3 + Math.random() * 6,   // Random rotation velocity
      });
    }
    
    // Store pieces in ref for animation without needing state updates
    piecesRef.current = newPieces;
    setPieces(newPieces);
    
    // Animation
    let lastTime = Date.now();
    
    // Use direct DOM manipulation for better performance
    const updatePieces = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const pieces = container.children;
      for (let i = 0; i < piecesRef.current.length; i++) {
        const piece = piecesRef.current[i];
        const element = pieces[i];
        if (element) {
          element.style.left = `calc(${piece.x}% - 10px)`;
          element.style.top = `${piece.y}%`;
          element.style.transform = `rotate(${piece.rotation}deg) scale(${piece.scale})`;
        }
      }
    };
    
    const animate = () => {
      const currentTime = Date.now();
      const delta = (currentTime - lastTime) / 16; // Normalize to approximately 60fps
      lastTime = currentTime;
      
      // Update piece positions - don't use React state for better performance
      for (let i = 0; i < piecesRef.current.length; i++) {
        const piece = piecesRef.current[i];
        
        // Fast direct updates without React state changes
        piece.x += piece.vx * delta;
        piece.y += piece.vy * delta;
        piece.rotation += piece.vr * delta;
        piece.vy += 0.05 * delta; // Add slight gravity
      }
      
      // Apply updates to DOM
      updatePieces();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Remove confetti after duration
    const timeoutId = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setPieces([]);
    }, duration);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [duration]);
  
  return (
    <div className="confetti-container" ref={containerRef}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `calc(${piece.x}% - 10px)`,
            top: `${piece.y}%`,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            color: piece.color,
            willChange: 'transform, left, top'
          }}
        >
          ☘️
        </div>
      ))}
    </div>
  );
};

export default Confetti; 