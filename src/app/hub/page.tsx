"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, FileText, Send } from 'lucide-react';

export default function CommunityHubPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'discussions' | 'resources'>('discussions');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [token, setToken] = useState('');

  const fetchPosts = () => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPosts(data.posts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = localStorage.getItem('claim_token') || localStorage.getItem('launchpad_session');
    if (t) setToken(t);
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!token) {
      alert("You must be logged in to post.");
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        fetchPosts(); // Refresh
      } else {
        alert("Error posting: " + data.message);
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>
            <p className="text-neutral-400 mt-2">Discussions, resources, and collaborations.</p>
          </div>
          <button onClick={() => router.push('/claim')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">Back to Dashboard</button>
        </div>

        <div className="flex gap-4 border-b border-neutral-800 pb-2">
          <button 
            onClick={() => setTab('discussions')}
            className={`font-semibold pb-2 border-b-2 transition ${tab === 'discussions' ? 'border-blue-500 text-blue-500' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            Discussions
          </button>
          <button 
            onClick={() => setTab('resources')}
            className={`font-semibold pb-2 border-b-2 transition ${tab === 'resources' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            Resources
          </button>
        </div>

        {tab === 'discussions' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {loading ? <p>Loading discussions...</p> : (
                posts.length === 0 ? <p className="text-neutral-500">No discussions yet. Be the first!</p> :
                posts.map(post => (
                  <Card key={post.id} className="bg-neutral-900 border-neutral-800">
                    <div className="p-6 pb-2 ">
                      <h3 className="font-semibold tracking-tight ">{post.title}</h3>
                      <p className="text-xs text-neutral-500">Posted by {post.author_name} • {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="p-6 pt-0">
                      <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">
                        {post.content}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button  size="sm" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 h-8 text-neutral-400 hover:text-white">
                          <MessageSquare className="w-4 h-4 mr-2" /> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="md:col-span-1">
              <div className="rounded-xl border ">
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold tracking-tight">Start a Discussion</h3>
                </div>
                <div className="p-6 pt-0 ">
                  <input
                    type="text"
                    placeholder="Discussion Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={5}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    onClick={handlePost}
                    disabled={posting}
                  >
                    <Send className="w-4 h-4" /> {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border ">
              <div className="p-6 pt-0 ">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Community Brand Guidelines</h3>
                  <p className="text-sm text-neutral-500">Official logos, colors, and usage instructions.</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border ">
              <div className="p-6 pt-0 ">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Event Speaker Toolkit</h3>
                  <p className="text-sm text-neutral-500">Slide templates and speaking tips.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
