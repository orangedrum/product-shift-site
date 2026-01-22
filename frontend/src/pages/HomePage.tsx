import React from 'react';
import Hero from '../components/Hero';
import IncubatorRibbon from '../components/IncubatorRibbon';
import CoreServices from '../components/CoreServices';
import AgencyPartner from '../components/AgencyPartner';
import FinalCta from '../components/FinalCta';
import Speaker from '../components/Speaker';

const HomePage = () => {
  return (
    <>
      <Hero />
      <IncubatorRibbon />
      <AgencyPartner />
      <CoreServices />
      <Speaker />
      <FinalCta />
    </>
  );
};

export default HomePage;