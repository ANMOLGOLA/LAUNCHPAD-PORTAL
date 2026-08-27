"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, UserCircle2 } from 'lucide-react';

export default function DirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Member Directory</h1>
            <p className="text-neutral-400 mt-2">Connect with other members and peers in the ecosystem.</p>
          </div>
          <button onClick={() => router.push('/claim')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">Back to Dashboard</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500">
              No members found in the directory.
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="rounded-xl border bg-neutral-900 border-neutral-800 flex flex-col h-full shadow-sm">
                <div className="p-6 pb-2 ">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <UserCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight ">
                        {user.username ? (
                          <button onClick={() => router.push(`/@${user.username}`)} className="hover:underline hover:text-blue-400">
                            {user.name}
                          </button>
                        ) : (
                          user.name
                        )}
                      </h3>
                      {user.username ? (
                        <p className="text-xs text-blue-500 truncate w-40">@{user.username}</p>
                      ) : (
                        <p className="text-xs text-neutral-500 truncate w-40">{user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 ">
                  <p className="text-sm text-neutral-400 line-clamp-3 mb-4 flex-1 mt-2">
                    {user.bio || "This member hasn't added a bio yet."}
                  </p>

                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {user.skills.slice(0, 3).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="text-[10px] text-neutral-500 px-1 py-1">+{user.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    {user.social_links?.linkedin && (
                      <a href={user.social_links.linkedin} target="_blank" rel="noreferrer" className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-900/50">
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {user.social_links?.github && (
                      <a href={user.social_links.github} target="_blank" rel="noreferrer" className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-neutral-700">
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
