import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingHero from '../components/MarketingHero';

const AiUixAgentLandingPage: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <MarketingHero />
        {/* We will add other sections like Features, Testimonials, and Pricing here */}
      </main>
      <Footer />
    </>
  );
};

export default AiUixAgentLandingPage;