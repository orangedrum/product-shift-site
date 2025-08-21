import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ServicesCTA from "@/components/ServicesCTA";
import About from "@/components/About";
import Blog from "@/components/Blog";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <ServicesCTA />
        <About />
        <Blog />
        <Blog />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
