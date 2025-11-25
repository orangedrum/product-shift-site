import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IncubatorBanner from "@/components/IncubatorBanner";
import Services from "@/components/Services";
import ServicesCTA from "@/components/ServicesCTA";
import Speaker from "@/components/Speaker";
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
        <IncubatorBanner />
        <Services />
        <ServicesCTA />
        <Speaker />
        <About />
        <Blog />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
