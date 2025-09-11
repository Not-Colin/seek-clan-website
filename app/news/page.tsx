'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Link from 'next/link';

interface Post { id: number; title: string; slug: string; excerpt: string; category: string; published_at: string; }

const formatPostDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const PostTile = ({ post }: { post: Post }) => (
  <Link href={`/news/${post.slug}`} className="block group h-full">
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-full flex flex-col transition-all duration-300 group-hover:bg-slate-800 group-hover:border-orange-500/50">
      <h4 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors duration-200">{post.title}</h4>
      <p className="text-sm text-gray-400 mt-1">{formatPostDate(post.published_at)}</p>
      <p className="mt-3 text-gray-300 flex-grow line-clamp-4">{post.excerpt}</p>
      <div className="text-orange-400 font-semibold text-sm mt-4 self-end">
        Read More &rarr;
      </div>
    </div>
  </Link>
);

export default function NewsArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('status', ['published', 'featured']) // CORRECTED: Checks for both public statuses
        .eq('category', 'News')
        .order('published_at', { ascending: false });

      if (error) throw new Error('Failed to fetch news posts.');
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white">News Archive</h1>
            <p className="text-gray-400 text-lg mt-2">All the latest updates and announcements.</p>
          </div>

          {loading && <p className="text-center text-gray-400">Loading news...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}

          {!loading && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostTile key={post.id} post={post} />
              ))}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
              <p className="text-center text-gray-500">No news posts found.</p>
          )}
        </div>
      </main>
    </div>
  );
}