import React, { useState } from 'react';
import { IconStrategy } from './icons/IconStrategy'; // Assuming these are in /src/components/icons/
import { IconGtm } from './icons/IconGtm';
import { IconGrowth } from './icons/IconGrowth';

const services = [
  {
    id: 'strategy',
    icon: IconStrategy,
    title: 'UX Research & Product Strategy',
    description: 'Deep-dive user research, competitive analysis, and market positioning to build products that win.',
    image: '/services-image-1.png',
  },
  {
    id: 'gtm',
    icon: IconGtm,
    title: 'Go-to-Market Strategy',
    description: 'Crafting and executing launch plans that capture market attention and drive initial user adoption.',
    image: '/services-image-2.png',
  },
  {
    id: 'growth',
    icon: IconGrowth,
    title: 'Growth & Marketing Strategy',
    description: 'Data-driven strategies to scale your user base and increase market share post-launch.',
    image: '/services-image-3.png',
  },
];

const CoreServices = () => {
  const [activeService, setActiveService] = useState(services[0]);

  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-x-16 gap-y-12 items-start">
          <div className="space-y-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl leading-tight">
              Complete Growth & Strategy Solutions
            </h2>
            <p className="text-lg text-gray-600">
              From initial concept to market leadership, we provide the strategic guidance and hands-on execution needed to ensure your product thrives.
            </p>
            <div className="space-y-3">
              {services.map((service) => {
                const isActive = activeService.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setActiveService(service)}
                    className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-white shadow-glow'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0 mt-1"><service.icon /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                        <p className="mt-1 text-base text-gray-600">{service.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:block sticky top-28">
            {/* Browser Frame */}
            <div className="w-full rounded-lg shadow-2xl bg-white ring-1 ring-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <div className="p-2 bg-gray-100/50">
                <img src={activeService.image} alt={activeService.title} key={activeService.id} className="rounded-md w-full animate-fade-in" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreServices;