import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { CheckCircle, AlertCircle, User, LogIn, LogOut } from 'lucide-react';
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

        <section>
          <NeoCard>
            <h3 className="text-xl font-bold mb-2">Card without Title</h3>
            <p>Sometimes you just need a simple container.</p>
          </NeoCard>
        </section>

      </div>
    </div>
  );
};

export default StyleGuide;