import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Building, Award, Users, Zap } from "lucide-react";
const About = () => {
  const achievements = [{
    icon: Building,
    title: "Enterprise Experience",
    description: "Delivered solutions for Disney Parks & Resorts, Pluralsight, and leading SaaS companies"
  }, {
    icon: Award,
    title: "AI UX Expertise",
    description: <>
          Pioneer in the UX of AI as a consultant for{" "}
          <a href="https://www.jema.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            JEMA
          </a>{" "}
          and{" "}
          <a href="https://dovetail.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Dovetail
          </a>{" "}
          platforms.
        </>
  }, {
    icon: Users,
    title: "Startup Success",
    description: "Helped 50+ startups across Silicon Valley and Dallas achieve successful product launches"
  }, {
    icon: Zap,
    title: "Data-Driven Results",
    description: "Our critical research and analysis consistently delivers 300% average ROI improvements"
  }];
  return <section id="about" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <Badge variant="outline" className="mb-4">
              About Product Shift
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Thought Leadership in Growth & Strategy
            </h2>
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="w-48 h-48 flex-shrink-0 border-2 border-primary p-1.5">
                <AvatarImage src="/lovable-uploads/b52c1472-b6c4-49cb-b252-69a31081206e.png" alt="Jean, Product Shift Lead" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  I'm Jean, and I lead Product Shift in delivering data driven marketing strategy & product solutions. Our team has proven expertise in product & marketing strategy, media buying, and UX research methodologies that have transformed product & marketing strategies into the stratospheres of success. We're at the forefront of AI UX experience, helping companies leverage GenAI for unprecedented user insights and business growth.
                </p>
                <p>
                  Our extensive research expertise means you'll know your future customers better than they know themselves, converting them from hook, through conversion, and returning customers. We encourage our client's & partners to extend our insights across both marketing & product silos for the best results.
                </p>
                <p>
                  Our goal is to build customized flywheels based metrics & real-world data that generates automated growth & success for years un-end.
                </p>
              </div>
            </div>
          </div>

          {/* Right Grid */}
          <div className="grid gap-6">
            {achievements.map((achievement, index) => <Card key={achievement.title} className="group hover:shadow-subtle transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <achievement.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {achievement.title}
                      </h3>
                       <p className="text-sm text-muted-foreground">
                         {achievement.description}
                       </p>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Projects Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">70%</div>
            <div className="text-sm text-muted-foreground">Avg ROI Increase</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">90%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </section>;
};
export default About;