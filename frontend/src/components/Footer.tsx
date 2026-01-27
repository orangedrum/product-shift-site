import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate('/' + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const tags = [
    'Enterprise Experience',
    'AI, UX Experts',
    'Agency Partners',
  ];
  const serviceLinks = [
    { name: 'Strategic Media Buying', href: '#services' },
    { name: 'HealthTech UX Research', href: '#services' },
    { name: 'AI-Driven Product Strategy', href: '#services' },
    { name: 'Rapid MedTech Prototyping', href: '#services' },
    { name: 'Patient & Provider Personas', href: '#services' },
    { name: 'Conversion Rate Optimization', href: '#services' },
  ];
  const companyLinks = [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Products', href: '#products' },
    { name: 'Contact', href: '#contact' },
  ];
  const resourceLinks = [
    { name: 'Medium Blog', href: '#' },
    { name: 'UX Research Guide', href: '#' },
    { name: 'AI & UX Future', href: '#' },
    { name: 'Agency Partnerships', href: '#' },
  ];
  const specializations = [
    'Data-Driven UX',
    'HealthTech UX',
    'MedTech Product Design',
    'Patient-Centric Design',
    'AI-Driven Research',
    'Behavioral Science',
    'Clinical UX',
    'Rapid Prototyping',
    'User Research',
    'Usability Testing',
    'GenAI Strategy',
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
              <Link to="/" title="Product Shift Home" className="flex items-center gap-3">
                <img className="h-8 w-auto" src="/logo.png" alt="Product Shift" />
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  Product Shift
                </span>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Partner with Product Shift to leverage data-driven UX for HealthTech to level-up your market strategy & deliver predictable successful launches. Trusted by Disney Parks & Resorts, Pluralsight and MedTech start-ups across Silicon Valley, Dallas and beyond.
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
                    <a 
                      href={link.href} 
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                    >
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
                    <a 
                      href={link.href} 
                      onClick={(e) => link.href.startsWith('#') ? handleNavClick(e, link.href) : undefined}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                    >
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