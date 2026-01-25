import React from 'react';
import { Building, Award, Users, Zap, Pill } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

const achievements = [
  {
    icon: Pill,
    title: "Movement Health Researcher",
    description: "Expert in behavior-change products and human-centered design in complex health/neuro-tech applications"
  },
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
              Tech for the good of all, not just certain wallets
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
              <div className="w-48 h-48 flex-shrink-0 mx-auto sm:mx-0 rounded-full overflow-hidden border-4 border-white ring-1 ring-brand-pink shadow-lg">
                <img src="/jeankaluza.png" alt="Jean, Product Shift Lead" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 text-gray-600">
                <p>
                  I’m Jean Kaluza, founder of The Product Shift where we still believe in technology for the good of ALL humans not just certain wallets. I’ve been a writer, speaker & consultant in the human-centered & Design Thinking space since 2010. The Product Shift provides **data-driven UX for HealthTech**, shifting products against data, not ego, solving problems through technology for clients as well as our own internal endeavors. My passion for **HealthTech product strategy** extends into MedTech as a Movement Health Researcher, UX/AI Innovator, and Founder of The Product Shift as well as FreeBrain. Our mission is to solve world problems through technology and we get as passionate as our clients do solving them. Our current project (FreeBrain), is a brain health app to support those with Parkinson’s and other neurological disorders.
                </p>
                <p>
                  We are currently accepting limited clients for Q1 of 2025, focusing on **UX research for HealthTech startups**, and currently seeking sponsorship for FreeBrain for its validation phase. Our extensive research expertise means you'll know your future customers better than they know themselves, converting them from hook, through conversion, and returning customers. We encourage our clients & partners to extend our insights across both marketing & product silos for the best results.
                </p>
                <p>
                  We deliver **patient-centric design** with data, not ego. Our goal is to build customized flywheels based metrics & real-world data that generates automated growth & success for years on end.  We're excited for both our projects and yours becoming part our next problem solving success story.
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
      </div>
    </section>
  );
};

export default About;