import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Check, Linkedin, Twitter, Facebook, Link as LinkIcon, ChevronLeft, Brain } from 'lucide-react';
import { Header } from '../components/Header';
import Footer from '../components/Footer';

const BlogWhyAudit: React.FC = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('✅ BlogWhyAudit Component Mounted Successfully');
    document.title = "Why Small Businesses Need a Website Audit | Product Shift";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Is your website silently losing you money? Learn why every small business needs a usability audit to fix hidden friction points.");
    }
  }, []);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trackCtaClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'click_audit_cta', {
        event_category: 'engagement',
        event_label: 'blog_bottom_cta'
      });
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 flex flex-col">
      <Header />
      
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/#blog" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            <ChevronLeft size={16} className="mr-1" /> Back to Insights
          </Link>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
           <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 rounded-full">
             Website Optimization
           </div>
           <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl mb-4">
             Is Your Website Silently Losing You Money?
           </h1>
           <p className="text-xl text-gray-500">
             Why Every Small Business Needs a Website Audit.
           </p>
        </header>

        <div className="prose prose-lg prose-indigo mx-auto text-gray-600 leading-relaxed">
          <p className="mb-6">
            You did everything right. You hired a designer, wrote the copy, and launched your small business website. It looks professional, it has all your contact info, and it shows up on Google. So why aren't the calls, emails, and sales flooding in?
          </p>
          <p className="mb-8">
            The hard truth is that a "good-looking" website can still be a leaky bucket, quietly losing potential customers every single day due to hidden issues you can't see. This is where a website audit comes in.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">The "Good Enough" Website is a Myth</h3>
          <p className="mb-4">
            Many business owners believe their website is "good enough." But in a competitive market, "good enough" often means "not working." Common hidden problems include:
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Confusing Navigation: Visitors can't find what they're looking for in 5 seconds.",
              "Unclear CTAs: Your 'Contact Us' button is buried or hard to find.",
              "Slow Load Times: 53% of mobile users abandon sites that take >3s to load.",
              "Broken Forms: Your contact form looks fine but isn't sending leads."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mb-8">These small friction points add up, creating a poor user experience that costs you sales.</p>

          <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">You Can't Be Your Own Customer</h3>
          <p className="mb-8">
            As the business owner, you suffer from the "curse of knowledge." You know your products, your industry jargon, and exactly how your website is supposed to work. You can't see it with fresh eyes. What seems obvious to you might be completely confusing to a first-time visitor.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-10 mb-4">The ROI of a Simple Audit</h3>
          <p className="mb-4">
            Fixing your website isn't a cost; it's an investment with a direct return. By identifying and fixing the key friction points on your site, you can:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Increase Conversion Rates</li>
            <li>Improve Customer Experience</li>
            <li>Boost SEO Rankings</li>
          </ul>

          <div className="mt-12 p-8 bg-indigo-50 rounded-2xl border-2 border-indigo-100 text-center">
            <h3 className="text-2xl font-black text-indigo-900 mb-4">Find Your Website's Hidden Problems—For Free</h3>
            <p className="text-indigo-700 mb-6">
              Ready to stop guessing? We're offering a free, instant AI website audit to show you exactly where you're losing customers.
            </p>
            <Link 
              to="/free-website-audit-for-small-business" 
              onClick={trackCtaClick}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Your Free Website Audit Now <ArrowRight className="ml-2" />
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Share this article</span>
              <div className="flex gap-3">
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-[#0077b5] hover:text-white transition-all"
                  title="Share on LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Is your website silently losing you money? Learn why every small business needs a usability audit.")}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-[#1da1f2] hover:text-white transition-all"
                  title="Share on Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-[#1877f2] hover:text-white transition-all"
                  title="Share on Facebook"
                >
                  <Facebook size={20} />
                </a>
                <button 
                  onClick={handleCopyLink}
                  className="p-3 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-800 hover:text-white transition-all"
                  title="Copy Link"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <LinkIcon size={20} />}
                </button>
              </div>
              {copied && <span className="text-xs text-green-600 font-bold animate-fade-in">Link Copied!</span>}
            </div>
          </div>
        </div>
      </article>

      {/* Next Article Suggestion */}
      <section className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Read Next</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">The Future of AI-Driven UX Research</h4>
                <p className="text-gray-600 mb-4">Explore how GenAI is revolutionizing user research methodologies and delivering unprecedented insights for product teams.</p>
                <span className="text-indigo-600 font-medium text-sm">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogWhyAudit;