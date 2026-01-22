import React from 'react';
import { FlaskConical } from 'lucide-react';

const IncubatorRibbon = () => {
  return (
    <div className="bg-marketing-gradient">
      <div className="container mx-auto max-w-4xl text-center py-8 px-4">
        <p className="text-lg text-white">We incubate impact-driven digital health tools. Our current project, <a href="https://www.freebrain.me" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:opacity-80 transition-opacity">FreeBrain</a>, supports individuals with neurological movement disorders.</p>
      </div>
    </div>
  );
};

export default IncubatorRibbon;