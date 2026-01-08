import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import MarketingLandingPage from './pages/MarketingLandingPage';
import AiUxAgent from './pages/AiUxAgent';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import StyleGuide from './pages/Styleguide';
import PaymentConfirmation from './pages/PaymentConfirmation';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* We pass session={undefined} so Header fetches it internally */}
      <Header />
      
      <main className="flex-grow">
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<MarketingLandingPage />} />
          
          {/* Specific Landing Page Route (Fixes the "Try Demo" link) */}
          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} />
          
          <Route path="/ai-powered-ux" element={<AiUxAgent />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          {/* This connects the /login URL to your new Neo-styled Login.tsx */}
          <Route path="/login" element={<Login />} />
          
          <Route path="/styleguide" element={<StyleGuide />} />
          <Route path="/payment-success" element={<PaymentConfirmation />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
