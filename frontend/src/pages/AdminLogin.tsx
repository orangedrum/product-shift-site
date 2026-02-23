import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { ShieldCheck, Loader2 } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verify key against the stats endpoint (same as Dashboard)
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${secretKey}` }
      });

      if (res.ok) {
        localStorage.setItem('productShiftAdminKey', secretKey);
        navigate('/admin-dashboard');
      } else {
        throw new Error('Invalid Admin Key');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
          <p className="text-gray-400 mt-2">Enter your secret key to continue.</p>
        </div>

        <NeoCard className="bg-white">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Secret Key</label>
              <input 
                type="password" 
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter Admin PIN..."
                required
              />
            </div>
            {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
            <NeoButton type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Unlock Dashboard'}
            </NeoButton>
          </form>
        </NeoCard>
      </div>
    </div>
  );
};

export default AdminLogin;
