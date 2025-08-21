import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, CheckCircle } from "lucide-react";
const CTA = () => {
  const benefits = ["Free 30-minute consultation", "Custom UX research strategy", "AI-powered insights preview", "ROI improvement roadmap"];
  return <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-glow">
            <CardContent className="p-8 md:p-12 text-center">
              <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary">Ready to Transform Your Strategy?</Badge>
              
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Book Your Free Consultation Today
              </h2>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Discover how Product Shift's UX research can deliver real data that transforms your product launches and drives marketing ROI growth.</p>

              {/* Benefits Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                {benefits.map(benefit => <div key={benefit} className="flex items-center text-left">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </div>)}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button size="lg" asChild className="bg-gradient-hero hover:shadow-elegant transition-all duration-300 text-lg px-8 py-6">
                  <a href="https://calendly.com/jean-kaluza/meeting" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                
                <Button variant="outline" size="lg" asChild>
                  <a href="#services" className="text-lg px-8 py-6">
                    Learn More About Services
                  </a>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                No commitment required • 30-minute session • Immediate insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default CTA;