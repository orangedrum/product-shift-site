import React from 'react';
import { NeoCard } from './NeoCard';
import { NeoButton } from './NeoButton';
import { useNavigate } from 'react-router-dom';
import { SpeechBubble } from './SpeechBubble';
import { LavalampBackground } from './LavalampBackground';

const ProductLab = () => {
  const navigate = useNavigate();

  return (
    <div id="products">
      <LavalampBackground className="py-12 border-y-4 border-black">
      <div className="container mx-auto max-w-6xl px-4">
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
              role="Freelancer"
              quote="Our budget rarely afforded testing with real humans. Now we can use synthesized tests whenever we need them. Instantly!"
              mood="positive"
            />
          </div>
        </div>
      </div>
    </LavalampBackground>
    </div>
  );
};

export default ProductLab;
