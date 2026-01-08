import React from 'react';
import { Link } from 'react-router-dom';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <NeoCard>
          <h1 className="text-6xl font-black text-black mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist. It might have been moved or you might have a typo in the URL.
          </p>
          <Link to="/">
            <NeoButton variant="primary" className="w-full">
              Back to Home
            </NeoButton>
          </Link>
        </NeoCard>
      </div>
    </div>
  );
};

export default NotFound;