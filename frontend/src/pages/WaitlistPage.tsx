import React from 'react';

const WaitlistPage: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto max-w-2xl py-24 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">You're Early!</h1>
        <p className="mt-4 text-lg text-gray-600">
          Our Pro plan with unlimited tests and advanced features is launching soon.
        </p>
        <div className="mt-8 p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-indigo-600">Join the Waitlist</h2>
          <p className="mt-2 text-gray-600">
            Be the first to know when we launch and get **30% off** your first month.
          </p>
          <div className="mt-6">
            {/* Placeholder for an email form (e.g., Formspree, ConvertKit) */}
            <p className="text-sm text-gray-500">Email capture form coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage;