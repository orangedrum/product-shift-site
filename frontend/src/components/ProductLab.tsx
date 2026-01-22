import React, { useEffect, useRef } from 'react';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { useNavigate } from 'react-router-dom';

const ProductLab = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div className="container mx-auto max-w-4xl text-center py-20 px-4">
        <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl mb-8 relative z-10">
          We Also Build Our Services into SaaS Products
        </h2>
        <NeoCard className="bg-white/90 backdrop-blur-sm relative z-10">
          <p className="text-lg text-gray-700 mb-8">
            Experience the power of our internal tools. We productize our proven methodologies so you can run your own research at scale.
          </p>
          <NeoButton 
            variant="primary" 
            onClick={() => navigate('/agency-user-testing')}
            className="text-lg px-8 py-4"
          >
            Try Our 1-Click User Testing Tool
          </NeoButton>
        </NeoCard>
      </div>
    </section>
  );
};

export default ProductLab;