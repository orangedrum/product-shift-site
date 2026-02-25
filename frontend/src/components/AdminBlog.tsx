import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoButton } from './NeoButton';
import { NeoCard } from './NeoCard';
import { Save, Loader, Trash2, Edit, Plus, LayoutDashboard, ExternalLink } from 'lucide-react';
import AdminHeader from './AdminHeader';

const AdminBlog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
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
  const [status, setStatus] = useState('published');
  const [seoSchema, setSeoSchema] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const adminKey = localStorage.getItem('productShiftAdminKey');
      const { data: { session: sbSession } } = await supabase.auth.getSession();

      if (!adminKey && !sbSession) {
        navigate('/admin-login');
      } else {
        // Allow access if key exists, mock session if needed to pass render check
        setSession(sbSession || { user: { email: 'admin' } });
        fetchPosts();
      }
    };
    checkAuth();
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
    setStatus(post.status || 'published');
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
    setStatus('published');
    setSeoSchema(null);
    setView('list');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const postData = {
      title,
      slug,
      excerpt,
      content,
      category,
      image_url: imageUrl,
      external_link: externalLink || null,
      is_featured: isFeatured,
      published_at: new Date().toISOString(),
      status,
      seo_schema: seoSchema
    };

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase.from('posts').update(postData).eq('id', editingId);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) throw error;
      }
      
      alert('Post saved successfully!');
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                <NeoButton type="submit" disabled={loading}>
                  {loading ? <Loader className="animate-spin mr-2" /> : <Save className="mr-2" />}
                  {status === 'published' ? (editingId ? 'Update & Publish' : 'Publish Post') : 'Save Draft'}
                </NeoButton>
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