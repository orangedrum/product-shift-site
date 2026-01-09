import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MarketingLandingPage from './pages/MarketingLandingPage';
import SmbLandingPage from './pages/SmbLandingPage';
import AiUxAgent from './pages/AiUxAgent';
import AdminDashboard from './pages/AdminDashboard';
import MyAccount from './pages/MyAccount';
import Login from './pages/Login';
import StyleGuide from './pages/Styleguide';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ReferralClaim from './pages/ReferralClaim';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* We pass session={undefined} so Header fetches it internally */}
      <Header />
      
      <main className="flex-grow">
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<HomePage />} />
          
          {/* Specific Landing Page Route (Fixes the "Try Demo" link) */}
          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} />
          
          {/* SMB Landing Page Route */}
          <Route path="/landingpg-instantinsights" element={<SmbLandingPage />} />
          
          <Route path="/ai-powered-ux" element={<AiUxAgent />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/account" element={<MyAccount />} />
          
          {/* This connects the /login URL to your new Neo-styled Login.tsx */}
          <Route path="/login" element={<Login />} />
          
          <Route path="/styleguide" element={<StyleGuide />} />
          <Route path="/payment-success" element={<PaymentConfirmation />} />
          <Route path="/claim-test" element={<ReferralClaim />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
