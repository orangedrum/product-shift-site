import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mail, Loader2, ShieldCheck } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Direct Supabase Auth - No "Traffic Cop" logic
      // This simply sends a magic link to the email provided
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // CTO FIX: Use root origin + query param to bypass strict path whitelisting
          emailRedirectTo: `${window.location.origin}?redirect_to=/admin-blog`,
        },
      });

      if (error) throw error;

      setMessage('Check your email for the admin magic link!');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-900 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Admin Access</h1>
          <p className="text-gray-400 mt-2">Secure login for blog & content management.</p>
        </div>

        <NeoCard className="bg-white">
          {message ? (
            <div className="p-4 bg-green-50 border-2 border-green-500 text-green-800 rounded-lg font-bold text-center">
              {message}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Admin Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin@productshift.com"
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

export default AdminLogin;