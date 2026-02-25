import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const simpleMarkdownToHtml = (text = '') => {
    // Strip out the SEO Data block from the visible text
    const contentWithoutSeo = text.replace(/## SEO Data \(JSON-LD\)[\s\S]*$/, '').trim();

    return contentWithoutSeo
      .split('\n')
      .map(line => {
        // Remove custom tags like !Cover Image and trim
        line = line.replace(/!Cover Image/gi, '').trim();
        if (line === '') return null; // Skip empty lines
  
        // Headers
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
        
        // HR
        if (line.trim() === '---') return '<hr />';
        
        // Blockquote
        if (line.startsWith('> ')) return `<blockquote><p>${line.substring(2)}</p></blockquote>`;
  
        // Inline formatting for paragraphs
        line = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>');
        
        // Default to paragraph
        return `<p>${line}</p>`;
      })
      .filter(Boolean) // Remove nulls from empty lines
      .join('');
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
      } else {
        setPost(data);
        // Increment view count securely
        if (data?.id) {
          supabase.rpc('increment_post_view', { post_id: data.id });
        }
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  // Extract SEO data from content if it exists there but not in the column
  const getSeoData = () => {
    if (post?.seo_schema) return post.seo_schema;
    
    if (post?.content) {
      const match = post.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && post.content.includes('SEO Data (JSON-LD)')) {
        try {
          return JSON.parse(match[1]);
        } catch (e) {
          console.error('Failed to parse embedded SEO data', e);
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-500 mb-8">The article you are looking for doesn't exist or has been moved.</p>
        <Link to="/blog" className="text-indigo-600 font-bold hover:underline">
          &larr; Back to Blog
        </Link>
      </div>
    );
  }

  const activeSeoSchema = getSeoData();

  return (
    <>
      <Helmet>
        <title>{post.title} | Product Shift</title>
        <meta name="description" content={post.excerpt} />
        {activeSeoSchema && (
          <script type="application/ld+json">{JSON.stringify(activeSeoSchema)}</script>
        )}
      </Helmet>

      <article className="bg-white min-h-screen pb-20">
        {/* Hero Header */}
        <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/50 z-10"></div>
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-marketing-gradient"></div>
          )}
          
          <div className="absolute inset-0 z-20 flex flex-col justify-end container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <Link to="/blog" className="text-white/80 hover:text-white flex items-center mb-6 transition-colors w-fit">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Blog
            </Link>
            
            <div className="flex items-center gap-4 mb-4 text-sm font-medium text-white/90">
              <span className="bg-indigo-600/90 px-3 py-1 rounded-full backdrop-blur-sm flex items-center">
                <Tag className="w-3 h-3 mr-2" />
                {post.category}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white max-w-4xl leading-tight">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg prose-indigo text-gray-700">
              <p className="lead text-xl text-gray-500 font-medium mb-8 border-l-4 border-indigo-500 pl-4 italic">
                {post.excerpt}
              </p>
              
              {/* Render HTML Content */}
              <div 
                dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(post.content) }} 
                className="space-y-6 [&>p]:leading-relaxed [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-12 [&>h2]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>li]:mb-2"
              />
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;
