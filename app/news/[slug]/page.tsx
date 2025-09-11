'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  published_at: string;
}

const formatPostDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function PostPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');

    try {
      // --- THE FIX IS HERE ---
      // We are now querying for a status of 'published' or 'featured'
      // instead of the old 'is_published' boolean.
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .in('status', ['published', 'featured']) // This is the corrected line
        .single();

      if (error) throw new Error('Post not found or you do not have permission to view it.');
      if (data) {
        setPost(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {loading && <p className="text-center text-gray-400">Loading post...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {post && (
            <div className="bg-[#fdf3d9] text-[#3f2713] p-8 md:p-12 rounded-lg shadow-2xl border-2 border-[#856444]">
              <div className="mb-6 text-center border-b-2 border-[#d6b994] pb-4">
                <p className="text-sm font-semibold tracking-widest uppercase">{formatPostDate(post.published_at)}</p>
                <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ fontFamily: 'var(--font-runescape)' }}>{post.title}</h1>
              </div>

              <article className="prose prose-stone max-w-none prose-h2:font-bold prose-h2:border-b-2 prose-h2:border-[#d6b994] prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-a:text-blue-800 prose-a:font-semibold hover:prose-a:text-blue-600 prose-strong:font-bold">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </article>

              <div className="mt-8 pt-4 border-t-2 border-[#d6b994]">
                <Link href="/" className="text-blue-800 hover:text-blue-600 font-bold">
                  &larr; Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}