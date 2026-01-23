import React from 'react';
import { ArrowRight, Calendar, CheckCircle } from 'lucide-react';

const CTA = () => {
  const benefits = ["Free 30-minute consultation", "Custom UX research strategy", "AI-powered insights preview", "ROI improvement roadmap"];
  
  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-marketing-gradient">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-8 md:p-12 text-center">
            <div className="inline-block mb-6 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
              Ready to Transform Your Strategy?
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Book Your Free Consultation Today
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover how Product Shift's UX research can deliver real data that transforms your product launches and drives marketing ROI growth.
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              {benefits.map(benefit => (
                <div key={benefit} className="flex items-center text-left">
                  <CheckCircle className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <a 
                href="https://calendly.com/jean-kaluza/media-buyer-op" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-14 px-8 text-lg font-bold text-white bg-marketing-gradient rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              
              <button 
                onClick={scrollToServices}
                className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                Learn More About Services
              </button>
            </div>

            <p className="text-sm text-gray-500">
              No commitment required • 30-minute session • Immediate insights
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;