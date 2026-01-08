import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const navLinks = [
    { name: 'Services', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' }
  ];

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <header className={`bg-white shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="https://www.theproductshift.com" title="Product Shift Home" className="flex items-center gap-3">
              <img className="h-8 w-auto" src="/logo.png" alt="Product Shift" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Product Shift
              </span>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <nav className="flex space-x-10">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-gray-500 hover:text-gray-900 font-normal transition-colors">
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex">
            {displaySession ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 hidden lg:block">
                  {displaySession.user.email}
                </span>
                <button onClick={() => navigate('/account')} className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <User size={20} />
                  My Account
                </button>
                <button onClick={() => supabase.auth.signOut()} className="text-gray-600 hover:text-red-600 font-medium flex items-center gap-2">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <>
                <NeoButton variant="secondary" onClick={handleLogin} className="mr-4">
                  Sign In
                </NeoButton>
                <button 
                  onClick={() => navigate('/landingpg-aiuxagent')}
                  className="inline-flex items-center justify-center font-bold rounded-lg transition-transform transform hover:scale-105 hover:shadow-md py-2 px-5 text-white shadow-sm"
                  style={{ background: 'linear-gradient(to right, #ff8c00, #ff1493)' }}
                >
                  Try Our Instant Insights Tool
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
              {link.name}
            </a>
          ))}
          <div className="mt-2 px-2 pt-2 pb-2 border-t border-gray-200">
            {displaySession ? (
              <div className="space-y-3">
                <div className="px-3 py-2 text-sm font-medium text-gray-500 break-all">
                  {displaySession.user.email}
                </div>
                <button onClick={() => navigate('/account')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  My Account
                </button>
                <button onClick={() => supabase.auth.signOut()} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={handleLogin} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/landingpg-aiuxagent')}
                  className="w-full text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-sm"
                  style={{ background: 'linear-gradient(to right, #ff8c00, #ff1493)' }}
                >
                  Try Our Instant Insights Tool
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