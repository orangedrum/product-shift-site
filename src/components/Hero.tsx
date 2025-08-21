import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Users, ExternalLink } from "lucide-react";

const Hero = () => {
  return (
    <section 
      className="relative pt-24 pb-12 md:pt-32 md:pb-20 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(/lovable-uploads/745dd2a9-5ef0-4587-9203-d83e8c9273d8.png)` }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6 inline-flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Data-driven AI UX & Strategy Expert</span>
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              From Broken Demo to
              <span className="bg-gradient-hero bg-clip-text text-transparent"> Disney's Omnichannel Platform</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in">
              Learn how my research at Disney led to a company-wide communication revolution. 
              See the proven methodologies that turn user insights into transformative business outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
              <Button 
                size="lg" 
                asChild
                className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                <a 
                  href="#" 
                  className="flex items-center"
                >
                  View Disney Case Study
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                asChild
              >
                <a 
                  href="https://calendly.com/jean-kaluza/meeting" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Book Free Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

          </div>

          {/* Right Content - Stats moved here */}
          <div className="relative animate-float">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
              <h3 className="text-2xl font-bold text-foreground mb-6">Impact & Results</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <span className="text-3xl font-bold text-foreground">300%</span>
                    <p className="text-muted-foreground">Average ROI Increase</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <span className="text-3xl font-bold text-foreground">50+</span>
                    <p className="text-muted-foreground">Successful Launches</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <span className="text-3xl font-bold text-foreground">AI</span>
                    <p className="text-muted-foreground">Powered Research</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;