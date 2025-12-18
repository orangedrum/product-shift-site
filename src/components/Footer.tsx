import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const tags = [
    'Enterprise Experience',
    'AI, UX Experts',
    'Agency Partners',
  ];
  const serviceLinks = [
    { name: 'UX Research', href: 'https://www.theproductshift.com/#services' },
    { name: 'AI-Powered Design Sprints', href: 'https://www.theproductshift.com/#services' },
    { name: 'Market Strategy', href: 'https://www.theproductshift.com/#services' },
    { name: 'A/B Testing', href: 'https://www.theproductshift.com/#services' },
    { name: 'Media Buying', href: 'https://www.theproductshift.com/#services' },
  ];
  const companyLinks = [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Contact', href: '#' },
  ];
  const resourceLinks = [
    { name: 'Medium Blog', href: '#' },
    { name: 'UX Research Guide', href: '#' },
    { name: 'AI & UX Future', href: '#' },
    { name: 'Agency Partnerships', href: '#' },
  ];
  const specializations = [
    'UX Researcher',
    'User Experience Researcher',
    'UX Research',
    'User Research',
    'Usability Testing',
    'User Interviews',
    'Surveys',
    'A/B Testing',
    'Ethnographic Research',
    'GenAI',
    'AI UX',
    'Design Sprints',
  ];
  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/theproductshift/', icon: <Instagram size={20} /> },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/product-shift', icon: <Linkedin size={20} /> },
  ];
  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Column 1 */}
          <div className="space-y-6 lg:max-w-md">
            <div className="flex-shrink-0">
              <a href="https://www.theproductshift.com" title="Product Shift Home" className="flex items-center gap-3">
                <img className="h-8 w-auto" src="/logo.png" alt="Product Shift" />
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  Product Shift
                </span>
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Partner with Product Shift to leverage proven UX research to level-up your market strategy & deliver predictable successful launches. Trusted by Disney Parks & Resorts, Pluralsight and start-ups across Silicon Valley, Dallas and beyond.
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {/* Wrapper for columns 2, 3, 4 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Column 2 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Services</h3>
              <ul className="space-y-3">
                {serviceLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Column 3 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Column 4 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Resources</h3>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Row 2: Specializations */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
            Specializing In
          </h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <span key={spec} className="px-3 py-1 text-xs font-medium text-gray-600 bg-brand-tag-bg rounded-full">
                {spec}
              </span>
            ))}
          </div>
        </div>
        {/* Row 3: Copyright and Legal */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500 order-2 md:order-1">
            &copy; {currentYear} Product Shift, LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-6 order-1 md:order-2">
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-gray-400 hover:text-gray-500 transition-colors">
                <span className="sr-only">{link.name}</span>
                {link.icon}
              </a>
            ))}
            {legalLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;