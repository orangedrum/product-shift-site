import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { CheckCircle, AlertCircle, User, LogIn, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StyleGuide: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div 
      ref={containerRef}
      className="min-h-screen transition-colors duration-500"
      style={{
        background: bgGradient || '#ffffff'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header / Auth Bar */}
        <div className="flex justify-end mb-12 relative z-20">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-sm font-bold text-black bg-white px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                {session.user.email}
              </span>
              <NeoButton variant="secondary" onClick={() => navigate('/account')} icon={<User size={16} />}>
                My Account
              </NeoButton>
              <NeoButton variant="secondary" onClick={() => supabase.auth.signOut()} icon={<LogOut size={16} />}>
                Sign Out
              </NeoButton>
            </div>
          ) : (
            <NeoButton variant="secondary" onClick={() => navigate('/')} icon={<LogIn size={18} />}>
              Sign In
            </NeoButton>
          )}
        </div>

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

        {/* Application Routes Section */}
        <section>
          <NeoCard title="Application Routes">
            <p className="mb-4 text-gray-600">Use these links to navigate to the main pages of the application and avoid URL typos.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <Link to="/" className="text-blue-600 hover:underline font-semibold">Homepage</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/</code>
              </li>
              <li>
                <Link to="/ai-powered-ux" className="text-blue-600 hover:underline font-semibold">AI UX Agent</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/ai-powered-ux</code>
              </li>
              <li>
                <Link to="/landingpg-aiuxagent" className="text-blue-600 hover:underline font-semibold">AI Agent Landing Page</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/landingpg-aiuxagent</code>
              </li>
              <li>
                <Link to="/admin-dashboard" className="text-blue-600 hover:underline font-semibold">Admin Dashboard</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/admin-dashboard</code>
              </li>
            </ul>
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