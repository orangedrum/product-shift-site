import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { Header } from '../components/Header';
import { CheckCircle, AlertCircle, User, LogIn, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StyleGuide: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [bgGradient, setBgGradient] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive background (Shared Logic)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const x = e.clientX;
        const y = e.clientY;
        containerRef.current.style.setProperty('--mouse-x', `${x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Randomize background on mount (Shared Logic)
  useEffect(() => {
    const r = () => Math.floor(Math.random() * 100);
    setBgGradient(`
      radial-gradient(1750px circle at 100% 0%, #ff1493 0%, #ff1493 40%, #ff0000 60%, transparent 80%),
      radial-gradient(at ${r()}% ${r()}%, #ff8c00 0%, transparent 50%),
      radial-gradient(at ${r()}% ${r()}%, #ff1493 0%, transparent 50%),
      radial-gradient(at ${r()}% ${r()}%, #ff0000 0%, transparent 50%),
      #ffffff
    `);
  }, []);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Shared Admin Auth Logic
  useEffect(() => {
    const storedKey = localStorage.getItem('adminSecretKey');
    if (storedKey) {
      setSecretKey(storedKey);
      verifyKey(storedKey);
    }
  }, []);

  const verifyKey = async (key: string) => {
    try {
      // We use the stats endpoint just to verify the key is valid
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminSecretKey', key);
      } else {
        throw new Error('Invalid Key');
      }
    } catch (e) {
      setIsAuthenticated(false);
      setAuthError('Invalid admin key');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyKey(secretKey);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <NeoCard className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-black mb-2">Restricted Access</h1>
            <p className="text-gray-600">Enter the Admin Key to view the Style Guide.</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] transition-all"
              placeholder="Secret Key"
            />
            {authError && <p className="text-red-600 font-bold text-sm">{authError}</p>}
            <NeoButton type="submit" className="w-full">
              Unlock Style Guide
            </NeoButton>
          </form>
        </NeoCard>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen transition-colors duration-500"
      style={{
        background: bgGradient || '#ffffff'
      }}
    >
      {/* Header Demo Section */}
      <div className="bg-white border-b border-gray-200 mb-12">
        <div className="container mx-auto px-4 py-4">
            <h2 className="text-2xl font-bold mb-4">Header: Logged Out</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
                <Header session={null} className="relative" />
            </div>

            <h2 className="text-2xl font-bold mb-4">Header: Logged In</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Header session={{ user: { email: 'demo@productshift.com' } }} className="relative" />
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="max-w-4xl mx-auto space-y-12">
        
        <section>
          <h1 className="text-4xl font-black mb-8 text-black">Product Shift Style Guide</h1>
          <NeoCard title="NeoButton Components">
            <div className="flex flex-wrap gap-4 items-center">
              <NeoButton variant="primary">Primary Action</NeoButton>
              <NeoButton variant="secondary">Secondary Action</NeoButton>
              <NeoButton variant="danger">Danger Zone</NeoButton>
              <NeoButton variant="ghost">Ghost Button</NeoButton>
              <NeoButton variant="primary" disabled>Disabled</NeoButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <NeoButton variant="primary" icon={<CheckCircle size={18} />}>With Icon</NeoButton>
              <NeoButton variant="secondary" icon={<User size={18} />}>Account</NeoButton>
              <NeoButton variant="secondary" icon={<LogIn size={18} />}>Sign In</NeoButton>
            </div>
          </NeoCard>
        </section>

        <section>
          <NeoCard title="NeoCard Component">
            <p className="text-black mb-4">
              This is a standard <strong>NeoCard</strong>. It handles the border, shadow, and padding automatically.
              It also supports an optional title header.
            </p>
            <div className="p-4 bg-gray-100 border-2 border-black rounded-lg">
              Nested content works perfectly.
            </div>
          </NeoCard>
        </section>

        {/* --- MERGED LEGACY SECTIONS --- */}

        {/* Application Routes (Site Map) Section */}
        <section>
          <NeoCard title="Application Routes (Site Map)">
            <p className="mb-4 text-gray-600">Full directory of application pages and landing pages.</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-black mb-2 border-b-2 border-gray-200 pb-1">Core App</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/" className="text-blue-600 hover:underline font-semibold">Homepage</Link>
                    <code className="text-xs text-gray-500 ml-2 bg-gray-100 p-1 rounded">/</code>
                  </li>
                  <li>
                    <Link to="/ai-powered-ux" className="text-blue-600 hover:underline font-semibold">AI UX Agent (Tool)</Link>
                    <code className="text-xs text-gray-500 ml-2 bg-gray-100 p-1 rounded">/ai-powered-ux</code>
                  </li>
                  <li>
                    <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login / Sign Up</Link>
                    <code className="text-xs text-gray-500 ml-2 bg-gray-100 p-1 rounded">/login</code>
                  </li>
                  <li>
                    <Link to="/account" className="text-blue-600 hover:underline font-semibold">My Account</Link>
                    <code className="text-xs text-gray-500 ml-2 bg-gray-100 p-1 rounded">/account</code>
                  </li>
                  <li>
                    <Link to="/admin-dashboard" className="text-blue-600 hover:underline font-semibold">Admin Dashboard</Link>
                    <code className="text-xs text-gray-500 ml-2 bg-gray-100 p-1 rounded">/admin-dashboard</code>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-black mb-2 border-b-2 border-gray-200 pb-1">Marketing Landing Pages</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/simple-website-checkup" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      SMB Checkup ↗
                    </a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/simple-website-checkup</code>
                  </li>
                  <li>
                    <a href="/convert-more-real-estate-website-visitors" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      Real Estate ↗
                    </a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/convert-more-real-estate-website-visitors</code>
                  </li>
                  <li>
                    <a href="/increase-ecommerce-conversion-rates" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      E-commerce ↗
                    </a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/increase-ecommerce-conversion-rates</code>
                  </li>
                  <li>
                    <Link to="/landingpg-aiuxagent" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      Tech / UX Landing (Original) ↗
                    </Link>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/landingpg-aiuxagent</code>
                  </li>
                </ul>
              </div>
            </div>
          </NeoCard>
        </section>

        {/* Typography Section */}
        <section>
          <NeoCard title="Typography & Fonts">
            {/* Headings */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-black">Headings</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hero Heading</p>
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#ff8c00] via-[#ff1493] to-[#00bfff]">
                    Aa - The quick brown fox
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hero Heading (Solid)</p>
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-black">Aa - The quick brown fox</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Section Heading</p>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">Aa - The quick brown fox</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Card/Item Title</p>
                  <p className="text-lg font-semibold text-black">Aa - The quick brown fox</p>
                </div>
              </div>
            </div>

            {/* Body Text */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-black">Body & Paragraphs</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">XL Body (Sub-heading)</p>
                  <p className="text-xl text-gray-500">The quick brown fox jumps over the lazy dog. A versatile paragraph style for introductory content.</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Base Body (Standard)</p>
                  <p className="text-base text-gray-600">The quick brown fox jumps over the lazy dog. This is the default paragraph style.</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-black">Tags & Pills</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full">Primary Tag</span>
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Secondary Tag</span>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  <Sparkles size={14} />
                  Icon Badge
                </div>
              </div>
            </div>
          </NeoCard>
        </section>

        {/* Legacy Buttons Section */}
        <section>
          <NeoCard title="Legacy Buttons & CTAs">
            <div>
              <h3 className="font-semibold mb-4 text-black">Standard Buttons</h3>
              <div className="flex flex-wrap gap-4 items-center">
                  <button className="inline-flex items-center justify-center bg-gradient-to-br from-[#ff8c00] via-[#ff1493] to-[#00bfff] text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md">
                    Primary Gradient
                  </button>
                  <button className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    Primary Solid
                  </button>
                  <button className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-5 rounded-lg border border-gray-200 shadow-sm transition-transform transform hover:scale-105">
                    Secondary
                  </button>
              </div>
            </div>
          </NeoCard>
        </section>

        {/* --- END MERGED SECTIONS --- */}

        <section>
          <NeoCard>
            <h3 className="text-xl font-bold mb-2">Card without Title</h3>
            <p>Sometimes you just need a simple container.</p>
          </NeoCard>
        </section>

      </div>
    </div>
    </div>
  );
};

export default StyleGuide;
