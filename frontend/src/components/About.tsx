import React, { useEffect, useState, useRef } from 'react';
import { Building, Award, Users, Zap } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

const achievements = [
  {
    icon: Building,
    title: "Enterprise Experience",
    description: "Delivered solutions for Disney Parks & Resorts, Pluralsight, and leading SaaS companies"
  },
  {
    icon: Award,
    title: "AI UX Expertise",
    description: "Pioneer in the UX of AI as a consultant for JEMA and Dovetail platforms."
  },
  {
    icon: Users,
    title: "Startup Success",
    description: "Helped 50+ startups across Silicon Valley and Dallas achieve successful product launches"
  },
  {
    icon: Zap,
    title: "Data-Driven Results",
    description: "Our critical research and analysis consistently delivers 300% average ROI improvements"
  }
];

const AnimatedStat = ({ value, label, delay }: { value: string, label: string, delay: number }) => {
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
      <div className="relative z-10">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {count}{suffix}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      {/* Floating Orb */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-20 blur-xl animate-float -z-0"
        style={{ 
          background: 'linear-gradient(135deg, #ff8c00, #ff1493)',
          animationDelay: `${delay}s` 
        }}
      ></div>
    </div>
  );
};

const About = () => {
  return (
    <section id="about" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 mb-4">
              About Product Shift
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Thought Leadership in Growth & Strategy
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
              <div className="w-48 h-48 flex-shrink-0 mx-auto sm:mx-0 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src="/jeankaluza.png" alt="Jean, Product Shift Lead" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 text-gray-600">
                <p>
                  I'm Jean, and I lead Product Shift in delivering data driven marketing strategy & product solutions. Our team has proven expertise in product & marketing strategy, media buying, and UX research methodologies that have transformed product & marketing strategies into the stratospheres of success. We're at the forefront of AI UX experience, helping companies leverage GenAI for unprecedented user insights and business growth.
                </p>
                <p>
                  Our extensive research expertise means you'll know your future customers better than they know themselves, converting them from hook, through conversion, and returning customers. We encourage our client's & partners to extend our insights across both marketing & product silos for the best results.
                </p>
                <p>
                  Our goal is to build customized flywheels based metrics & real-world data that generates automated growth & success for years un-end.
                </p>
              </div>
            </div>
          </div>

          {/* Right Grid */}
          <div className="grid gap-6">
            {achievements.map((achievement, index) => (
              <FeatureCard 
                key={achievement.title}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
              />
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <AnimatedStat value="15+" label="Years Experience" delay={0} />
          <AnimatedStat value="50+" label="Projects Completed" delay={1} />
          <AnimatedStat value="70%" label="Avg ROI Increase" delay={2} />
          <AnimatedStat value="90%" label="Success Rate" delay={3} />
        </div>
      </div>
    </section>
  );
};

export default About;