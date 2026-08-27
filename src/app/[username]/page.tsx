"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, UserCircle2 } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const usernameParam = decodeURIComponent(params.username);
  const username = usernameParam.startsWith('%40') || usernameParam.startsWith('@') 
    ? usernameParam.replace(/^%?4?0?@/, '') 
    : usernameParam;

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setError('User not found');
        }
      })
      .catch(() => setError('Error loading profile'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-rose-500">{error}</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/directory')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">
            Back to Directory
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-emerald-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 rounded-full bg-neutral-900 border-4 border-neutral-900 flex items-center justify-center text-neutral-400">
                <UserCircle2 className="w-16 h-16" />
              </div>
              <div className="flex gap-2">
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className="bg-blue-900/30 text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-900/50 text-sm font-semibold">
                    LinkedIn <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {profile.social_links?.github && (
                  <a href={profile.social_links.github} target="_blank" rel="noreferrer" className="bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-700 text-sm font-semibold">
                    GitHub <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
              <p className="text-blue-500 font-medium text-lg mt-1">@{profile.username}</p>
            </div>

            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-neutral-400 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
