import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, BarChart3, Zap, Target, TrendingUp, Brain, TestTube, MessageSquare, PieChart, Lightbulb, Megaphone } from "lucide-react";
const Services = () => {
  const services = [{
    icon: Megaphone,
    title: "Media Buying",
    description: "Strategic advertising campaigns that convert based on user research insights",
    features: ["Targeted Campaigns", "Performance Marketing", "ROI Optimization", "Multi-Platform"]
  }, {
    icon: Search,
    title: "UX Research",
    description: "Deep user insights through ethnographic research, usability testing, and user interviews",
    features: ["User Interviews", "Usability Testing", "Ethnographic Research", "Surveys & Analytics"]
  }, {
    icon: Brain,
    title: "AI-Powered UX",
    description: "Cutting-edge GenAI integration for enhanced user experiences and data-driven insights",
    features: ["GenAI UX Design", "AI User Testing", "Automated Research", "ML-Driven Insights"]
  }, {
    icon: Zap,
    title: "Design Sprints",
    description: "Rapid prototyping and validation to accelerate your product development cycle",
    features: ["5-Day Sprints", "Rapid Prototyping", "User Validation", "Concept Testing"]
  }, {
    icon: Target,
    title: "Market Strategy",
    description: "Data-driven market positioning and go-to-market strategies for successful launches",
    features: ["Market Research", "Positioning Strategy", "Competitor Analysis", "Launch Planning"]
  }, {
    icon: TestTube,
    title: "A/B Testing",
    description: "Optimize conversion rates through systematic experimentation and data analysis",
    features: ["Conversion Testing", "Statistical Analysis", "Performance Metrics", "Optimization"]
  }];
  return <a href="https://www.fiverr.com/s/GzbZ3Bd" target="_blank" rel="noopener noreferrer" className="block">
    <section id="services" className="py-20 bg-background hover:bg-muted/20 transition-colors duration-300 cursor-pointer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Our Services
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Complete Growth & Strategy Solutions</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From initial research to successful launch, we provide end-to-end growth strategies that drive results. 
            Perfect for agencies looking to expand their offerings or marketing teams hungry for high ROIs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => <Card key={service.title} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-border/50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map(feature => <li key={feature} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </li>)}
                </ul>
              </CardContent>
            </Card>)}
        </div>

        {/* Agency Partnership Section */}
        <div className="mt-20">
          <Card className="bg-gradient-subtle border-border/50 p-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Perfect Partner for Agencies
              </h3>
              <p className="text-muted-foreground mb-6">
                Enhance your agency's offerings with our specialized UX research and AI expertise. 
                We seamlessly integrate with your existing client relationships to deliver exceptional results.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="secondary">White-label Services</Badge>
                <Badge variant="secondary">Agency Partnerships</Badge>
                <Badge variant="secondary">Client Expansion</Badge>
                <Badge variant="secondary">Revenue Growth</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  </a>;
};
export default Services;