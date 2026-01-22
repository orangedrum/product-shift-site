import React from 'react';
import Hero from '../components/Hero';
import IncubatorRibbon from '../components/IncubatorRibbon';
import CoreServices from '../components/CoreServices';
import AgencyPartner from '../components/AgencyPartner';
import ProductLab from '../components/ProductLab';
import Speaker from '../components/Speaker';
import About from '../components/About';
import Blog from '../components/Blog';
import CTA from '../components/CTA';

const HomePage = () => {
  return (
    <>
      <Hero />
      <IncubatorRibbon />
      <AgencyPartner />
      <ProductLab />
      <CoreServices />
      <Speaker />
      <About />
      <Blog />
      <CTA />
    </>
  );
};

export default HomePage;