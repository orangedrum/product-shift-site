import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";

const ServicesCTA = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-hero hover:shadow-elegant transition-all duration-300 text-lg px-8 py-4"
          >
            <a 
              href="https://calendly.com/jean-kaluza/meeting" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesCTA;