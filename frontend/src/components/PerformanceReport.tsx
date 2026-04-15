import React from 'react';
import { BarChart, ExternalLink } from 'lucide-react';

// Type definitions based on backend controller
type LighthouseResult = {
  url: string;
  performanceScore: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  tti: number; // Time to Interactive
  speedIndex: number;
};

export type PerformanceReportData = {
  overallScore: number;
  pages: LighthouseResult[];
  deviceSettings: string;
};

// A simple circular progress component for scores
const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-green-500';
  if (score < 90) colorClass = 'text-yellow-500';
  if (score < 50) colorClass = 'text-red-500';

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={colorClass}
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-black text-gray-800">{Math.round(score)}</span>
      </div>
    </div>
  );
};

const PerformanceReport: React.FC<{ data: PerformanceReportData }> = ({ data }) => {
  const { overallScore, pages, deviceSettings } = data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b-2 border-black pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black flex items-center gap-3">
            <BarChart size={32} />
            Deep Performance Audit
          </h2>
          <p className="text-gray-600 font-medium mt-2">
            Analysis of {pages.length} pages based on a simulated <strong className="text-black">{deviceSettings}</strong>.
          </p>
        </div>
        <div className="mt-6 md:mt-0 text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Overall Score</p>
          <ScoreCircle score={overallScore} />
        </div>
      </div>
      <div className="space-y-6">
        {pages.map((page, index) => (
          <div key={index} className="bg-gray-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0">
                <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline truncate flex items-center gap-2">
                  {page.url} <ExternalLink size={14} />
                </a>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${getScoreColor(page.performanceScore)}`}>
                  {Math.round(page.performanceScore)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-md border-2 border-black">
                <p className="text-xs font-bold text-gray-500 uppercase">FCP</p>
                <p className="text-xl font-black text-gray-800">{(page.fcp / 1000).toFixed(1)}s</p>
              </div>
              <div className="p-3 bg-white rounded-md border-2 border-black">
                <p className="text-xs font-bold text-gray-500 uppercase">LCP</p>
                <p className="text-xl font-black text-gray-800">{(page.lcp / 1000).toFixed(1)}s</p>
              </div>
              <div className="p-3 bg-white rounded-md border-2 border-black">
                <p className="text-xs font-bold text-gray-500 uppercase">TTI</p>
                <p className="text-xl font-black text-gray-800">{(page.tti / 1000).toFixed(1)}s</p>
              </div>
              <div className="p-3 bg-white rounded-md border-2 border-black">
                <p className="text-xs font-bold text-gray-500 uppercase">Speed Index</p>
                <p className="text-xl font-black text-gray-800">{(page.speedIndex / 1000).toFixed(1)}s</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceReport;