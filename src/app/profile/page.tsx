"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('launchpad_session');
    if (!token) {
      router.push('/');
      return;
    }

    fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setProfile(data.profile);
        setName(data.profile.name || '');
        setUsername(data.profile.username || '');
        setBio(data.profile.bio || '');
        setSkills(data.profile.skills ? data.profile.skills.join(', ') : '');
        setLinkedin(data.profile.social_links?.linkedin || '');
        setGithub(data.profile.social_links?.github || '');
      } else {
        router.push('/');
      }
    })
    .catch(err => {
      console.error(err);
      router.push('/');
    })
    .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('launchpad_session');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          bio,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          social_links: { linkedin, github }
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        alert('Profile saved successfully!');
      } else {
        alert('Failed to save profile: ' + data.message);
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <button onClick={() => router.push('/claim')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2">Back to Dashboard</button>
        </div>

        <div className="rounded-xl border ">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold tracking-tight">Public Profile Information</h3>
          </div>
          <div className="p-6 pt-0 ">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                <input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50" disabled value={profile?.email || ''} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Unique Username</label>
                <div className="flex items-center">
                  <span className="bg-neutral-800 text-neutral-400 border border-neutral-800 border-r-0 rounded-l-md px-3 h-10 flex items-center text-sm">@</span>
                  <input className="flex h-10 w-full rounded-r-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="yourusername"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Display Name</label>
                <input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="How should others see you?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bio</label>
                <textarea className="flex w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[100px]" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Tell the community about yourself..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Skills (Comma separated)</label>
                <input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)} 
                  placeholder="e.g. React, Marketing, Public Speaking"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-lg font-medium">Social Links</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">LinkedIn URL</label>
                  <input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                    value={linkedin} 
                    onChange={(e) => setLinkedin(e.target.value)} 
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">GitHub URL</label>
                  <input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                    value={github} 
                    onChange={(e) => setGithub(e.target.value)} 
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <button 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
