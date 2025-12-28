import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Styleguide from './pages/Styleguide';
import AiPoweredUxHealthtech from './pages/AiPoweredUxHealthtech';
import AiUixAgentLandingPage from './pages/AiUixAgentLandingPage';
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
          <Route path="/ai-powered-ux-healthtech" element={<AiPoweredUxHealthtech />} />
          <Route path="/product-landing" element={<AiUixAgentLandingPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App