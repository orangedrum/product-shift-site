import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigation = {
    services: [
      { name: "UX Research", href: "#services" },
      { name: "AI-Powered UX", href: "#services" },
      { name: "Design Sprints", href: "#services" },
      { name: "Market Strategy", href: "#services" },
      { name: "A/B Testing", href: "#services" },
      { name: "Media Buying", href: "#services" },
    ],
    company: [
      { name: "About", href: "#about" },
      { name: "Blog", href: "#blog" },
      { name: "Contact", href: "https://calendly.com/jean-kaluza/media-buyer-op" },
    ],
    resources: [
      { name: "Medium Blog", href: "https://medium.com/@product_shift" },
      { name: "UX Research Guide", href: "#blog" },
      { name: "AI & UX Future", href: "#blog" },
      { name: "Agency Partnerships", href: "#services" },
    ]
  };

  const keywords = [
    "UX Researcher", "User Experience Researcher", "UX Research", "User Research",
    "Usability Testing", "User Interviews", "Surveys", "A/B Testing",
    "Ethnographic Research", "GenAI", "AI UX", "Design Sprints"
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <img 
                  src="/lovable-uploads/61ae62e9-22ad-4576-bc45-8ba397e73792.png" 
                  alt="Product Shift Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold text-foreground">Product Shift</span>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Partner with Product Shift to leverage proven UX research to level-up your market strategy & deliver predictable successful launches. Trusted by Disney Parks & Resorts, Pluralsight and start-ups across Silicon Valley, Dallas and beyond
              </p>
              <div className="space-y-2">
                <Badge variant="outline" className="mr-2">Enterprise Experience</Badge>
                <Badge variant="outline" className="mr-2">AI UX Experts</Badge>
                <Badge variant="outline" className="mr-2">Agency Partners</Badge>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Services
              </h3>
              <ul className="space-y-3">
                {navigation.services.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-3 mb-6">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SEO Keywords Section */}
        <div className="py-8 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Specializing In
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Product Shift. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a 
              href="https://www.instagram.com/theproductshift/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram size={16} />
              <span>@theproductshift</span>
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;