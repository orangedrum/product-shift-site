import React from 'react';
import { Megaphone, Search, Brain, Zap, Target, TestTube, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: Megaphone,
    title: "Strategic Media Buying",
    description: "Data-backed advertising campaigns that target high-value patients and providers.",
    features: ["Patient Targeting", "Performance Marketing", "ROI Optimization", "Multi-Platform"],
    url: "https://www.fiverr.com/s/EgxKZwY"
  },
  {
    icon: Search,
    title: "HealthTech UX Research",
    description: "Deep insights into patient behavior through ethnographic research and usability testing.",
    features: ["Patient Interviews", "Clinical Usability", "Ethnographic Research", "Behavioral Analytics"]
  },
  {
    icon: Brain,
    title: "AI-Driven Product Strategy",
    description: "Integrating GenAI to personalize patient experiences and automate clinical workflows.",
    features: ["GenAI UX Design", "AI User Testing", "Automated Research", "ML-Driven Insights"]
  },
  {
    icon: Zap,
    title: "Rapid MedTech Prototyping",
    description: "Validate digital health concepts in 5 days before committing to expensive code.",
    features: ["5-Day Sprints", "Rapid Prototyping", "Clinical Validation", "Concept Testing"]
  },
  {
    icon: Target,
    title: "Patient & Provider Personas",
    description: "Data-driven profiles for complex healthcare ecosystems and GTM strategies.",
    features: ["Market Research", "Positioning Strategy", "Competitor Analysis", "Launch Planning"],
    url: "https://www.fiverr.com/s/jjW7aXa"
  },
  {
    icon: TestTube,
    title: "Conversion Rate Optimization",
    description: "Systematic experimentation to improve patient engagement and enrollment rates.",
    features: ["Conversion Testing", "Statistical Analysis", "Performance Metrics", "Optimization"]
  }
];

const CoreServices = () => {
  return (
    <section id="services" className="bg-white pt-16 pb-24 sm:pb-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 mb-4">
            Our Services
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Specialized Growth for Digital Health</h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            From clinical validation to market launch, we provide end-to-end strategies for HealthTech startups and enterprise healthcare organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const CardContent = (
              <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-xs text-gray-500 font-medium">
                      <div className="w-1.5 h-1.5 bg-brand-red rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );

            return service.url ? (
              <a 
                key={service.title} 
                href={service.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block h-full"
              >
                {CardContent}
              </a>
            ) : (
              <div key={service.title} className="h-full">
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoreServices;