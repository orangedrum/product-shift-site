import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group hover:shadow-lg transition-all duration-300 bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-marketing-gradient rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {title}
          </h3>
           <div className="text-sm text-gray-500">
             {description}
           </div>
        </div>
      </div>
    </div>
  );
};