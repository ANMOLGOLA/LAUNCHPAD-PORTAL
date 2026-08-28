"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, UserPlus, Shield } from 'lucide-react';

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Form State
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  const fetchTeams = () => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeams(data.teams);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = localStorage.getItem('launchpad_session') || localStorage.getItem('claim_token');
    if (t) {
      setToken(t);
      // Decode token roughly (we know our mock token structure holds email in plaintext or we can just fetch profile)
      fetch('/api/profile', { headers: { 'Authorization': `Bearer ${t}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCurrentUserEmail(data.profile.email);
          }
        });
    }
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Please login first');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: teamName, description: teamDesc })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setTeamName('');
        setTeamDesc('');
        fetchTeams();
      } else {
        alert(data.message || 'Failed to create team');
      }
    } catch (err) {
      alert('Network Error');
    }
  };

  const handleJoinTeam = async (id: string) => {
    if (!token) return alert('Please login first');
    try {
      const res = await fetch(`/api/teams/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchTeams();
      } else {
        alert(data.message || 'Failed to join');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Teams</h1>
            <p className="text-neutral-400 mt-2">Form groups and collaborate on upcoming events.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowCreate(true)} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Team
            </button>
            <button 
              onClick={() => router.push('/claim')} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none border border-neutral-700 bg-transparent text-white hover:bg-neutral-800 h-10 px-4 py-2"
            >
              Dashboard
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="rounded-xl border bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-xl font-bold mb-4">Create a New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4 max-w-md">
              <div>
                <label className="text-sm text-neutral-400 mb-1 block">Team Name</label>
                <input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-sm text-neutral-400 mb-1 block">Description</label>
                <input type="text" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-neutral-800 text-white px-4 py-2 rounded-md hover:bg-neutral-700">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-900 rounded-xl border border-neutral-800">
              No teams formed yet. Be the first to create one!
            </div>
          ) : (
            teams.map(team => {
              const isMember = currentUserEmail && team.member_emails.includes(currentUserEmail);
              const isLeader = currentUserEmail && team.leader_email === currentUserEmail;

              return (
                <div key={team.id} className="rounded-xl border bg-neutral-900 border-neutral-800 p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Users className="w-24 h-24" />
                  </div>
                  <h3 className="font-bold text-xl text-blue-400 mb-2 relative z-10">{team.name}</h3>
                  <p className="text-sm text-neutral-400 mb-6 flex-grow relative z-10">{team.description || "No description provided."}</p>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="text-sm">
                      <p className="text-neutral-500 mb-1 flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-500"/> Leader</p>
                      <p className="font-medium text-neutral-300 truncate">{team.leader_email}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Users className="w-4 h-4" />
                        <span>{team.member_emails.length} Members</span>
                      </div>
                      
                      {!isMember && (
                        <button 
                          onClick={() => handleJoinTeam(team.id)}
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 transition-colors"
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Join
                        </button>
                      )}
                      {isMember && (
                        <span className="text-xs font-medium bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-md border border-emerald-500/20">
                          {isLeader ? 'Leader' : 'Member'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
