import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Star, X } from 'lucide-react';
import { NeoButton } from './NeoButton';
import { supabase } from '../lib/supabase';

export interface FeedbackCardProps {
  email: string;
  isFirstBuy?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ email, isFirstBuy: propIsFirstBuy }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flywheelStage, setFlywheelStage] = useState<'new' | 'regular' | 'power' | 'champion'>('new');
  const [searchParams] = useSearchParams();
  const isFirstBuy = propIsFirstBuy || searchParams.get('first_buy') === 'true';

  useEffect(() => {
      setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!email) return;
    const fetchFlywheel = async () => {
        try {
            const { data } = await supabase.from('customers').select('is_regular_user, is_power_user, is_champion').eq('email', email).maybeSingle();
            if (data) {
                if (data.is_champion) setFlywheelStage('champion');
                else if (data.is_power_user) setFlywheelStage('power');
                else if (data.is_regular_user) setFlywheelStage('regular');
            }
        } catch (e) {
            // Silent fail, default to 'new'
        }
    };
    fetchFlywheel();
  }, [email]);

  const fireConfetti = () => {
    const colors = ['#ff1493', '#ff8c00', '#00bfff'];
    const particleCount = 150;
    
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.right = '100px';
      el.style.bottom = '100px';
      const size = Math.floor(Math.random() * 8) + 5;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius = '50%';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '9999';
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 10 + Math.random() * 10;
      const tx = Math.cos(angle) * velocity * 20;
      const ty = Math.sin(angle) * velocity * 20 - 100;

      el.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
      ], { duration: 1000 + Math.random() * 1000, easing: 'cubic-bezier(0, .9, .57, 1)' }).onfinish = () => el.remove();
    }
  };

  const getCopy = () => {
      if (isFirstBuy) return { button: "Quick Question", header: "What made you buy today?" };
      switch(flywheelStage) {
          case 'champion': return { button: "Quick Question", header: "How can we improve?" };
          case 'power': return { button: "Love User Mirror?", header: "Enjoying the tool?" };
          case 'regular': return { button: "How's it going?", header: "How is User Mirror working for you?" };
          default: return { button: "Give Feedback", header: "How was this analysis?" };
      }
  };

  const copy = getCopy();

  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback, testimonial: feedback })
      });
      setSubmitted(true);
      fireConfetti();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    setTimeout(() => setIsVisible(false), 3000);
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center animate-fade-in shadow-2xl max-w-sm">
        <p className="text-green-800 font-bold">Thank you for your feedback! 🙌</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}</style>
      {!isOpen ? (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-[4px_4px_0px_0px_#000] border-2 border-black hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all animate-bounce-subtle flex items-center gap-2"
        >
            <MessageSquare size={20} />
            {copy.button}
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 z-50 bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_#000] mb-0 no-print max-w-sm animate-slide-up">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
          <h3 className="text-lg font-black text-black mb-2 flex items-center gap-2">
            <MessageSquare size={20} /> {copy.header}
          </h3>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                <Star size={24} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
              </button>
            ))}
          </div>
          <textarea 
            className="w-full p-3 border-2 border-gray-200 rounded-lg mb-4 focus:border-black focus:outline-none"
            placeholder="What did you think? (Optional)"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <NeoButton onClick={handleSubmit} disabled={loading || rating === 0} className="w-full justify-center">
            {loading ? 'Sending...' : 'Submit Feedback'}
          </NeoButton>
        </div>
      )}
    </>
  );
};