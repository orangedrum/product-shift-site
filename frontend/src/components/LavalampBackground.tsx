import React, { useEffect, useRef } from 'react';

interface LavalampBackgroundProps {
  children: React.ReactNode;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const LavalampBackground: React.FC<LavalampBackgroundProps> = ({ 
  children, 
  className = '',
  containerRef
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || internalRef;
  const hasFiredConfettiRef = useRef(false);

  // Lavalamp Orbs Effect
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const updateOrbs = () => {
      const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      for (let i = 1; i <= 6; i++) {
        container.style.setProperty(`--orb-${i}-x`, `${r(-20, 120)}%`);
        container.style.setProperty(`--orb-${i}-y`, `${r(-20, 120)}%`);
      }
    };

    updateOrbs();
    const interval = setInterval(updateOrbs, 4000);
    return () => clearInterval(interval);
  }, [ref]);

  // Confetti Effect
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const fireConfetti = () => {
      if (hasFiredConfettiRef.current) return;
      hasFiredConfettiRef.current = true;

      const colors = ['#ff1493', '#ff8c00', '#00bfff'];
      const particleCount = 200;
      
      for (let i = 0; i < particleCount; i++) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.top = '80%';
        const size = Math.floor(Math.random() * 10) + 10;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '50';
        
        if (container) container.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 20;
        const tx = Math.cos(angle) * velocity * 30;
        const ty = Math.sin(angle) * velocity * 30;

        el.animate([
          { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1, offset: 0 },
          { transform: `translate(calc(-50% + ${tx * 0.5}px), calc(-50% + ${ty * 0.5}px)) scale(1.2)`, opacity: 1, offset: 0.1 },
          { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty - 150}px)) scale(0.5)`, opacity: 0, offset: 1 }
        ], {
          duration: 2000 + Math.random() * 1000,
          easing: 'linear',
        }).onfinish = () => el.remove();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fireConfetti();
        }
      },
      { threshold: 0.5 }
    );

    if (container) {
      observer.observe(container);
    }

    return () => observer.disconnect();
  }, [ref]);

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden bg-white ${className}`}
    >
      {/* Animated Orbs Background (Lavalamp Effect) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-all duration-[4000ms] ease-in-out"
            style={{
              left: `var(--orb-${i+1}-x, 50%)`,
              top: `var(--orb-${i+1}-y, 50%)`,
              width: `${300 + (i * 20)}px`,
              height: `${300 + (i * 20)}px`,
              backgroundColor: ['#ff1493', '#ff0000', '#ff8c00'][i % 3]
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};