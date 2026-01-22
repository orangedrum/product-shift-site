import React from 'react';
import { Building, Award, Users, Zap } from 'lucide-react';

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
              <div key={achievement.title} className="group hover:shadow-lg transition-all duration-300 bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-marketing-gradient rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <achievement.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {achievement.title}
                    </h3>
                     <p className="text-sm text-gray-500">
                       {achievement.description}
                     </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">15+</div>
            <div className="text-sm text-gray-500">Years Experience</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
            <div className="text-sm text-gray-500">Projects Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">70%</div>
            <div className="text-sm text-gray-500">Avg ROI Increase</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">90%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;