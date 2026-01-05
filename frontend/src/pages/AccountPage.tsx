import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const AccountPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email', session.user.email)
      .single();

    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    getProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-24 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">My Account</h1>
      
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Subscription Status</h2>
          <button onClick={getProfile} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors" title="Refresh Status">
            <RefreshCw size={20} />
          </button>
        </div>
        {profile ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-gray-600">Current Plan</span>
              <span className="font-semibold text-gray-900">{profile.plan_status === 'active' ? 'Starter Plan' : 'Free / Inactive'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-gray-600">Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${profile.plan_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.plan_status || 'Inactive'}
              </span>
            </div>
            <div className="pt-2">
              <p className="text-sm text-gray-500">
                To manage your billing, update your card, or cancel your subscription, please contact support. (Self-service portal coming soon).
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-900 font-medium mb-2">No active subscription found.</p>
            <p className="text-sm text-gray-500 mb-6">If you just made a payment, please click the refresh icon above in a few moments.</p>
            <button 
              onClick={() => navigate('/landingpg-aiuxagent')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View Plans
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <button 
          onClick={handleLogout}
          className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
