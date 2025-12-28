import React from 'react';
import MarketingHero from '../components/MarketingHero';
import IncubatorRibbon from '../components/IncubatorRibbon';
import CoreServices from '../components/CoreServices';
import AgencyPartner from '../components/AgencyPartner';
import FinalCta from '../components/FinalCta';

const HomePage = () => {
  return (
    <>
      <MarketingHero />
      <IncubatorRibbon />
      <CoreServices />
      <AgencyPartner />
      <FinalCta />
    </>
  );
};

export default HomePage;