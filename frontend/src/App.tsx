import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SmbLandingPage from './pages/SmbLandingPage';
import RealtorLandingPage from './pages/RealtorLandingPage';
import EcommerceLandingPage from './pages/EcommerceLandingPage';
import AiUxAgent from './pages/AiUxAgent';
import MarketingLandingPage from './pages/MarketingLandingPage';
import AdminDashboard from './pages/AdminDashboard';
import MyAccount from './pages/MyAccount';
import Login from './pages/Login';
import WaitlistPage from './pages/WaitlistPage';
import StyleGuide from './pages/Styleguide';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ReferralClaim from './pages/ReferralClaim';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const location = useLocation();
  // Normalize path to handle optional trailing slashes (e.g. /simple-website-checkup/)
  const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1 
    ? location.pathname.slice(0, -1) 
    : location.pathname;
  const isLandingPage = ['/simple-website-checkup', '/convert-more-real-estate-website-visitors', '/increase-ecommerce-conversion-rates', '/landingpg-aiuxagent'].includes(normalizedPath);

  return (
    <div className="flex flex-col min-h-screen">
      {/* We pass session={undefined} so Header fetches it internally */}
      {!isLandingPage && <Header />}
      
      <main className="flex-grow">
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<HomePage />} />
          
          {/* SMB Landing Page Route (SEO Optimized) */}
          <Route path="/simple-website-checkup" element={<SmbLandingPage />} />
          <Route path="/convert-more-real-estate-website-visitors" element={<RealtorLandingPage />} />
          <Route path="/increase-ecommerce-conversion-rates" element={<EcommerceLandingPage />} />

          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} />
          <Route path="/ai-powered-ux" element={<AiUxAgent />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/account" element={<MyAccount />} />
          
          {/* This connects the /login URL to your new Neo-styled Login.tsx */}
          <Route path="/login" element={<Login />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          
          <Route path="/styleguide" element={<StyleGuide />} />
          <Route path="/payment-success" element={<PaymentConfirmation />} />
          <Route path="/claim-test" element={<ReferralClaim />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {isLandingPage ? (
        <footer className="py-8 text-center bg-gray-50 border-t border-gray-200">
          <a href="https://www.theproductshift.com" className="inline-flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            <img src="/Favicon_1Favicon.png" alt="" className="h-5 w-5" />
            <span>Instant Insights by The Product Shift</span>
          </a>
        </footer>
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default App;
