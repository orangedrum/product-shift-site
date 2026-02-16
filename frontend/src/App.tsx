import React from 'react';
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import SmbLandingPage from './pages/SmbLandingPage';
import RealtorLandingPage from './pages/RealtorLandingPage';
import EcommerceLandingPage from './pages/EcommerceLandingPage';
import AiUxAgent from './pages/AiUxAgent';
import MarketingLandingPage from './pages/MarketingLandingPage';
import SmbLandingPageVideo from './pages/SmbLandingPageVideo';
import RealtorLandingPageVideo from './pages/RealtorLandingPageVideo';
import EcommerceLandingPageVideo from './pages/EcommerceLandingPageVideo';
import MarketingLandingPageVideo from './pages/MarketingLandingPageVideo';
import FreeWebsiteAuditSmb from './pages/FreeWebsiteAuditSmb';
import BlogWhyAudit from './pages/BlogWhyAudit';
import AdminDashboard from './pages/AdminDashboard';
import MyAccount from './pages/MyAccount';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import WaitlistPage from './pages/WaitlistPage';
import StyleGuide from './pages/StyleGuidePage';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ReferralClaim from './pages/ReferralClaim';
import NotFound from './pages/NotFound';
import AgencyUserTestingPage from './pages/AgencyUserTestingPage';
import AdminBlog from './components/AdminBlog';
import BlogPost from './components/BlogPost';
import Blog from './components/Blog';


const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Normalize path to handle optional trailing slashes (e.g. /simple-website-checkup/)
  const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1 
    ? location.pathname.slice(0, -1) 
    : location.pathname;
  const isLandingPage = [
    '/simple-website-checkup', 
    '/convert-more-real-estate-website-visitors', 
    '/increase-ecommerce-conversion-rates', 
    '/landingpg-aiuxagent',
    '/simple-website-checkup-video',
    '/convert-more-real-estate-website-visitors-video',
    '/increase-ecommerce-conversion-rates-video',
    '/landingpg-aiuxagent-video',
    '/free-website-audit-for-small-business',
    '/blog/why-small-businesses-need-website-audit',
    '/admin-dashboard',
    '/admin-blog',
    '/login',
    '/styleguide'
  ].includes(normalizedPath);

  // Debugging: Log current path to ensure router is working
  React.useEffect(() => {
    console.log('Current Path:', location.pathname, 'Normalized:', normalizedPath, 'isLandingPage:', isLandingPage);
  }, [location, normalizedPath, isLandingPage]);

  // Global Redirect Handler (e.g. for Magic Links)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirect_to');
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [location.search, navigate]);

  // Scroll handling: Respect hash if present, otherwise scroll to top
  React.useEffect(() => {
    if (location.hash) {
      // Fix: Ignore Supabase auth hashes (access_token, error_description) to prevent querySelector crash
      if (location.hash.includes('access_token') || location.hash.includes('error_description') || location.hash.includes('refresh_token')) {
        console.log('Supabase auth redirect detected. Ignoring hash to prevent crash.');
        return;
      }

      setTimeout(() => {
        try {
          const element = document.querySelector(location.hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (e) {
          console.warn('Invalid hash selector:', location.hash);
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="flex flex-col min-h-screen">
      <GoogleAnalytics />
      {/* We pass session={undefined} so Header fetches it internally */}
      {!isLandingPage && <Header />}
      
      <main className="flex-grow">
        <ErrorBoundary>
        <Routes>
          {/* Homepage */}
          <Route path="/" element={<HomePage />} />

          {/* Marketing Site Pages */}
          <Route path="/agency-user-testing" element={<AgencyUserTestingPage />} />
          
          {/* SMB Landing Page Route (SEO Optimized) */}
          <Route path="/simple-website-checkup" element={<SmbLandingPage />} />
          <Route path="/convert-more-real-estate-website-visitors" element={<RealtorLandingPage />} />
          <Route path="/increase-ecommerce-conversion-rates" element={<EcommerceLandingPage />} />

          <Route path="/landingpg-aiuxagent" element={<MarketingLandingPage />} />
          
          {/* Video Landing Page Variants */}
          <Route path="/simple-website-checkup-video" element={<SmbLandingPageVideo />} />
          <Route path="/convert-more-real-estate-website-visitors-video" element={<RealtorLandingPageVideo />} />
          <Route path="/increase-ecommerce-conversion-rates-video" element={<EcommerceLandingPageVideo />} />
          <Route path="/landingpg-aiuxagent-video" element={<MarketingLandingPageVideo />} />
          <Route path="/free-website-audit-for-small-business" element={<FreeWebsiteAuditSmb />} />
          <Route path="/blog/why-small-businesses-need-website-audit" element={<BlogWhyAudit />} />

          <Route path="/ai-powered-ux" element={<AiUxAgent />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/account" element={<MyAccount />} />
          
          {/* This connects the /login URL to your new Neo-styled Login.tsx */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          
          <Route path="/styleguide" element={<StyleGuide />} />
          <Route path="/payment-success" element={<PaymentConfirmation />} />
          <Route path="/claim-test" element={<ReferralClaim />} />

          <Route path="/admin-blog" element={<AdminBlog />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      
      {isLandingPage ? (
        <footer className="py-6 text-center bg-gray-50 border-t border-gray-200">
          <div className="flex justify-center items-center gap-6">
            <a href="https://www.theproductshift.com" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
              <img src="/Favicon_1Favicon.png" alt="" className="h-5 w-5" />
              <span>Instant Insights by The Product Shift</span>
            </a>
            <span className="text-gray-300">|</span>
            <Link to="/free-website-audit-for-small-business" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Free Website Audit</Link>
            <span className="text-gray-300">|</span>
            <Link to="/blog/why-small-businesses-need-website-audit" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Why Audit?</Link>
            <span className="text-xs text-gray-300 ml-4">v1.1</span>
          </div>
        </footer>
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default App;
