import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart, Users, Zap, FileText, TrendingUp, PlayCircle, X, Check, ArrowRightLeft } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { VideoPlayer } from '../components/VideoPlayer';
import { SpeechBubble } from '../components/SpeechBubble';
import { DemoSection } from '../components/DemoSection';

const CONFIG = {
  pageTitle: "White Label User Testing for Agencies | Product Shift",
  metaDescription: "Scale your agency with AI-powered user testing. Validate designs instantly, prove ROI to clients, and deliver data-driven websites without the wait.",
  urlSlug: "agency-user-testing",
};

const AgencyUserTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);

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

  const handleCtaClick = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Stop arguing about design opinions. Start selling with data. Use our <strong>1-Click User Testing Tool</strong> to audit prospect sites, benchmark redesigns, and prove your value with instant, AI-generated usability reports.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={handleCtaClick} className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-white bg-marketing-gradient hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              Try the free demo yourself
            </button>
            <button 
              onClick={() => setShowVideoModal(true)} 
              className="inline-flex items-center justify-center h-11 rounded-md px-8 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-all duration-300"
            >
              <PlayCircle size={20} className="mr-2" />
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <DemoSection />

      {/* The "WHY" Section - Google Analytics vs Product Shift */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-6">
                Google Analytics tells you <span className="italic underline text-black">what</span> is happening.
                <br />
                We tell you <span className="text-transparent bg-clip-text bg-marketing-gradient">WHY</span>.
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Analytics dashboards show you high bounce rates and abandoned carts, but they don't tell you <em>why</em> users are leaving. 
                Our AI agents browse your client's site like real humans, verbalizing their confusion and frustration so you can fix it.
              </p>
              
              <div className="relative grid grid-cols-2 gap-4">
                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full p-2 shadow-sm">
                  <span className="text-xs font-black text-gray-400">VS</span>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 h-full">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm w-fit">
                    <BarChart className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Analytics</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">"Bounce rate on /checkout is 65%."</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100 h-full">
                  <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm w-fit">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm mb-1">Product Shift</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">"I can't find the shipping costs. I'm frustrated."</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Bubble & Actionable Fix */}
            <div className="relative flex flex-col gap-8">
              <SpeechBubble 
                imageSrc="https://api.dicebear.com/7.x/notionists/svg?seed=Marcus"
                name="Marcus"
                role="Skeptical Buyer Persona"
                quote="I'm ready to buy, but I have no idea if this software integrates with Salesforce. I'm not going to risk it."
                mood="negative"
              />
              
              <div className="bg-white text-gray-900 p-6 rounded-xl border-2 border-gray-100 shadow-xl relative z-10">
                <div className="flex items-center gap-2 mb-4 text-brand-purple font-bold uppercase tracking-wider text-xs">
                  <CheckCircle size={16} /> Actionable Recommendation
                </div>
                <h3 className="text-xl font-bold mb-2">Clarify Salesforce Integration</h3>
                <p className="text-gray-600 mb-4">Users are abandoning the purchase because they can't confirm if the software works with their existing stack.</p>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-pink rounded-full"></div> FIX: Add "Works with Salesforce" logo strip immediately below the primary CTA.
                </div>
              </div>
              
              {/* Decorative Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-marketing-gradient opacity-10 blur-3xl rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>

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
      <section id="pricing" className="py-24 bg-white border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Start for free. Scale as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Pay As You Go Card */}
            <div className="relative p-8 bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_#000] flex flex-col">
              <div className="mb-4">
                <h3 className="text-2xl font-black text-black">Pay As You Go</h3>
                <p className="text-gray-600 mt-2">Start free, pay only for what you use.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-black">$0</span>
                <span className="text-gray-600 font-bold"> / mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">No commitment required</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">$3 free credits to start</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">Top up credits anytime</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold text-sm">See each persona's full experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold text-sm">All experiences summarized into digestible report</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold text-sm">Pass/fail, Final score, Performance Metrics</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">Downloadable & shareable reports</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/login'} // Routes to your Auth flow
                className="w-full py-4 bg-black text-white font-black text-lg rounded-lg hover:translate-y-[-2px] hover:shadow-lg transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro Subscription Card */}
            <div className="relative p-8 bg-[#f3f4f6] border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_#000] flex flex-col opacity-75 hover:opacity-100 transition-opacity">
              <div className="absolute -top-4 right-8 bg-[#ff1493] text-white font-black px-4 py-1 border-2 border-black rounded-full text-sm transform rotate-2">
                WAITLIST
              </div>
              <div className="mb-4">
                <h3 className="text-2xl font-black text-black">Bring Your Own Key</h3>
                <p className="text-gray-600 mt-2">Manage LLM cost internally.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-black">$29</span>
                <span className="text-gray-600 font-bold"> / mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">Everything in the free plan</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">Unlimited tests with your keys</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">Use your own API keys (e.g. OpenAI, Anthropic)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">300 EC2 compute minutes / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <span className="font-bold">CI / API integration</span>
                </li>
              </ul>
              <a 
                href="/waitlist" 
                className="block w-full py-4 bg-white text-black border-2 border-black font-black text-lg rounded-lg text-center hover:bg-gray-50 transition-all"
              >
                Join Waitlist
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>
            <VideoPlayer 
              src="https://fpr0nfpdfdtsoqhl.public.blob.vercel-storage.com/editedproductdemo.mp4" 
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyUserTestingPage;