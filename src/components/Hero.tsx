import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Users } from "lucide-react";
import heroImage from "/lovable-uploads/187a5f3c-8c46-4f40-bd28-9395a8f1e23a.png";

const Hero = () => {
  return (
    <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6 inline-flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Data-driven AI UX & Strategy Expert</span>
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
              From broken demo to Omnichannel Cast to Guest Communication Software
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl animate-fade-in">
              How our research directed a failing internal tool to become a company-wide effective communication platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 transition-all duration-300">
                <a href="https://www.orangedrum.com/casestudy_sms.html" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20 animate-fade-in">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">300%</span>
                </div>
                <p className="text-sm text-white/80">Avg ROI Increase</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">50+</span>
                </div>
                <p className="text-sm text-white/80">Successful Launches</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="h-5 w-5 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">AI</span>
                </div>
                <p className="text-sm text-white/80">Powered Research</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-float">
            <img src={heroImage} alt="Team members at Disney Parks showcasing successful UX research implementation" className="w-full h-auto rounded-2xl shadow-elegant" />
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-hero rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent rounded-full opacity-30 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;