import React from 'react';
import { Building, Award, Users, Zap, Pill } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

const achievements = [
  {
    icon: Pill,
    title: "HealthTech Behavior Research",
    description: <>Expert in <strong>HealthTech behavior change</strong> and human-centered design for neuro-tech applications.</>
  },
  {
    icon: Building,
    title: "Enterprise UX Strategy",
    description: <>Delivered <strong>enterprise UX solutions</strong> for Disney Parks & Resorts, Pluralsight, and leading SaaS companies.</>
  },
  {
    icon: Award,
    title: "AI-Driven UX Design",
    description: <>Pioneer in <strong>AI-driven UX design</strong>, consulting for JEMA and Dovetail platforms.</>
  },
  {
    icon: Users,
    title: "Startup Growth Strategy",
    description: <>Scaled 50+ <strong>HealthTech and SaaS startups</strong> across Silicon Valley and Dallas with successful product launches.</>
  },
  {
    icon: Zap,
    title: "ROI-Focused Research",
    description: <>Our <strong>data-driven UX research</strong> consistently delivers 300% average ROI improvements.</>
  }
];

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
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="bg-marketing-gradient bg-clip-text text-transparent">Tech for the good of all,</span> not just certain wallets
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
              <div className="w-48 h-48 flex-shrink-0 mx-auto sm:mx-0 rounded-full overflow-hidden border-4 border-white ring-1 ring-brand-pink shadow-lg">
                <img src="/jeankaluza.png" alt="Jean, Product Shift Lead" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 text-gray-600">
                <p>
                  I’m Jean Kaluza, founder of The Product Shift. Since 2010, I’ve been a consultant in the human-centered Design Thinking space, believing in technology for the good of all. We provide <strong>data-driven UX for HealthTech</strong>, shifting products based on data, not ego. My passion for <strong>HealthTech product strategy</strong> extends to my role as a Movement Health Researcher and founder of FreeBrain, a brain health app for Parkinson’s support.
                </p>
                <p>
                  We are accepting limited clients for Q1 2025, focusing on <strong>UX research for HealthTech startups</strong>, while seeking sponsorship for FreeBrain's validation phase. Our research expertise helps you understand customers better than they know themselves, driving conversion and retention. We encourage partners to apply these insights across both marketing and product silos.
                </p>
                <p>
                  We deliver <strong>patient-centric design</strong> backed by real-world metrics. Our goal is to build customized growth flywheels that generate automated success for years on end. We're excited to make your project our next success story.
                </p>
                <div className="mt-6">
                  <a 
                    href="https://calendly.com/jean-kaluza/app-idea-day-1-facilitation-clone" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform transform hover:scale-105"
                  >
                    Free Consultation
                  </a>
                </div>
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
      </div>
    </section>
  );
};

export default About;