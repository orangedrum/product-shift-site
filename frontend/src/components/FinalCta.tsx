import React, { useEffect, useRef } from 'react';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { useNavigate } from 'react-router-dom';

const FinalCta = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const updateGradient = () => {
      if (container) {
        const r = () => Math.floor(Math.random() * 100);
        container.style.setProperty('--pos-x-1', `${r()}%`);
        container.style.setProperty('--pos-y-1', `${r()}%`);
        container.style.setProperty('--pos-x-2', `${r()}%`);
        container.style.setProperty('--pos-y-2', `${r()}%`);
      }
    };
    updateGradient();
    const interval = setInterval(updateGradient, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="py-24 transition-colors duration-500"
      style={{
        background: `radial-gradient(at var(--pos-x-1, 50%) var(--pos-y-1, 50%), #ff8c00 0%, transparent 50%), radial-gradient(at var(--pos-x-2, 20%) var(--pos-y-2, 80%), #ff1493 0%, transparent 50%), #000000`,
        transition: '--pos-x-1 3s ease, --pos-y-1 3s ease, --pos-x-2 3s ease, --pos-y-2 3s ease'
      }}
    >
      <div className="container mx-auto max-w-4xl text-center py-20 px-4">
        <NeoCard className="bg-white/95 backdrop-blur-sm">
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl mb-6">
            We Also Build Our Services into SaaS Products
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Experience the power of our internal tools. We productize our proven methodologies so you can run your own research at scale.
          </p>
          <NeoButton 
            variant="primary" 
            onClick={() => navigate('/landingpg-aiuxagent')}
            className="text-lg px-8 py-4"
          >
            Try Our Instant Insights Tool
          </NeoButton>
        </NeoCard>
      </div>
    </section>
  );
};

export default FinalCta;