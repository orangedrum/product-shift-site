import Header from './components/Header';
import Hero from './components/Hero';
import IncubatorRibbon from './components/IncubatorRibbon';
import CoreServices from './components/CoreServices';
import AgencyPartner from './components/AgencyPartner';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main>
        <Hero />
        <IncubatorRibbon />
        <CoreServices />
        <AgencyPartner />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export default App