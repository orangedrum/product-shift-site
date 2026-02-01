import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, Palette, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Blog Admin', href: '/admin-blog', icon: PenTool },
    { name: 'Styleguide', href: '/styleguide', icon: Palette },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Admin<span className="text-indigo-400">Console</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                  isActive(item.href) 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              View Site <ExternalLink size={14} />
            </a>
            <div className="h-6 w-px bg-gray-700"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${
                  isActive(item.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-700 my-2 pt-2">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700 flex items-center gap-3"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;