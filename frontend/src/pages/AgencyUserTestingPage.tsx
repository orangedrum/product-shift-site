import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart, Users, Zap, FileText, Globe, Lock, TrendingUp, Layout, Search, AlertCircle, PlayCircle, X, Check, RefreshCw, Megaphone } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import { VideoPlayer } from '../components/VideoPlayer';
import { SpeechBubble } from '../components/SpeechBubble';
import { DemoSection } from '../components/DemoSection';

const AgencyUserTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    document.title = "White Label User Testing for Agencies | Sell Web Design Services";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "The automated UX audit tool for agencies. Sell more website redesigns and prove ROI with instant, white-label user testing reports.");
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
            Stop arguing about design opinions. Start selling data. Use our <strong>1-Click User Testing Tool</strong> to audit prospect sites, benchmark redesigns, and prove your value with instant, AI-generated usability reports.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <NeoButton onClick={handleCtaClick} className="px-8 py-4 text-lg">
              Learn More About our 1-click User Testing Tool
            </NeoButton>
            <NeoButton 
              variant="secondary"
              onClick={() => setShowVideoModal(true)} 
              className="px-8 py-4 text-lg"
              icon={<PlayCircle size={20} />}
            >
              See How It Works
            </NeoButton>
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
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <BarChart className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">The Analytics Way</h4>
                    <p className="text-sm text-gray-500">"Bounce rate on /checkout is 65%."</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <Zap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">The Product Shift Way</h4>
                    <p className="text-sm text-indigo-700">"I can't find the shipping costs. I'm frustrated and leaving."</p>
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
                <h3 className="text-xl font-bold mb-2">Add Integration Logos</h3>
                <p className="text-gray-600 mb-4">Users are abandoning the pricing page because integration capabilities are buried.</p>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-600 flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-pink rounded-full"></div> FIX: Add "Works with Salesforce" logo strip below CTA.
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
                1. The "Trojan Horse" Pitch
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

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-24 sm:py-32">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Plans for Every Stage</h2>
          <p className="mt-4 text-lg text-gray-600">Choose the plan that fits your testing volume.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Basic */}
            <div className="pricing-card bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-left flex flex-col hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900">Basic</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <p className="text-4xl font-extrabold tracking-tight">$29</p>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">For freelancers and solo founders.</p>
              <hr className="my-6" />
              <ul className="space-y-4 flex-1">
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">10 Tests / mo</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Rollover up to 20</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Standard Support</span></li>
              </ul>
              <Link to="/login?plan=starter&segment=tech" className="mt-8 block w-full py-3 px-6 border border-indigo-600 rounded-md text-center font-medium text-indigo-600 hover:bg-indigo-50">
                Start Basic
              </Link>
            </div>

            {/* Pro */}
            <div className="pricing-card bg-white p-8 border-2 border-indigo-600 rounded-xl shadow-xl text-left flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold text-gray-900 mt-2">Pro</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <p className="text-4xl font-extrabold tracking-tight">$99</p>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">For growing product teams.</p>
              <hr className="my-6" />
              <ul className="space-y-4 flex-1">
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">50 Tests / mo</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">3 Seats</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">1 Custom Persona</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Rollover up to 100</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Priority Support</span></li>
              </ul>
              <Link to="/waitlist" className="mt-8 block w-full py-3 px-6 bg-indigo-600 rounded-md text-center font-medium text-white hover:bg-indigo-700">
                Join Waitlist
              </Link>
            </div>

            {/* Agency */}
            <div className="pricing-card bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-left flex flex-col hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900">Agency</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <p className="text-4xl font-extrabold tracking-tight">$489</p>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">For agencies and power users.</p>
              <hr className="my-6" />
              <ul className="space-y-4 flex-1">
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">100 Tests / mo</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">5 Seats</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">5 Custom Personas</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">White Label Reports</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Multi-client Support</span></li>
                <li className="flex items-start"><Check className="text-green-500 flex-shrink-0" /> <span className="ml-3 text-gray-600">Rollover up to 200</span></li>
              </ul>
              <Link to="/waitlist" className="mt-8 block w-full py-3 px-6 border border-indigo-600 rounded-md text-center font-medium text-indigo-600 hover:bg-indigo-50">
                Join Waitlist
              </Link>
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