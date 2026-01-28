import React from 'react';
import { ArrowRight, Brain, TrendingUp, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface HeroProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: string;
  imageSrc?: string;
  badgeText?: string;
}

const Hero: React.FC<HeroProps> = ({
  title = "Data-Driven UX for",
  subtitle = <span className="bg-marketing-gradient bg-clip-text text-transparent"> HealthTech Growth</span>,
  description = "Partner with Product Shift to leverage proven UX research to level-up your HealthTech market strategy & deliver predictable successful product launches. Trusted by Disney Parks & Resorts, Pluralsight and MedTech start-ups across Silicon Valley, Dallas and beyond",
  imageSrc = "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80",
  badgeText = "HealthTech Growth, AI UX, & Strategy Expert"
}) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Product Shift",
    "image": "https://www.theproductshift.com/logo.png",
    "url": "https://www.theproductshift.com/",
    "description": "Product Shift provides data-driven UX for HealthTech, helping startups and enterprises build successful digital health products through patient-centric research and AI-powered strategy.",
    "founder": {
      "@type": "Person",
      "name": "Jean Kaluza"
    },
    "knowsAbout": [
      { "@type": "Thing", "name": "HealthTech" },
      { "@type": "Thing", "name": "MedTech" },
      { "@type": "Thing", "name": "User Experience (UX) Research" },
      { "@type": "Thing", "name": "AI-driven Product Strategy" },
      { "@type": "Thing", "name": "Patient-Centric Design" }
    ],
    "areaServed": {
      "@type": "Country",
      "name": "USA"
    }
  };

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

    <section className="pt-24 pb-12 md:pt-16 md:pb-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mb-6">
              <Brain className="h-4 w-4" />
              <span>{badgeText}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              {title} {subtitle}
            </h1>
            
            <p className="text-xl text-gray-500 mb-8 max-w-2xl animate-fade-in mx-auto lg:mx-0">
              A Digital Product UX Research & Human Behavior Lab. The incubator behind FreeBrain. Partner with us for market strategy & deliver predictable successful product launches. Trusted by Disney Parks & Resorts, Pluralsight and start-ups across Silicon Valley, Dallas and beyond
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up justify-center lg:justify-start">
              <button 
                onClick={scrollToContact}
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium bg-black hover:bg-gray-800 text-white shadow-md transition-transform transform hover:scale-105"
              >
                Book Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              
              <button 
                onClick={scrollToServices}
                className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-all duration-300"
              >
                Browse Services
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 animate-fade-in">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-brand-red mr-2" />
                  <span className="text-2xl font-bold text-gray-900">70%</span>
                </div>
                <p className="text-sm text-gray-500">Avg ROI Increase</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-brand-red mr-2" />
                  <span className="text-2xl font-bold text-gray-900">50+</span>
                </div>
                <p className="text-sm text-gray-500">Successful Launches</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="h-5 w-5 text-brand-red mr-2" />
                  <span className="text-2xl font-bold text-gray-900">AI</span>
                </div>
                <p className="text-sm text-gray-500">Powered Research</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-float">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img src={imageSrc} alt="Data-driven UX research optimizing HealthTech and MedTech patient experiences" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 font-medium">User Experience is the vital sign of digital health success.</p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-marketing-gradient rounded-full opacity-20 animate-pulse blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-500 rounded-full opacity-30 animate-pulse delay-1000 blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default Hero;