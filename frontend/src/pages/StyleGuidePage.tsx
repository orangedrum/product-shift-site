import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NeoButton, NeoButtonProps } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle, AlertCircle, User, LogIn, LogOut, Sparkles, VolumeX, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StyleGuide: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [bgGradient, setBgGradient] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'product'>('public');

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

  const VideoPlayerExample = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted]);

    return (
      <div 
        className="relative w-full max-w-lg mx-auto"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className="rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden bg-white">
          <video 
            ref={videoRef}
            src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" // Using the provided video URL
            autoPlay 
            loop 
            playsInline 
            className="w-full h-auto block"
          />
        </div>
        {showControls && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors z-10"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}
      </div>
    );
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
      className={`min-h-screen transition-colors duration-500 ${activeTab === 'public' ? 'bg-gray-50' : ''}`}
      style={{
        background: activeTab === 'product' ? (bgGradient || '#ffffff') : undefined
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="max-w-4xl mx-auto space-y-12">
        
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4 text-black">Product Shift Style Guide</h1>
          <p className="text-gray-600 mb-8">Design systems for our marketing site and application.</p>
          
          {/* Tab Navigation */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab('public')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'public' 
                  ? 'bg-white text-black shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Public / Marketing
            </button>
            <button
              onClick={() => setActiveTab('product')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'product' 
                  ? 'bg-white text-black shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Product / App
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* PUBLIC / MARKETING SECTION                 */}
        {/* ========================================== */}
        {activeTab === 'public' && (
          <div className="space-y-12 animate-fade-in">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Global Header (Public)</h2>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">components/Header.tsx</span>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <Header session={null} className="relative" />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Color Palette</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#ff8c00] shadow-sm"></div>
                  <p className="text-xs font-mono">brand-orange (#ff8c00)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#ff1493] shadow-sm"></div>
                  <p className="text-xs font-mono">brand-pink (#ff1493)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-[#00bfff] shadow-sm"></div>
                  <p className="text-xs font-mono">brand-lightblue (#00bfff)</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-marketing-gradient shadow-sm"></div>
                  <p className="text-xs font-mono">marketing-gradient</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-orange-pink-gradient shadow-sm"></div>
                  <p className="text-xs font-mono">orange-pink-gradient</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Typography & Fonts</h2>
              <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hero Heading</p>
                  <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#ff8c00] via-[#ff1493] to-[#00bfff]">
                    Aa - The quick brown fox
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Section Heading</p>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">Aa - The quick brown fox</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Body Text</p>
                  <p className="text-base text-gray-600">The quick brown fox jumps over the lazy dog. This is the default paragraph style used in marketing sections.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Tags & Pills</h2>
              <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-lg border border-gray-200">
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full">Primary Tag</span>
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Secondary Tag</span>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  <Sparkles size={14} />
                  Icon Badge
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Marketing Buttons</h2>
              <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-lg border border-gray-200">
                  {/* Primary Gradient (Lovable Style) */}
                  <button className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-white bg-marketing-gradient hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    Primary Gradient
                  </button>
                  
                  {/* Primary Solid */}
                  <button className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform transform hover:scale-105">
                    Primary Solid
                  </button>
                  
                  {/* Secondary Outline */}
                  <button className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-all duration-300">
                    Secondary
                  </button>

                  {/* Ghost */}
                  <button className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Ghost Button
                  </button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Global Footer</h2>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">components/Footer.tsx</span>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <Footer />
              </div>
            </section>
          </div>
        )}

        {/* ========================================== */}
        {/* PRODUCT / APP SECTION                      */}
        {/* ========================================== */}
        {activeTab === 'product' && (
          <div className="space-y-12 animate-fade-in">
            
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">App Header (Logged In)</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">components/Header.tsx</span>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Header session={{ user: { email: 'demo@productshift.com' } }} className="relative" />
          </div>
        </section>

        <section>
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

        {/* Video Player Component */}
        <section>
          <NeoCard title="Video Player Component">
            <p className="text-black mb-4">
              This is a reusable video player component with a hover-activated mute/unmute button.
            </p>
            <VideoPlayerExample />
          </NeoCard>
        </section>

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
                  <li className="mt-4 border-t pt-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video Variants</span>
                  </li>
                  <li>
                    <a href="/simple-website-checkup-video" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">SMB Video ↗</a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/simple-website-checkup-video</code>
                  </li>
                  <li>
                    <a href="/convert-more-real-estate-website-visitors-video" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">Real Estate Video ↗</a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/convert-more-real-estate-website-visitors-video</code>
                  </li>
                  <li>
                    <a href="/increase-ecommerce-conversion-rates-video" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">E-commerce Video ↗</a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/increase-ecommerce-conversion-rates-video</code>
                  </li>
                  <li>
                    <a href="/landingpg-aiuxagent-video" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">Tech Video ↗</a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/landingpg-aiuxagent-video</code>
                  </li>
                  <li className="mt-4 border-t pt-2">
                    <a href="/free-website-audit-for-small-business" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      Free Website Audit (SMB) ↗
                    </a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/free-website-audit-for-small-business</code>
                  </li>
                  <li>
                    <a href="/blog/why-small-businesses-need-website-audit" target="_blank" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                      Blog: Why Audit? ↗
                    </a>
                    <code className="text-xs text-gray-500 bg-gray-100 p-1 rounded block mt-1 truncate">/blog/why-small-businesses-need-website-audit</code>
                  </li>
                </ul>
              </div>
            </div>
          </NeoCard>
        </section>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default StyleGuide;