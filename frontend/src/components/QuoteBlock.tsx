import React from 'react';
import { Quote } from 'lucide-react';

interface QuoteBlockProps {
  quote: string;
  author: string;
  role: string;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ quote, author, role }) => {
  return (
    <div className="bg-gradient-subtle border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex items-start space-x-4">
        <Quote className="h-6 w-6 text-brand-pink flex-shrink-0 mt-1" />
        <div>
          <blockquote className="text-gray-600 italic mb-4 text-left">
            "{quote}"
          </blockquote>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{author}</div>
            <div className="text-sm text-gray-500">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
};