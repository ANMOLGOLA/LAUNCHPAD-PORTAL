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
            Achievement Feed
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
              {loading ? <p>Loading feed...</p> : (
                posts.length === 0 ? <p className="text-neutral-500">No achievements posted yet. Be the first to share your win!</p> :
                posts.map(post => (
                  <div key={post.id} className="rounded-xl border bg-neutral-900 border-neutral-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Send className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="p-6 pb-2 relative z-10">
                      <h3 className="font-bold text-lg tracking-tight text-blue-400">{post.title}</h3>
                      <p className="text-xs text-neutral-500">Shared by <span className="text-neutral-300 font-medium">{post.author_name}</span> • {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="p-6 pt-0 relative z-10">
                      <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-8 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800">
                          <MessageSquare className="w-4 h-4 mr-2" /> Congratulate
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="md:col-span-1">
              <div className="rounded-xl border bg-neutral-900 border-neutral-800 shadow-xl">
                <div className="p-6 pb-2 border-b border-neutral-800/50 mb-4 bg-blue-900/10">
                  <h3 className="text-lg font-semibold tracking-tight text-blue-400 flex items-center gap-2">
                    Share a Win 🚀
                  </h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <input
                    type="text"
                    placeholder="E.g., Earned my Cloud Certificate!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-3 text-sm focus:outline-none focus:border-blue-500 placeholder:text-neutral-600 font-medium"
                  />
                  <textarea
                    placeholder="Tell the community about your achievement, what you learned, or what's next..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={5}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-3 text-sm focus:outline-none focus:border-blue-500 placeholder:text-neutral-600"
                  />
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-11 px-4 py-2 w-full bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/50 flex items-center justify-center gap-2"
                    onClick={handlePost}
                    disabled={posting}
                  >
                    <Send className="w-4 h-4" /> {posting ? 'Posting...' : 'Share to Feed'}
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
