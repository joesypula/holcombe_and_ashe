import { useRef, useEffect, useState, memo } from 'react';
import './App.css';
import Confetti from './Confetti';
import FloatingCards from './FloatingCards';

// Separate constant component for floating emojis to prevent re-renders
const BackgroundEmojis = memo(() => <FloatingCards />);

function App() {
  const containerRef = useRef(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasInitialFlip, setHasInitialFlip] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleFlipClick = () => {
    // Don't allow new flips while animating
    if (isAnimating) return;
    
    // Trigger confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000); // Hide after 3 seconds
    
    setIsAnimating(true);
    
    if (!hasInitialFlip) {
      // First flip - from back to front
      setIsFlipped(true);
      
      // After the animation completes, keep the front showing
      setTimeout(() => {
        setHasInitialFlip(true);
        setIsFlipped(false);
        setIsAnimating(false);
      }, 1000); // Match first flip animation duration (1s)
    } else {
      // Subsequent flips - do 360 spin
      setIsFlipped(true);
      
      // Reset flip state after animation completes
      setTimeout(() => {
        setIsFlipped(false);
        setIsAnimating(false);
      }, 1500); // Match 360 animation duration (1.5s)
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Skip drag effect setup if the initial flip hasn't happened yet
    if (!hasInitialFlip) return;
    
    const sensitivity = 0.5; // Adjust for more/less sensitive rotation
    const decay = 0.95; // Momentum decay factor
    const returnFactor = 0.05; // Speed of return to original position
    const hoverFactor = 0.1; // Subtle movement factor for hover
    
    // Track mouse position for hover effect
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isHovering = false;
    
    // Add gentle wind simulation
    let windAngleX = 0;
    let windAngleY = 0;
    let windTime = 0;
    const windSpeed = 0.001;
    
    // Animation function for smooth rotation
    const animate = () => {
      // Don't apply rotations during flip animations
      if (isAnimating) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      
      if (isDraggingRef.current) {
        // While dragging, update rotation directly
        rotationRef.current.x = targetRotationRef.current.x;
        rotationRef.current.y = targetRotationRef.current.y;
      } else if (isHovering) {
        // On hover, subtly move based on mouse position
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate relative position of mouse to card center
        const relativeX = (mouseX - centerX) / (rect.width / 2);
        const relativeY = (mouseY - centerY) / (rect.height / 2);
        
        // Update wind simulation
        windTime += windSpeed;
        windAngleX = Math.sin(windTime) * 2;
        windAngleY = Math.cos(windTime * 1.3) * 2;
        
        // Combine mouse position and wind effect
        targetRotationRef.current.x = relativeY * -5 + windAngleX;
        targetRotationRef.current.y = relativeX * 5 + windAngleY;
        
        // Smooth lerp to target
        rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * hoverFactor;
        rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * hoverFactor;
      } else {
        // When not hovering or dragging, apply momentum and return to center
        velocityRef.current.x *= decay;
        velocityRef.current.y *= decay;
        
        // Apply return to center force
        rotationRef.current.x += (0 - rotationRef.current.x) * returnFactor;
        rotationRef.current.y += (0 - rotationRef.current.y) * returnFactor;
        
        // Apply velocity
        rotationRef.current.x += velocityRef.current.x;
        rotationRef.current.y += velocityRef.current.y;
      }
      
      // Apply rotation directly to DOM for max performance
      container.style.transform = `perspective(1000px) rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);
    
    // Mouse/Touch handlers
    const handleStart = (clientX, clientY) => {
      if (isAnimating) return;
      isDraggingRef.current = true;
      lastPositionRef.current = { x: clientX, y: clientY };
      velocityRef.current = { x: 0, y: 0 };
      container.style.transition = 'none';
      
      // Disable water floating animation during drag
      document.querySelector('.card-container').style.animation = 'none';
    };
    
    // Handle mouse movement for hover effect
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Handle drag movement
      if (isDraggingRef.current) {
        if (isAnimating) {
          isDraggingRef.current = false;
          return;
        }
        
        const deltaX = e.clientX - lastPositionRef.current.x;
        const deltaY = e.clientY - lastPositionRef.current.y;
        
        // Calculate velocity for momentum
        velocityRef.current.x = deltaY * sensitivity * 0.1;
        velocityRef.current.y = -deltaX * sensitivity * 0.1;
        
        // Update target rotation
        targetRotationRef.current.x += deltaY * sensitivity;
        targetRotationRef.current.y -= deltaX * sensitivity;
        
        // Limit rotation range
        targetRotationRef.current.x = Math.min(Math.max(targetRotationRef.current.x, -45), 45);
        targetRotationRef.current.y = Math.min(Math.max(targetRotationRef.current.y, -45), 45);
        
        lastPositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    const handleTouchMove = (e) => {
      if (isDraggingRef.current) {
        if (isAnimating) {
          isDraggingRef.current = false;
          return;
        }
        
        // Only prevent default if absolutely necessary
        if (Math.abs(e.touches[0].clientY - lastPositionRef.current.y) > 10) {
          e.preventDefault();
        }
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastPositionRef.current.x;
        const deltaY = touch.clientY - lastPositionRef.current.y;
        
        // Calculate velocity for momentum
        velocityRef.current.x = deltaY * sensitivity * 0.1;
        velocityRef.current.y = -deltaX * sensitivity * 0.1;
        
        // Update target rotation
        targetRotationRef.current.x += deltaY * sensitivity;
        targetRotationRef.current.y -= deltaX * sensitivity;
        
        // Limit rotation range
        targetRotationRef.current.x = Math.min(Math.max(targetRotationRef.current.x, -45), 45);
        targetRotationRef.current.y = Math.min(Math.max(targetRotationRef.current.y, -45), 45);
        
        lastPositionRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleEnd = () => {
      isDraggingRef.current = false;
      container.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      
      // Re-enable water floating animation
      if (!isAnimating) {
        const cardContainer = document.querySelector('.card-container');
        if (!cardContainer) return;
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isIOS) {
          cardContainer.style.animation = 'floatInWaterIOS 8s ease-in-out infinite';
          cardContainer.style.webkitAnimation = 'floatInWaterIOS 8s ease-in-out infinite';
        } else if (isMobile) {
          cardContainer.style.animation = 'floatInWaterMobile 7s ease-in-out infinite';
          cardContainer.style.webkitAnimation = 'floatInWaterMobile 7s ease-in-out infinite';
        } else {
          cardContainer.style.animation = 'floatInWater 6s ease-in-out infinite';
          cardContainer.style.webkitAnimation = 'floatInWater 6s ease-in-out infinite';
        }
      }
    };
    
    // Mouse hover handlers
    const handleMouseEnter = () => {
      if (isAnimating) return;
      isHovering = true;
      container.style.transition = 'transform 0.3s ease-out';
    };
    
    const handleMouseLeave = () => {
      isHovering = false;
      container.style.transition = 'transform 1s cubic-bezier(0.23, 1, 0.32, 1)';
    };
    
    // Mouse Events
    const onMouseDown = (e) => {
      if (isAnimating) return;
      handleStart(e.clientX, e.clientY);
    };
    
    const onMouseUp = () => handleEnd();
    
    // Touch Events
    const onTouchStart = (e) => {
      if (isAnimating) return;
      // Remove the preventDefault call that's causing Safari warnings
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };
    
    const onTouchEnd = () => handleEnd();
    
    // Add event listeners
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    
    // Clean up
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [hasInitialFlip, isAnimating]);

  useEffect(() => {
    // Explicitly start animations when component mounts
    const startAnimations = () => {
      const cardContainer = document.querySelector('.card-container');
      if (!cardContainer || isAnimating || isFlipped) return;
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        cardContainer.style.animation = 'floatInWaterIOS 8s ease-in-out infinite';
        cardContainer.style.webkitAnimation = 'floatInWaterIOS 8s ease-in-out infinite';
      } else if (isMobile) {
        cardContainer.style.animation = 'floatInWaterMobile 7s ease-in-out infinite';
        cardContainer.style.webkitAnimation = 'floatInWaterMobile 7s ease-in-out infinite';
      } else {
        cardContainer.style.animation = 'floatInWater 6s ease-in-out infinite';
        cardContainer.style.webkitAnimation = 'floatInWater 6s ease-in-out infinite';
      }
    };
    
    // Start animation and set up a periodic check to ensure it keeps running
    startAnimations();
    const animationInterval = setInterval(startAnimations, 2000);
    
    return () => clearInterval(animationInterval);
  }, [isAnimating, isFlipped]);

  return (
    <>
      {/* Completely isolated from main app render cycle */}
      <BackgroundEmojis />
      
    <div className="container">
        <div 
          className="backgroundVideo"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/Images/background.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="blackScreen" />
        
        <div className={`card-container ${isFlipped ? 'flipped' : ''} ${!hasInitialFlip ? 'show-back' : ''}`}>
          <div className="card-flipper">
            {/* Front side with Spotify player */}
            <div 
              ref={containerRef}
              className="music-Container card-front"
              style={{
                backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/Images/card.png)`,
                backgroundSize: '105% 105%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: 'padding-box',
                cursor: hasInitialFlip ? 'grab' : 'default'
              }}
            >
              <iframe 
                style={{ borderRadius: '12px' }}
                src="https://open.spotify.com/embed/artist/3XkauRJ3sLmNpkXWjLhbC3?utm_source=generator&theme=0" 
                width="100%" 
                height="320" 
                frameBorder="0" 
                allowFullScreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="spotify-player"
              />
            </div>
            
            {/* Back side - playing card back */}
            <div 
              className="music-Container card-back"
              style={{
                backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/Images/card.png)`,
                backgroundSize: '115% 115%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: 'padding-box'
              }}
            >
              <div className="card-back-pattern"></div>
            </div>
        </div>
          
          {/* Button to trigger flip */}
          <button className="flip-button" onClick={handleFlipClick} disabled={isAnimating}>
            Get Lucky
          </button>
        </div>
        
        {/* Render confetti when button is clicked */}
        {showConfetti && <Confetti />}
    </div>
    </>
  );
}

export default App;
