import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Brain, Zap, TrendingUp, Search } from 'lucide-react';
import { Header } from '../components/Header';
import Footer from '../components/Footer';

const BlogIndex = () => {
  const articles = [
    {
      title: "Is Your Website Silently Losing You Money?",
      excerpt: "Why every small business needs a usability audit to fix hidden friction points and increase conversions.",
      category: "Website Optimization",
      date: "2024-01-25",
      icon: Search,
      image: "https://images.unsplash.com/photo-1518183214770-9cffbec72538?auto=format&fit=crop&w=800&q=80",
      link: "/blog/why-small-businesses-need-website-audit"
    },
    {
      title: "The Future of AI-Driven UX Research",
      excerpt: "Explore how GenAI is revolutionizing user research methodologies and delivering unprecedented insights for product teams.",
      category: "AI & UX",
      date: "2024-01-15",
      icon: Brain,
      link: "#"
    },
    {
      title: "Integrating GenAI into Your UX Design Process",
      excerpt: "A comprehensive guide on seamlessly incorporating AI tools into your design workflow for enhanced productivity.",
      category: "GenAI",
      date: "2024-01-10",
      icon: Zap,
      link: "#"
    },
    {
      title: "The ROI of Comprehensive User Research",
      excerpt: "Quantifying the business impact of thorough UX research and how it translates to measurable growth metrics.",
      category: "Business",
      date: "2023-12-15",
      icon: TrendingUp,
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Product Shift <span className="text-indigo-600">Insights</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Expert perspectives on UX research, AI integration, and product strategy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {articles.map((article, index) => (
            <Link key={index} to={article.link} className="block group h-full">
              <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                {/* Image or Icon Header */}
                <div className="h-48 relative overflow-hidden bg-gray-100">
                  {article.image ? (
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                      <article.icon className="w-16 h-16 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-xs text-gray-400 mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-6 flex-grow line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform mt-auto">
                    Read Article <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogIndex;