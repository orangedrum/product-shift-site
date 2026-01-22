import React from 'react';
import { ExternalLink } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';
import { QuoteBlock } from './QuoteBlock';

const Speaker = () => {
  const handleVideoPlay = () => {
    window.open('https://vimeo.com/203961200?fl=pl&fe=sh', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Sought After
            <span className="bg-marketing-gradient bg-clip-text text-transparent"> Tech Speaker & Podcast Guest</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Video */}
          <div className="relative animate-float">
            <VideoThumbnail 
              imageSrc="/66a8f3cd-cec2-47f4-a67e-1ead53ccdc28.png"
              alt="Jean speaking at conference"
              onPlay={handleVideoPlay}
              label="Watch Speaking Reel"
            />
            
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-marketing-gradient rounded-full opacity-20 animate-pulse blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-brand-pink rounded-full opacity-30 animate-pulse delay-1000 blur-xl"></div>
          </div>

          {/* Right - Testimonial */}
          <div className="text-center lg:text-left">
            <QuoteBlock 
              quote="Jean is an incredible member of the User Experience community in Orlando, Florida. She has educated and inspired her colleagues again and again as an engaging speaker for several events and meetups. As an event organizer, she was a pleasure to work with when speaking at the Downtown UX Conference. It is wonderful to see someone contributing great work to their organization and also pouring out into her community as a subject matter expert."
              author="Matt Lavoie"
              role="UX Designer at NASA"
            />

            <a 
              href="https://orangedrum.com/talks/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-white bg-marketing-gradient hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Schedule Speaking Engagement
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Speaker;