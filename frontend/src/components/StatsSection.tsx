import React, { useEffect, useState, useRef } from 'react';

const AnimatedStat = ({ value, label, delay, color }: { value: string, label: string, delay: number, color: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const numericValue = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = numericValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, numericValue]);

  return (
    <div ref={ref} className="relative group">
      <div className="relative z-20">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {count}{suffix}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      {/* Floating Orb 1 (Specific Color) */}
      <div 
        className="absolute inset-0 m-auto w-24 h-24 rounded-full opacity-40 blur-xl animate-float z-10"
        style={{ 
          background: color,
          animationDelay: `${delay}s`,
          transform: 'translate(-20%, -20%)' // Offset Up-Left
        }}
      ></div>
      {/* Floating Orb 2 (Marketing Gradient) */}
      <div 
        className="absolute inset-0 m-auto w-24 h-24 rounded-full opacity-40 blur-xl animate-float z-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        style={{ 
          animationDelay: `${delay + 0.5}s`,
          transform: 'translate(20%, 20%)' // Offset Down-Right
        }}
      ></div>
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <AnimatedStat value="15+" label="Years Experience" delay={0} color="#ff8c00" />
          <AnimatedStat value="50+" label="Projects Completed" delay={1} color="#ff1493" />
          <AnimatedStat value="70%" label="Avg ROI Increase" delay={2} color="#4dd2ff" />
          <AnimatedStat value="90%" label="Success Rate" delay={3} color="#ff8c00" />
        </div>
      </div>
    </section>
  );
};

export default StatsSection;