import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NeoButton } from './NeoButton';

interface HeaderProps {
  session?: any;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ session, className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [internalSession, setInternalSession] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Self-Healing: If no session prop is passed (Global Header), fetch it ourselves.
  useEffect(() => {
    if (session !== undefined) return; // Prop takes precedence

    supabase.auth.getSession().then(({ data: { session } }) => {
      setInternalSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setInternalSession(session);
    });

    return () => subscription.unsubscribe();
  }, [session]);

  const displaySession = session !== undefined ? session : internalSession;

  // --- GLOBAL AUTH BRIDGE: Sync Session to Cookie for Extension ---
  useEffect(() => {
    if (displaySession && displaySession.access_token) {
      const cookieName = 'sb-productshift-auth-token';
      // Format matches what the backend expects: JSON array with access_token
      const cookieValue = JSON.stringify([{
        access_token: displaySession.access_token,
        refresh_token: displaySession.refresh_token,
        user: displaySession.user
      }]);
      
      // Critical: SameSite=None; Secure is required for the extension to send this cookie cross-origin
      console.log('🍪 [Header] Syncing Auth Cookie for Extension...');
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=604800; SameSite=None; Secure`;
    }
  }, [displaySession]);

  const navLinks = displaySession ? [
    { name: 'AI Tester Tool', href: '/ai-powered-ux' },
  ] : [
    { name: 'Services', href: '#services' },
    { name: 'Products', href: '#products' },
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' }
  ];

  const handleLogin = () => {
    // Smart Redirect: If on the SMB landing page, pass the segment param to the login page
    if (location.pathname.includes('instantinsights')) {
      navigate('/login?segment=smb');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate('/' + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      setIsMenuOpen(false);
    }
  };

  return (
    <header className={`${displaySession ? 'bg-black' : 'bg-white shadow-sm'} sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className={`flex-shrink-0 ${displaySession ? 'bg-white rounded-xl px-3 py-1' : ''}`}>
            <Link to="/" title="Product Shift Home" className="flex items-center gap-3">
              <img className="h-8 w-auto" src="/logo.png" alt="Product Shift" />
              <span className={`text-xl font-bold tracking-tight ${displaySession ? 'text-black' : 'text-gray-900'}`}>
                Product Shift
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <nav className="flex space-x-10">
              {navLinks.map((link) => (
                link.href.startsWith('/') ? (
                  <Link key={link.name} to={link.href} className={`${displaySession ? 'text-white hover:text-gray-300' : 'text-gray-500 hover:text-gray-900'} font-normal transition-colors`}>
                    {link.name}
                  </Link>
                ) : (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`${displaySession ? 'text-white hover:text-gray-300' : 'text-gray-500 hover:text-gray-900'} font-normal transition-colors`}
                  >
                    {link.name}
                  </a>
                )
              ))}
            </nav>
          </div>
          <div className="hidden lg:flex">
            {displaySession ? (
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium hidden lg:block ${displaySession ? 'text-white' : 'text-gray-700'}`}>
                  {displaySession.user.email}
                </span>
                <button onClick={() => navigate('/account')} className={`${displaySession ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-indigo-600'} font-medium flex items-center gap-2`} title="My Account">
                  <User size={20} />
                </button>
                <NeoButton variant="secondary" onClick={handleLogout} className="h-9 px-4 text-sm">
                  Sign Out
                </NeoButton>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/agency-user-testing')}
                  className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-white bg-marketing-gradient shadow-sm transition-transform transform hover:scale-105 hover:shadow-md mr-4"
                >
                  Try Our Demo
                </button>
                <NeoButton variant="secondary" onClick={handleLogin} className="h-9 px-4 text-sm">
                  Sign In
                </NeoButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`inline-flex items-center justify-center p-2 rounded-md ${displaySession ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none`}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className={`lg:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 ${displaySession ? 'bg-black' : 'bg-white'}`}>
          {navLinks.map((link) => (
            link.href.startsWith('/') ? (
              <Link key={link.name} to={link.href} className={`block px-3 py-2 rounded-md text-base font-medium ${displaySession ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}>
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleNavClick(e, link.href)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${displaySession ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {link.name}
              </a>
            )
          ))}
          <div className="mt-2 px-2 pt-2 pb-2 border-t border-gray-200">
            {displaySession ? (
              <div className="space-y-3">
                <div className={`px-3 py-2 text-sm font-medium break-all ${displaySession ? 'text-gray-400' : 'text-gray-500'}`}>
                  {displaySession.user.email}
                </div>
                <button onClick={() => navigate('/account')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${displaySession ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}>
                  My Account
                </button>
                <button onClick={handleLogout} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${displaySession ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/agency-user-testing')}
                  className="w-full h-11 rounded-md px-8 text-sm font-medium text-white bg-marketing-gradient shadow-sm transition-transform transform hover:scale-105"
                >
                  Try Our Demo
                </button>
                <button onClick={handleLogin} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Sign In
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;