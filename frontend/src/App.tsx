import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Styleguide from './pages/Styleguide';
import AiUxAgent from './pages/AiUxAgent'; 
import MarketingLandingPage from './pages/MarketingLandingPage'; 
import HomePage from './pages/HomePage';
import WaitlistPage from './pages/WaitlistPage';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="/ai-powered-ux" element={<AiUxAgent />} /> 
          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} /> 
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          
          {/* Redirects & Fallbacks */}
          <Route path="/ai-powered-ux-healthtech" element={<Navigate to="/ai-powered-ux" replace />} />
          <Route path="*" element={<div className="text-center py-20"><h1 className="text-4xl font-bold">404</h1><p>Page not found</p></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App