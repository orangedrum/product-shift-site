import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart, Users, Zap, FileText, TrendingUp, PlayCircle, X, Check, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { VideoPlayer } from '../components/VideoPlayer';
import { SpeechBubble } from '../components/SpeechBubble';
import { PricingSection } from '../components/PricingSection';
import { AnalyticsSmbUser } from '../components/AnalyticsSmbUser';
import { ToolkitUxTech } from '../components/ToolkitUxTech';

const CONFIG = {
  pageTitle: "White Label User Testing for Agencies | Product Shift",
  metaDescription: "Scale your agency with AI-powered user testing. Validate designs instantly, prove ROI to clients, and deliver data-driven websites without the wait.",
  urlSlug: "agency-user-testing",
};

const AgencyUserTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [demoUrl, setDemoUrl] = useState('');

  useEffect(() => {
    document.title = CONFIG.pageTitle;
    
    // 1. Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', CONFIG.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = CONFIG.metaDescription;
      document.head.appendChild(meta);
    }

    // 2. Canonical Link (Pointing to www as requested)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://www.theproductshift.com/${CONFIG.urlSlug}`);

    // 3. Open Graph Tags (Social SEO)
    const setMeta = (attr: string, key: string, content: string) => {
      let m = document.querySelector(`meta[${attr}="${key}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute(attr, key);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };
    
    setMeta('property', 'og:title', CONFIG.pageTitle);
    setMeta('property', 'og:description', CONFIG.metaDescription);
    setMeta('property', 'og:url', `https://www.theproductshift.com/${CONFIG.urlSlug}`);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', 'https://www.theproductshift.com/social-share.png');

    // 4. JSON-LD Structured Data (AI Search Optimization)
    const scriptId = 'json-ld-agency';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": "Product Shift for Agencies",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free Agency Audit Demo" },
            "description": CONFIG.metaDescription,
            "featureList": "White Label Reports, Multi-Client Management, Instant AI Analysis",
            "audience": {
              "@type": "Audience",
              "audienceType": "Digital Agencies & Web Design Studios"
            },
            "offeredBy": {
              "@type": "Organization",
              "name": "Product Shift",
              "url": "https://www.theproductshift.com"
            }
          }
        ]
      });
      document.head.appendChild(script);
    }

    window.scrollTo(0, 0);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoUrl) {
      // Redirect to the main tool with the URL pre-filled
      const targetUrl = demoUrl.startsWith('http') ? demoUrl : `https://${demoUrl}`;
      navigate(`/ai-powered-ux?url=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-gray-200">
        {/* Video Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
            src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4"
          />
          {/* White overlay to ensure text readability while keeping video texture */}
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-xs font-bold text-purple-700 mb-6 uppercase tracking-wider">
            For High-Growth Agencies
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            The Secret Weapon for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-marketing-gradient">Selling & Delivering</span> Web Services
          </h1>
          
          {/* Demo Input Form */}
          <div className="max-w-xl mx-auto bg-white p-2 rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <form onSubmit={handleDemoSubmit} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Enter client website (e.g. client.com)" 
                className="flex-grow p-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none font-medium"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                required
              />
              <button type="submit" className="bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                Run Audit <ArrowRight size={18} />
              </button>
            </form>
          </div>
          <p className="text-sm text-gray-500 mt-4 font-medium">
            <Zap size={14} className="inline text-yellow-500 mr-1" /> 
            Generates a white-label ready report in 2 minutes
          </p>
        </div>
      </section>

      {/* Video Trigger Section */}
      <section className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-8">See Product Shift in Action</h2>
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-pointer group border-4 border-black bg-black"
            onClick={() => setShowVideoModal(true)}
          >
            <img src="/66a8f3cd-cec2-47f4-a67e-1ead53ccdc28.png" alt="Demo Video" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <PlayCircle className="w-12 h-12 text-indigo-600 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <AnalyticsSmbUser />
      <ToolkitUxTech />

      {/* Use Cases Grid */}
      <section id="use-cases" className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900 mb-4">When should I use 1-Click User Testing?</h2>
            <h3 className="text-xl font-bold text-gray-500 mb-4">Win Every Stage of the Client Lifecycle</h3>
            <p className="text-lg text-gray-500">From the first pitch to the final handoff, data is your best salesperson.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Phase 1: The Pitch */}
            <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1. Sell With Data
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Don't just tell prospects their current site is losing money—<strong>show them</strong>. Run a 1-click audit on their existing URL before the meeting.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Reveal hidden friction points in their checkout flow.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Show them exactly where users get confused.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Close the deal by offering to fix the specific issues found.</span></li>
              </ul>
            </div>

            {/* Phase 2: The Benchmark */}
            <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2. Establish the "Before"
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Protect your agency from scope creep and subjective feedback. Establish a concrete usability baseline before you write a single line of code.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Get a "Usability Score" for the old site.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Set clear, data-driven KPIs for the redesign.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Align stakeholders on objective problems, not personal tastes.</span></li>
              </ul>
            </div>

            {/* Phase 3: The Build */}
            <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                3. Test Until It Passes
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Don't wait for launch day to find bugs. Run rapid, automated user tests on your staging environment throughout the development process.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Test wireframes and staging sites instantly.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Identify navigation issues before they become expensive code.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Validate copy and CTAs with AI personas.</span></li>
              </ul>
            </div>

            {/* Phase 4: The Handoff */}
            <div className="h-full p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(250,66,91,0.3)] transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-marketing-gradient rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                4. The "Certified" Handoff
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Deliver more than just a website. Hand over a final product accompanied by a passing Usability Test Report.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Prove the new site performs better than the old one.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Justify your premium pricing with tangible proof of quality.</span></li>
                <li className="flex items-start gap-2 text-sm text-gray-600"><div className="w-1.5 h-1.5 bg-brand-purple rounded-full mt-2 shrink-0"></div> <span>Increase client retention and referrals.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-50"
            >
              <X size={32} />
            </button>
            <VideoPlayer 
              src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyUserTestingPage;