import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, BarChart, Users, Zap, FileText, Globe, Lock, TrendingUp, Layout } from 'lucide-react';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';

const AgencyUserTestingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "1-Click User Testing for Agencies | Sell More Web Design Services";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Scale your agency with AI-powered user testing. Validate designs instantly, prove ROI to clients, and deliver data-driven websites without the wait.");
    }
    window.scrollTo(0, 0);
  }, []);

  const handleCtaClick = () => {
    navigate('/landingpg-aiuxagent');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-xs font-bold text-purple-700 mb-6 uppercase tracking-wider">
            For High-Growth Agencies
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            The Secret Weapon for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Selling & Delivering</span> Web Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Stop arguing about design opinions. Start selling data. Use our <strong>1-Click User Testing Tool</strong> to audit prospect sites, benchmark redesigns, and prove your value with instant, AI-generated usability reports.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <NeoButton onClick={handleCtaClick} className="px-8 py-4 text-lg">
              Try Our 1-Click User Testing Tool
            </NeoButton>
            <button onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section id="use-cases" className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Win Every Stage of the Client Lifecycle</h2>
            <p className="text-lg text-gray-500">From the first pitch to the final handoff, data is your best salesperson.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Phase 1: The Pitch */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
              <NeoCard className="relative h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">1. The "Trojan Horse" Pitch</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Don't just tell prospects their current site is losing money—<strong>show them</strong>. Run a 1-click audit on their existing URL before the meeting.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Reveal hidden friction points in their checkout flow.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Show them exactly where users get confused.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Close the deal by offering to fix the specific issues found.</span></li>
                </ul>
              </NeoCard>
            </div>

            {/* Phase 2: The Benchmark */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
              <NeoCard className="relative h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <BarChart className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">2. Establish the "Before"</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Protect your agency from scope creep and subjective feedback. Establish a concrete usability baseline before you write a single line of code.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Get a "Usability Score" for the old site.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Set clear, data-driven KPIs for the redesign.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Align stakeholders on objective problems, not personal tastes.</span></li>
                </ul>
              </NeoCard>
            </div>

            {/* Phase 3: The Build */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
              <NeoCard className="relative h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">3. Test Until It Passes</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Don't wait for launch day to find bugs. Run rapid, automated user tests on your staging environment throughout the development process.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Test wireframes and staging sites instantly.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Identify navigation issues before they become expensive code.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Validate copy and CTAs with AI personas.</span></li>
                </ul>
              </NeoCard>
            </div>

            {/* Phase 4: The Handoff */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-teal-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
              <NeoCard className="relative h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">4. The "Certified" Handoff</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Deliver more than just a website. Hand over a final product accompanied by a passing Usability Test Report.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Prove the new site performs better than the old one.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Justify your premium pricing with tangible proof of quality.</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> <span>Increase client retention and referrals.</span></li>
                </ul>
              </NeoCard>
            </div>
          </div>
        </div>
      </section>

      {/* SEO / Longtail Keyword Section (Subtle) */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Agencies Choose Product Shift</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["White Label User Testing", "Automated UX Audits", "Agency Lead Gen Tool", "Website ROI Calculator", "Client Reporting Automation", "Staging Site Testing"].map((keyword) => (
              <span key={keyword} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 font-medium shadow-sm">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-black mb-6">Ready to Scale Your Agency?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join hundreds of forward-thinking agencies using AI to sell better projects and deliver superior results.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <NeoButton onClick={handleCtaClick} className="px-8 py-4 text-lg bg-white text-black hover:bg-gray-200">
              Try Our 1-Click User Testing Tool
            </NeoButton>
            <a 
              href="https://calendly.com/jean-kaluza/media-buyer-op" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-gray-700 text-white font-bold rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgencyUserTestingPage;