import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Brain, Zap, TrendingUp } from "lucide-react";

const Blog = () => {
  const articles = [
    {
      title: "The Future of AI-Driven UX Research: Transforming User Insights",
      excerpt: "Explore how GenAI is revolutionizing user research methodologies and delivering unprecedented insights for product teams.",
      category: "AI & UX",
      date: "2024-01-15",
      icon: Brain,
      featured: true
    },
    {
      title: "Integrating GenAI into Your UX Design Process",
      excerpt: "A comprehensive guide on seamlessly incorporating AI tools into your design workflow for enhanced productivity and innovation.",
      category: "GenAI",
      date: "2024-01-10",
      icon: Zap,
      featured: true
    },
    {
      title: "How AI is Shaping the Next Generation of User Experiences",
      excerpt: "Discover the emerging trends in AI-powered UX design and what it means for the future of digital product development.",
      category: "Future Tech",
      date: "2024-01-05",
      icon: TrendingUp,
      featured: true
    },
    {
      title: "Building Data-Driven Organizations Through UX Research",
      excerpt: "Learn proven strategies for transforming your company culture and decision-making processes with user-centered data.",
      category: "Strategy",
      date: "2023-12-20",
      icon: Brain,
      featured: false
    },
    {
      title: "The ROI of Comprehensive User Research",
      excerpt: "Quantifying the business impact of thorough UX research and how it translates to measurable growth metrics.",
      category: "Business",
      date: "2023-12-15",
      icon: TrendingUp,
      featured: false
    },
    {
      title: "Design Sprint Best Practices for SaaS Companies",
      excerpt: "Essential techniques and frameworks for running successful design sprints that deliver actionable insights quickly.",
      category: "Design Sprints",
      date: "2023-12-10",
      icon: Zap,
      featured: false
    }
  ];

  const featuredArticles = articles.filter(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured);

  return (
    <section id="blog" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Latest Insights
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Thought Leadership in AI & UX
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay ahead of the curve with our latest insights on AI-powered UX research, 
            GenAI integration, and the future of user experience design.
          </p>
        </div>

        {/* Featured Articles */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8">Featured: GenAI & Future of UX</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredArticles.map((article, index) => (
              <Card key={article.title} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <article.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {article.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(article.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground hover:bg-primary">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sought After Speaker Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-8">Sought After Speaker</h3>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <p className="text-lg text-muted-foreground mb-6">
                Enhance your event with product & UX insights from a world-class speaker and subject matter expert. 
                Virtual events, AMAs, live conferences or workshops are all available.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">UX & Product Strategy</h4>
                    <p className="text-sm text-muted-foreground">Deep insights into user-centered design and product development</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">AI-Powered UX</h4>
                    <p className="text-sm text-muted-foreground">Cutting-edge GenAI integration for enhanced user experiences</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-foreground">ROI of UX Research</h4>
                    <p className="text-sm text-muted-foreground">Quantifying business impact and growth through user research</p>
                  </div>
                </div>
              </div>
              <Button asChild>
                <a 
                  href="https://www.theproductshift.com/talks/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  View Speaking Topics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">NASA</Badge>
                  <h4 className="font-semibold text-foreground">"...inspired her colleagues again and again"</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  "Jean is an incredible member of the User Experience community. She has educated and 
                  inspired her colleagues again and again as an engaging speaker for several events and meetups."
                </p>
                <p className="text-xs text-muted-foreground">— Matt Lavoie, UX Designer at NASA</p>
              </Card>
              
              <Card className="p-6 bg-gradient-card border-border/50">
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">Equals</Badge>
                  <h4 className="font-semibold text-foreground">"...passionate UX speaker"</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  "Jean is a highly detail-oriented, analytical, and passionate UX speaker that was 
                  integral to embedding a user-centered design community in Orlando."
                </p>
                <p className="text-xs text-muted-foreground">— Tommy Hung, Product Designer at Equals</p>
              </Card>
            </div>
          </div>
          
          {/* Past Speaking Topics */}
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-6">Past Speaking Topics</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-4 hover:shadow-subtle transition-all duration-300">
                <h5 className="font-semibold text-foreground mb-2">The ROI of UX</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Flawed logic in product teams and the great returns from UX investment
                </p>
                <Badge variant="secondary" className="text-xs">40 min • DUX Orlando</Badge>
              </Card>
              
              <Card className="p-4 hover:shadow-subtle transition-all duration-300">
                <h5 className="font-semibold text-foreground mb-2">Where the Product Grows</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Growth opportunities at the intersection of marketing & product
                </p>
                <Badge variant="secondary" className="text-xs">15 min • Growthmentor</Badge>
              </Card>
              
              <Card className="p-4 hover:shadow-subtle transition-all duration-300">
                <h5 className="font-semibold text-foreground mb-2">Usability for Entrepreneurs</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  UX & strategy from an entrepreneur's perspective with pivot examples
                </p>
                <Badge variant="secondary" className="text-xs">30 min • Canvs Orlando</Badge>
              </Card>
              
              <Card className="p-4 hover:shadow-subtle transition-all duration-300">
                <h5 className="font-semibold text-foreground mb-2">Psych Javascript</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Javascript-driven analytics for powerful insights and metrics
                </p>
                <Badge variant="secondary" className="text-xs">15 min • Orlando Devs</Badge>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-subtle rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Want More Insights?
            </h3>
            <p className="text-muted-foreground mb-6">
              Follow our Medium publication for the latest in UX research and AI-powered design.
            </p>
            <Button asChild variant="outline">
              <a 
                href="https://medium.com/@product_shift" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                Visit Our Medium
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;