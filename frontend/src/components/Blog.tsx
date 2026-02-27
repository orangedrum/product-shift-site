import React, { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Brain, Zap, TrendingUp, Search, PenTool, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Blog = () => {
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const getIconForCategory = (category: string) => {
    const map: Record<string, any> = {
      'Website Optimization': Search,
      'AI & UX': Brain,
      'GenAI': Zap,
      'Business': TrendingUp,
      'Health Tech': Activity
    };
    return map[category] || PenTool;
  };

  const fallbackArticles = [
    {
      title: "Is Your Website Silently Losing You Money?",
      excerpt: "Why every small business needs a usability audit to fix hidden friction points and increase conversions.",
      category: "Website Optimization",
      date: "2024-01-25",
      icon: Search,
      featured: true,
      image: "https://images.unsplash.com/photo-1518183214770-9cffbec72538?auto=format&fit=crop&w=800&q=80",
      link: "/blog/why-small-businesses-need-website-audit"
    },
    {
      title: "The Future of AI-Driven UX Research",
      excerpt: "Explore how GenAI is revolutionizing user research methodologies and delivering unprecedented insights for product teams.",
      category: "AI & UX",
      date: "2024-01-15",
      icon: Brain,
      featured: false,
      link: "#"
    },
    {
      title: "Integrating GenAI into Your UX Design Process",
      excerpt: "A comprehensive guide on seamlessly incorporating AI tools into your design workflow for enhanced productivity.",
      category: "GenAI",
      date: "2024-01-10",
      icon: Zap,
      featured: false,
      link: "#"
    },
    {
      title: "The ROI of Comprehensive User Research",
      excerpt: "Quantifying the business impact of thorough UX research and how it translates to measurable growth metrics.",
      category: "Business",
      date: "2023-12-15",
      icon: TrendingUp,
      featured: false,
      link: "#"
    }
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published') // Only show published posts
          .order('published_at', { ascending: false });
        
        if (error) {
          console.warn("Could not fetch blog posts, using fallback.", error);
        } else if (data && data.length > 0) {
          setDbPosts(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (location.pathname === '/blog') {
      let link = document.querySelector("link[rel~='canonical']");
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', 'https://www.theproductshift.com/blog');
    }
  }, [location.pathname]);

  const articlesFromDb = dbPosts.map(post => ({
    title: post.title,
    excerpt: post.excerpt,
    category: post.category || 'General',
    date: post.published_at || post.created_at,
    icon: getIconForCategory(post.category),
    featured: post.is_featured,
    image: post.image_url,
    link: post.external_link || `/blog/${post.slug}`,
  }));

  // Create a Set of links from the database posts to avoid duplicates
  const dbLinks = new Set(articlesFromDb.map(p => p.link));

  // Filter fallback articles to exclude any that are now in the database
  const uniqueFallbackArticles = fallbackArticles.filter(p => !dbLinks.has(p.link));

  // Combine and sort, ensuring newest articles appear first
  const displayArticles = [...articlesFromDb, ...uniqueFallbackArticles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredArticle = displayArticles.find(article => article.featured);
  const regularArticles = displayArticles.filter(article => !article.featured);

  return (
    <section id="blog" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 mb-4">
            Latest Insights
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Thought Leadership in HealthTech UX & AI
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Stay ahead of the curve with our latest insights on data-driven UX for HealthTech, 
            AI-powered research, and the future of patient-centric design.
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <div className="mb-12">
            <Link 
              to={featuredArticle.link.startsWith('http') ? '#' : featuredArticle.link} 
              onClick={(e) => featuredArticle.link.startsWith('http') ? window.open(featuredArticle.link, '_blank') : null}
              className="block group"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative min-h-[240px] overflow-hidden">
                    {/* Use image if available, otherwise fallback to gradient/icon */}
                    <div className="absolute inset-0 bg-marketing-gradient"></div>
                    <img 
                      src={featuredArticle.image} 
                      alt={featuredArticle.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {featuredArticle.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(featuredArticle.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {regularArticles.map((article, index) => {
            const isExternal = article.link.startsWith('http');
            return (
            <Link 
              key={index} 
              to={isExternal ? '#' : article.link} 
              onClick={(e) => isExternal ? window.open(article.link, '_blank') : null}
              className="block group h-full"
            >
              <div className="h-full rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <article.icon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 flex-grow">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center">
                    Read <ArrowRight className="ml-1 w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want More Insights?
            </h3>
            <p className="text-gray-600 mb-6">
              Follow our Medium publication for the latest in UX research and AI-powered design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://medium.com/@product_shift" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                Visit Our Medium
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a 
                href="https://dovetail.com/contributors/jean-kaluza/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 shadow-sm"
              >My Work on Dovetail</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;