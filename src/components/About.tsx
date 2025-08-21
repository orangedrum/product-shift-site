import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Award, Users, Zap } from "lucide-react";

const About = () => {
  const achievements = [
    {
      icon: Building,
      title: "Enterprise Experience",
      description: "Delivered solutions for Disney Parks & Resorts, Pluralsight, and leading SaaS companies"
    },
    {
      icon: Award,
      title: "AI UX Expertise",
      description: (
        <>
          Pioneer in the UX of AI as a consultant for{" "}
          <a 
            href="https://www.jema.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            JEMA
          </a>{" "}
          and{" "}
          <a 
            href="https://dovetail.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Dovetail
          </a>{" "}
          platforms.
        </>
      )
    },
    {
      icon: Users,
      title: "Startup Success",
      description: "Helped 50+ startups across Silicon Valley and Dallas achieve successful product launches"
    },
    {
      icon: Zap,
      title: "Data-Driven Results",
      description: "Our critical research and analysis consistently delivers 300% average ROI improvements"
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-subtle">
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
            <div className="space-y-4 text-muted-foreground">
              <p>
                I'm Jean, and I lead Product Shift in delivering cutting-edge UX Design & Product Management 
                solutions. Our team has proven expertise working with industry leaders like Disney Parks & Resorts, 
                Pluralsight, and innovative startups across Silicon Valley, Dallas, and beyond.
              </p>
              <p>
                Our critical research and analysis has proven time and time again necessary for successful UX 
                in digital products. We pride ourselves on Product Shift's methods and strategies in developing 
                comprehensive product processes that transform organizations into data-driven powerhouses.
              </p>
              <p>
                With deep experience from leading platforms like JEMA and Dovetail, we're at the forefront of 
                AI-powered UX research, helping companies leverage GenAI for unprecedented user insights and 
                business growth.
              </p>
            </div>
          </div>

          {/* Right Grid */}
          <div className="grid gap-6">
            {achievements.map((achievement, index) => (
              <Card key={achievement.title} className="group hover:shadow-subtle transition-all duration-300">
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
              </Card>
            ))}
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
            <div className="text-3xl font-bold text-foreground mb-2">300%</div>
            <div className="text-sm text-muted-foreground">Avg ROI Increase</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">90%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;