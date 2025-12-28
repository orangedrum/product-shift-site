import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Styleguide from './pages/Styleguide';
import AiUxAgent from './pages/AiUxAgent'; 
import MarketingLandingPage from './pages/MarketingLandingPage'; 
import HomePage from './pages/HomePage';
import WaitlistPage from './pages/WaitlistPage';

function App() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="/ai-powered-ux-healthtech" element={<AiUxAgent />} /> 
          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} /> 
          <Route path="/waitlist" element={<WaitlistPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App