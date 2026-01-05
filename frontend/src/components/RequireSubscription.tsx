import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const RequireSubscription = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
        return;
      }

      // Check subscription status in the 'customers' table
      const checkSubscription = async () => {
        const { data, error } = await supabase
          .from('customers')
          .select('plan_status')
          .eq('email', session.user.email)
          .single();

        if (data && data.plan_status === 'active') {
          setHasSubscription(true);
        }
        setLoading(false);
      };

      checkSubscription();
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasSubscription) {
    // Redirect to pricing if they don't have a subscription
    return <Navigate to="/landingpg-aiuxagent" replace />;
  }

  return children;
};
