import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoButton } from './NeoButton';
import { NeoCard } from './NeoCard';
import { Save, Loader, Trash2, Edit, Plus, LayoutDashboard, ExternalLink, Lock } from 'lucide-react';
import AdminHeader from './AdminHeader';

const AdminBlog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isWriteAccess, setIsWriteAccess] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Business');
  const [imageUrl, setImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoSchema, setSeoSchema] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const adminKey = localStorage.getItem('productShiftAdminKey');
      const { data: { session: sbSession } } = await supabase.auth.getSession();

      if (sbSession) {
        setSession(sbSession);
        setIsWriteAccess(true);
        fetchPosts();
      } else if (adminKey) {
        // Allow access if key exists, but mark as read-only
        setSession({ user: { email: 'view-only' } });
        setIsWriteAccess(false);
        fetchPosts();
      } else {
        navigate('/admin-login');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setIsWriteAccess(true);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false });
    if (!error && data) setPosts(data);
  };

  // Auto-generate slug from title only if we are creating a new post
  useEffect(() => {
    if (!editingId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title, editingId]);

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || '');
    setContent(post.content || '');
    setCategory(post.category || 'Business');
    setImageUrl(post.image_url || '');
    setExternalLink(post.external_link || '');
    setIsFeatured(post.is_featured);
    setSeoSchema(post.seo_schema || null);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) alert('Error deleting post');
    else fetchPosts();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCategory('Business');
    setImageUrl('');
    setExternalLink('');
    setIsFeatured(false);
    setSeoSchema(null);
    setView('list');
  };

  const handleSave = async (forceStatus?: 'published') => {
    setLoading(true);

    const originalPost = editingId ? posts.find(p => p.id === editingId) : null;
    const targetStatus = forceStatus || originalPost?.status || 'draft';

    let publishedDate = originalPost?.published_at;
    // Set a new publish date only if we are moving from a non-published state to published
    if (targetStatus === 'published' && originalPost?.status !== 'published') {
      publishedDate = new Date().toISOString();
    } else if (targetStatus === 'published' && !editingId) {
      publishedDate = new Date().toISOString();
    }

    const postData = {
      title,
      slug,
      excerpt,
      content,
      category,
      image_url: imageUrl,
      external_link: externalLink || null,
      is_featured: isFeatured,
      published_at: publishedDate,
      status: targetStatus,
      seo_schema: seoSchema
    };

    try {
      if (editingId) {
        // Update existing
        const { data, error } = await supabase.from('posts').update(postData).eq('id', editingId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Update ignored. Please sign in via /blog-login to verify write permissions.');
      } else {
        // Create new
        const { data, error } = await supabase.from('posts').insert([postData]).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Insert ignored. Please sign in via /blog-login to verify write permissions.');
      }
      
      if (targetStatus === 'published') {
        alert('Post published successfully!');
      } else {
        alert('Draft saved successfully!');
      }
      fetchPosts();
      resetForm();
    } catch (error: any) {
      alert('Error saving post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="py-12">
      
      {/* Write Access Warning Banner */}
      {!isWriteAccess && (
        <div className="container mx-auto px-4 max-w-5xl mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 flex justify-between items-center rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-blue-500 mr-3" />
              <p className="text-sm text-blue-700">
                <strong>View Only Mode:</strong> You are logged in with the Dashboard Key. To publish or edit posts, you must verify your email.
              </p>
            </div>
            <button onClick={() => navigate('/blog-login')} className="text-sm font-bold text-blue-700 hover:text-blue-900 underline bg-transparent border-none cursor-pointer">
              Sign In to Edit
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          {view === 'list' && (
            <NeoButton onClick={() => setView('form')} icon={<Plus size={18} />}>
              New Post
            </NeoButton>
          )}
        </div>

        {view === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="text-xs text-gray-500">{post.slug}</div>
                      {post.status === 'draft' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.published_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(post)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No posts found. Create your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <NeoCard title={editingId ? "Edit Post" : "Create New Post"}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Slug (URL)</label>
                  <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>Business</option>
                    <option>AI & UX</option>
                    <option>HealthTech</option>
                    <option>GenAI</option>
                    <option>Website Optimization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">External Link (Optional)</label>
                  <input type="url" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="https://..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Excerpt</label>
                <textarea required rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Content (HTML supported)</label>
                <textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm" />
              </div>

              {/* SEO Schema Indicator */}
              {seoSchema && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <LayoutDashboard size={16} className="text-green-600" />
                  </div>
                  <div className="text-sm text-green-800 font-medium">
                    GEO/SEO Structured Data is attached to this post.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                <div>
                  <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                </div>
                <div className="flex items-center gap-4">
                  <NeoButton type="button" variant="secondary" onClick={() => handleSave()} disabled={loading}>
                    {loading ? <Loader className="animate-spin" /> : <Save />} Update
                  </NeoButton>
                  
                  {isWriteAccess ? (
                    <NeoButton type="button" onClick={() => handleSave('published')} disabled={loading}>
                      {loading ? <Loader className="animate-spin" /> : <ExternalLink />} Save & Publish
                    </NeoButton>
                  ) : (
                    <NeoButton type="button" onClick={() => navigate('/blog-login')} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Lock size={18} className="mr-2" /> Sign in to Publish
                    </NeoButton>
                  )}
                </div>
              </div>
            </form>
          </NeoCard>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminBlog;