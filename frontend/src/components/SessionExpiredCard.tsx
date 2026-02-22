import React from 'react';
import { LogOut } from 'lucide-react';
import { NeoButton } from './NeoButton';
import { NeoCard } from './NeoCard';

interface SessionExpiredCardProps {
  onLogin: () => void;
}

export const SessionExpiredCard: React.FC<SessionExpiredCardProps> = ({ onLogin }) => (
  <div className="max-w-md mx-auto mt-8 animate-fade-in relative">
    <NeoCard title="Session Expired">
      <div className="text-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
          <LogOut className="text-blue-600" size={48} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Please Sign In</h3>
        <p className="text-gray-600 font-medium">
          You need to be logged in to run an analysis. Please sign in to continue.
        </p>
      </div>
      <NeoButton onClick={onLogin} className="w-full justify-center">
        Sign In
      </NeoButton>
    </NeoCard>
  </div>
);