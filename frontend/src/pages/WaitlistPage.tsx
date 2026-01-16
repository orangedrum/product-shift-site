import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Loader2, CheckCircle } from 'lucide-react';

const WaitlistPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) throw new Error('Failed to join waitlist');
      
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <NeoCard>
          <h1 className="text-4xl font-black text-black mb-4">You're Early!</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Our Pro & Agency plans with unlimited tests and advanced features are launching soon.
          </p>
          
          {success ? (
            <div className="p-6 bg-green-50 border-2 border-green-500 rounded-xl animate-fade-in">
              <CheckCircle className="mx-auto text-green-600 mb-2" size={48} />
              <h3 className="text-xl font-bold text-green-800">You're on the list!</h3>
              <p className="text-green-700">We'll notify you as soon as spots open up.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-4 border-2 border-black rounded-xl text-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all"
                required
              />
              {error && <p className="text-red-500 font-bold">{error}</p>}
              <NeoButton type="submit" className="w-full justify-center text-lg py-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Join Waitlist & Get 30% Off'}
              </NeoButton>
            </form>
          )}
        </NeoCard>
      </div>
    </div>
  );
};

export default WaitlistPage;