import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mail, Loader2, PenTool } from 'lucide-react';

const BlogLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [bgGradient, setBgGradient] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Set background gradient
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Redirect back to the Admin Blog after login
    const redirectTo = `${window.location.origin}/admin-blog`;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send login email');

      setMessage('Check your email for the magic link!');
      setIsSuccess(true);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 transition-colors duration-500"
      style={{ background: bgGradient || '#f3f4f6' }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-black rounded-full mb-4 shadow-lg">
            <PenTool className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-black mb-2">Blog Publisher</h1>
          <p className="text-lg font-bold text-black uppercase tracking-wider">Secure Sign In</p>
        </div>
        <NeoCard>
          <p className="text-gray-600 mb-6">Enter your admin email to verify write permissions.</p>
          
          {message && (
            <div className={`p-4 mb-6 border-2 rounded-lg font-bold text-center animate-fade-in ${isSuccess ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
              {message}
            </div>
          )}

          {!isSuccess && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin@theproductshift.com"
                  required
                />
              </div>
              <NeoButton type="submit" className="w-full justify-center" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Mail size={18} className="mr-2" /> Send Magic Link</>}
              </NeoButton>
            </form>
          )}
        </NeoCard>
      </div>
    </div>
  );
};

export default BlogLogin;