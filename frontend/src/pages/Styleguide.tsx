import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Styleguide = () => {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Component Styleguide</h1>
        <p className="text-lg text-gray-600">This page is for developing and viewing components in isolation.</p>

        {/* Application Routes Section */}
        <section className="mt-12">
          <h2 className="text-3xl font-bold border-b pb-2 mb-6">Application Routes</h2>
          <div className="p-6 border rounded-lg bg-white">
            <p className="mb-4 text-gray-600">Use these links to navigate to the main pages of the application and avoid URL typos.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <Link to="/" className="text-brand-blue hover:underline font-semibold">Homepage</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/</code>
              </li>
              <li>
                <Link to="/ai-powered-uxhealthtech" className="text-brand-blue hover:underline font-semibold">AI UX Agent</Link>
                <code className="text-sm text-gray-500 ml-2 bg-gray-100 p-1 rounded">/ai-powered-uxhealthtech</code>
              </li>
            </ul>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mt-12">
          <h2 className="text-3xl font-bold border-b pb-2 mb-6">Typography & Fonts</h2>

          {/* Headings */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Headings</h3>
            <div className="p-6 border rounded-lg space-y-6 bg-white">
              <div>
                <p className="text-xs text-gray-400 mb-1">Hero Heading</p>
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-orange via-brand-pink to-brand-lightblue">
                  Aa - The quick brown fox
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Hero Heading (Solid)</p>
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">Aa - The quick brown fox</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Section Heading</p>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">Aa - The quick brown fox</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Card/Item Title</p>
                <p className="text-lg font-semibold">Aa - The quick brown fox</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Footer Title</p>
                <p className="text-sm font-semibold tracking-wider uppercase">Aa - The quick brown fox</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Footer Sub-Title</p>
                <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Aa - The quick brown fox</p>
              </div>
            </div>
          </div>

          {/* Body Text */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Body & Paragraphs</h3>
            <div className="p-6 border rounded-lg space-y-4 bg-white">
              <div>
                <p className="text-xs text-gray-400 mb-1">XL Body (Sub-heading)</p>
                <p className="text-xl text-gray-500">The quick brown fox jumps over the lazy dog. A versatile paragraph style for introductory content, providing excellent readability and a strong visual presence.</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Large Body (Hero)</p>
                <p className="text-lg text-gray-600">The quick brown fox jumps over the lazy dog. A versatile paragraph style for introductory content, providing excellent readability and a strong visual presence.</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Base Body (Standard)</p>
                <p className="text-base text-gray-600">The quick brown fox jumps over the lazy dog. This is the default paragraph style for most descriptive text throughout the application.</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Small Body (Footer)</p>
                <p className="text-sm text-gray-500">The quick brown fox jumps over the lazy dog. Used for secondary information, captions, and footer text where a smaller footprint is desired.</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Tags & Pills</h3>
            <div className="p-6 border rounded-lg flex flex-wrap gap-4 items-center bg-white">
              <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full">Primary Tag</span>
              <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-brand-tag-bg rounded-full">Secondary Tag</span>
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-600 bg-brand-tag-bg rounded-full">
                <Sparkles size={14} />
                Icon Badge
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mt-12">
          <h2 className="text-3xl font-bold border-b pb-2 mb-6">Buttons & CTAs</h2>
          <div className="p-6 border rounded-lg space-y-8 bg-white">
            <div>
              <h3 className="font-semibold mb-4">Buttons</h3>
              <div className="flex flex-wrap gap-4 items-center">
                  <button className="inline-flex items-center justify-center bg-gradient-to-br from-brand-orange via-brand-pink to-brand-lightblue text-white font-medium py-2 px-5 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md">
                    Primary Gradient
                  </button>
                  <button className="inline-flex items-center justify-center bg-brand-blue hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    Primary Solid
                  </button>
                  <button className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-5 rounded-lg border border-gray-200 shadow-sm transition-transform transform hover:scale-105">
                    Secondary
                  </button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Text Links</h3>
              <div className="flex flex-wrap gap-8 items-center text-sm">
                <a href="#" className="text-gray-500 hover:text-gray-900 font-normal transition-colors">
                  Navigation Link Style
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 underline transition-colors">
                  Underlined Link Style
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  Footer Link Style
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Styleguide;