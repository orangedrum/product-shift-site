import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Services', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
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
            <button className="inline-flex items-center justify-center bg-gradient-to-br from-brand-orange via-brand-pink to-brand-lightblue text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md">
              Book Free Consultation
            </button>
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
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Book a Call
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;