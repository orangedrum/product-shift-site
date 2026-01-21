import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

const BlogWhyAudit: React.FC = () => {
  useEffect(() => {
    document.title = "Why Small Businesses Need a Website Audit | Product Shift";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', "Is your website silently losing you money? Learn why every small business needs a usability audit to fix hidden friction points.");
    }
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900">
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
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Your Free Website Audit Now <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogWhyAudit;