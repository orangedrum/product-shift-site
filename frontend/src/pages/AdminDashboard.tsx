import React, { useEffect, useState } from 'react';
import { BarChart, Users, AlertTriangle, DollarSign, CreditCard } from 'lucide-react';

type Stats = {
  dailyUsage: number;
  waitlistCount: number;
  recentErrors: { created_at: string; error_message: string }[];
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${secretKey}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.message);
      setIsAuthenticated(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-md py-24 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="secret" className="sr-only">Secret Key</label>
            <input
              type="password"
              id="secret"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter admin secret key"
            />
          </div>
          <button type="submit" className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md">Authenticate</button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <BarChart className="text-indigo-500" size={32} />
            <div>
              <p className="text-sm text-gray-500">Today's Demo Usage</p>
              <p className="text-3xl font-bold">{stats?.dailyUsage ?? 0} / 25</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <Users className="text-green-500" size={32} />
            <div>
              <p className="text-sm text-gray-500">Waitlist Signups</p>
              <p className="text-3xl font-bold">{stats?.waitlistCount ?? 0}</p>
            </div>
          </div>
        </div>
        {/* Future Paywall Metrics */}
        <div className="bg-white p-6 rounded-lg shadow border border-dashed border-gray-300 opacity-60">
          <div className="flex items-center gap-4">
            <DollarSign className="text-gray-400" size={32} />
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue (MRR)</p>
              <p className="text-3xl font-bold text-gray-400">$0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-dashed border-gray-300 opacity-60">
          <div className="flex items-center gap-4">
            <CreditCard className="text-gray-400" size={32} />
            <div>
              <p className="text-sm text-gray-500">Paying Customers</p>
              <p className="text-3xl font-bold text-gray-400">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Errors</h2>
        <div className="bg-white p-6 rounded-lg shadow border">
          <ul className="space-y-3">
            {stats?.recentErrors?.map((err, i) => (
              <li key={i} className="text-sm p-3 bg-red-50 rounded-md flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-mono text-red-700">{err.error_message}</p>
                  <p className="text-xs text-gray-500">{new Date(err.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
            {stats?.recentErrors?.length === 0 && <p className="text-gray-500">No errors logged. Great!</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
