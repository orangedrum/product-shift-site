import React, { useEffect, useRef } from 'react';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { useNavigate } from 'react-router-dom';
import { SpeechBubble } from './SpeechBubble';

const ProductLab = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasFiredConfetti, setHasFiredConfetti] = React.useState(false);

  // Simple Confetti Implementation
  const fireConfetti = () => {
    if (hasFiredConfetti) return;
    setHasFiredConfetti(true);

    const colors = ['#ff1493', '#ff8c00', '#00bfff'];
    const particleCount = 200; // More confetti
    
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');
      // Attach to container instead of body for better positioning control
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '80%'; // Start from bottom
      const size = Math.floor(Math.random() * 10) + 10; // Bigger: 10px to 20px
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius = '50%';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '50'; // Above content
      
      if (containerRef.current) containerRef.current.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 15 + Math.random() * 15; // Faster explosion
      const tx = Math.cos(angle) * velocity * 30;
      const ty = Math.sin(angle) * velocity * 30;

      el.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        // Fly upwards generally (subtract from Y)
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty - 200}px)) scale(0)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 500,
        easing: 'cubic-bezier(0, .9, .57, 1)',
      }).onfinish = () => el.remove();
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fireConfetti();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasFiredConfetti]);

  useEffect(() => {
    const container = containerRef.current;
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
  }, []);

  return (
    <section 
      id="products"
      ref={containerRef}
      className="py-12 border-y-4 border-black relative overflow-hidden bg-white"
    >
      {/* Animated Orbs Background */}
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

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content Card */}
          <NeoCard className="bg-white/95 backdrop-blur-sm text-left">
            <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl mb-2">
              We Also Build Our Services into SaaS Products
            </h2>
            <h3 className="text-xl font-bold text-black mb-6">We're so excited about the launch of our new tool!</h3>
            <p className="text-lg text-gray-700 mb-8">
              Experience the power of our internal tools. We productize our proven methodologies so you can run your own research at scale.
            </p>
            <NeoButton 
              variant="primary" 
              onClick={() => navigate('/agency-user-testing')}
              className="text-lg px-8 py-4 w-full sm:w-auto"
            >
              Try the free demo yourself
            </NeoButton>
          </NeoCard>

          {/* Right: User Bubble */}
          <div className="flex justify-center lg:justify-start">
            <SpeechBubble 
              imageSrc="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah"
              name="Sarah"
              role="Product Manager"
              quote="I used to wait weeks for user feedback. Now I get it in minutes. This tool is a game changer!"
              mood="positive"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductLab;