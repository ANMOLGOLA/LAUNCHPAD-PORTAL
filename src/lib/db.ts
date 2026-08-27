import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Define DB Types
export interface UserProfile {
  id: string; // auth id or random UUID
  email: string;
  name: string;
  username?: string;
  bio?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  avatar_url?: string;
  social_links?: { linkedin?: string; github?: string; twitter?: string };
  created_at?: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  tags?: string[];
  created_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'normal';
  event_date?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  event_date: string;
  status: 'draft' | 'active' | 'closed';
  task_url: string;
  task_instructions?: string;
  verification_mode: 'click_detection' | 'stronger_confirmation' | 'dwell_time';
  template_path?: string;
  template_fields?: any;
  created_at?: string;
}

export interface Participant {
  id: string;
  event_id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface Claim {
  id: string;
  event_id: string;
  participant_id: string;
  email: string;
  otp_code?: string;
  otp_expires_at?: string;
  email_verified_at?: string;
  session_token?: string;
  task_started_at?: string;
  task_completed_at?: string;
  task_click_meta?: any;
  certificate_id?: string;
  certificate_pdf_path?: string;
  certificate_png_path?: string;
  certificate_generated_at?: string;
  status: 'pending' | 'verified' | 'unlocked' | 'revoked';
  created_at?: string;
}

export interface AuditLog {
  id: string;
  actor?: string;
  action: string;
  target?: string;
  meta?: any;
  ip?: string;
  user_agent?: string;
  created_at?: string;
}

const MOCK_DB_PATH = path.join(process.cwd(), 'src/lib/mock-db-store.json');

function readMockDB() {
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading mock DB:', e);
    return { events: [], participants: [], claims: [], audit_logs: [] };
  }
}

function writeMockDB(data: any) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing mock DB:', e);
  }
}

// Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || !supabase;

export const db = {
  isMockMode: () => isMock,

  // ── Events ──
  async getActiveEvent(): Promise<Event | null> {
    if (isMock) {
      const store = readMockDB();
      return store.events.find((e: any) => e.status === 'active') || null;
    }
    const { data } = await supabase!
      .from('events')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();
    return data;
  },

  async getEventBySlug(slug: string): Promise<Event | null> {
    if (isMock) {
      const store = readMockDB();
      return store.events.find((e: any) => e.slug === slug) || null;
    }
    const { data } = await supabase!
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    return data;
  },

  async getEventById(id: string): Promise<Event | null> {
    if (isMock) {
      const store = readMockDB();
      return store.events.find((e: any) => e.id === id) || null;
    }
    const { data } = await supabase!
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  },

  async getAllEvents(): Promise<Event[]> {
    if (isMock) {
      const store = readMockDB();
      return store.events;
    }
    const { data } = await supabase!.from('events').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const newEvent = { ...eventData, id: crypto.randomUUID() };
    if (isMock) {
      const store = readMockDB();
      store.events.push(newEvent);
      writeMockDB(store);
      return newEvent;
    }
    const { data } = await supabase!.from('events').insert(eventData).select().single();
    return data;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    if (isMock) {
      const store = readMockDB();
      const idx = store.events.findIndex((e: any) => e.id === id);
      if (idx === -1) return null;
      store.events[idx] = { ...store.events[idx], ...updates };
      writeMockDB(store);
      return store.events[idx];
    }
    const { data } = await supabase!.from('events').update(updates).eq('id', id).select().single();
    return data;
  },

  // ── Allowlist Participants ──
  async getParticipant(eventId: string, email: string): Promise<Participant | null> {
    const normEmail = email.toLowerCase().trim();
    if (isMock) {
      const store = readMockDB();
      return store.participants.find(
        (p: any) => p.event_id === eventId && p.email.toLowerCase() === normEmail
      ) || null;
    }
    const { data } = await supabase!
      .from('participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', normEmail)
      .maybeSingle();
    return data;
  },

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    if (isMock) {
      const store = readMockDB();
      return store.participants.filter((p: any) => p.event_id === eventId);
    }
    const { data } = await supabase!.from('participants').select('*').eq('event_id', eventId);
    return data || [];
  },

  async addParticipant(eventId: string, email: string, name?: string): Promise<Participant> {
    const normEmail = email.toLowerCase().trim();
    const newParticipant = { id: crypto.randomUUID(), event_id: eventId, email: normEmail, name };
    if (isMock) {
      const store = readMockDB();
      // Avoid duplicate
      const exists = store.participants.find(
        (p: any) => p.event_id === eventId && p.email.toLowerCase() === normEmail
      );
      if (exists) return exists;
      store.participants.push(newParticipant);
      writeMockDB(store);
      return newParticipant;
    }
    const { data } = await supabase!.from('participants').insert({ event_id: eventId, email: normEmail, name }).select().single();
    return data;
  },

  async removeParticipant(id: string): Promise<void> {
    if (isMock) {
      const store = readMockDB();
      store.participants = store.participants.filter((p: any) => p.id !== id);
      writeMockDB(store);
      return;
    }
    await supabase!.from('participants').delete().eq('id', id);
  },

  // ── Claims ──
  async getClaimBySession(token: string): Promise<Claim | null> {
    if (isMock) {
      const store = readMockDB();
      return store.claims.find((c: any) => c.session_token === token) || null;
    }
    const { data } = await supabase!
      .from('claims')
      .select('*')
      .eq('session_token', token)
      .maybeSingle();
    return data;
  },

  async getClaimByEmail(eventId: string, email: string): Promise<Claim | null> {
    const normEmail = email.toLowerCase().trim();
    if (isMock) {
      const store = readMockDB();
      return store.claims.find((c: any) => c.event_id === eventId && c.email.toLowerCase() === normEmail) || null;
    }
    const { data } = await supabase!
      .from('claims')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', normEmail)
      .maybeSingle();
    return data;
  },

  async getClaimByCertificateId(certId: string): Promise<Claim | null> {
    if (isMock) {
      const store = readMockDB();
      return store.claims.find((c: any) => c.certificate_id === certId) || null;
    }
    const { data } = await supabase!
      .from('claims')
      .select('*')
      .eq('certificate_id', certId)
      .maybeSingle();
    return data;
  },

  async getClaimsByEvent(eventId: string): Promise<Claim[]> {
    if (isMock) {
      const store = readMockDB();
      return store.claims.filter((c: any) => c.event_id === eventId);
    }
    const { data } = await supabase!.from('claims').select('*').eq('event_id', eventId);
    return data || [];
  },

  async createOrUpdateClaim(eventId: string, email: string, participantId: string, updates: Partial<Claim>): Promise<Claim> {
    const normEmail = email.toLowerCase().trim();
    if (isMock) {
      const store = readMockDB();
      let claimIdx = store.claims.findIndex(
        (c: any) => c.event_id === eventId && c.email.toLowerCase() === normEmail
      );
      if (claimIdx === -1) {
        const newClaim: Claim = {
          id: crypto.randomUUID(),
          event_id: eventId,
          participant_id: participantId,
          email: normEmail,
          status: 'pending',
          ...updates
        } as Claim;
        store.claims.push(newClaim);
        writeMockDB(store);
        return newClaim;
      } else {
        store.claims[claimIdx] = { ...store.claims[claimIdx], ...updates };
        writeMockDB(store);
        return store.claims[claimIdx];
      }
    }
    
    // Check if exists
    const existing = await this.getClaimByEmail(eventId, normEmail);
    if (!existing) {
      const { data } = await supabase!
        .from('claims')
        .insert({ event_id: eventId, email: normEmail, participant_id: participantId, status: 'pending', ...updates })
        .select()
        .single();
      return data;
    } else {
      const { data } = await supabase!
        .from('claims')
        .update(updates)
        .eq('event_id', eventId)
        .eq('email', normEmail)
        .select()
        .single();
      return data;
    }
  },

  async updateClaimById(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    if (isMock) {
      const store = readMockDB();
      const idx = store.claims.findIndex((c: any) => c.id === id);
      if (idx === -1) return null;
      store.claims[idx] = { ...store.claims[idx], ...updates };
      writeMockDB(store);
      return store.claims[idx];
    }
    const { data } = await supabase!.from('claims').update(updates).eq('id', id).select().single();
    return data;
  },

  // 🌟 Users 🌟
  async getUserProfile(email: string): Promise<UserProfile | null> {
    const normEmail = email.toLowerCase().trim();
    if (isMock) {
      const store = readMockDB();
      return store.users?.find((u: any) => u.email === normEmail) || null;
    }
    return null; // Supposed to be Supabase/Firestore
  },
  async createOrUpdateUserProfile(email: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const normEmail = email.toLowerCase().trim();
    if (isMock) {
      const store = readMockDB();
      if (!store.users) store.users = [];
      let idx = store.users.findIndex((u: any) => u.email === normEmail);
      if (idx === -1) {
        const newUser: UserProfile = { id: crypto.randomUUID(), email: normEmail, name: normEmail.split('@')[0], created_at: new Date().toISOString(), ...updates };
        store.users.push(newUser);
        writeMockDB(store);
        return newUser;
      } else {
        store.users[idx] = { ...store.users[idx], ...updates };
        writeMockDB(store);
        return store.users[idx];
      }
    }
    return {} as UserProfile;
  },
  async getAllUsers(): Promise<UserProfile[]> {
    if (isMock) {
      const store = readMockDB();
      return store.users || [];
    }
    return [];
  },
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    if (isMock) {
      const store = readMockDB();
      return store.users?.find((u: any) => u.username === username) || null;
    }
    return null;
  },

  // 🌟 Posts & Discussions 🌟
  async getAllPosts(): Promise<Post[]> {
    if (isMock) {
      const store = readMockDB();
      return (store.posts || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [];
  },
  async getPostById(id: string): Promise<Post | null> {
    if (isMock) {
      const store = readMockDB();
      return store.posts?.find((p: any) => p.id === id) || null;
    }
    return null;
  },
  async createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
    const newPost = { ...post, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isMock) {
      const store = readMockDB();
      if (!store.posts) store.posts = [];
      store.posts.push(newPost);
      writeMockDB(store);
      return newPost;
    }
    return newPost;
  },

  // 🌟 Announcements 🌟
  async getAnnouncements(): Promise<Announcement[]> {
    if (isMock) {
      const store = readMockDB();
      return (store.announcements || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [];
  },
  async createAnnouncement(ann: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    const newAnn = { ...ann, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isMock) {
      const store = readMockDB();
      if (!store.announcements) store.announcements = [];
      store.announcements.push(newAnn);
      writeMockDB(store);
      return newAnn;
    }
    return newAnn;
  },

  // 🚀 Audit Logs 🚀
  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog = { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isMock) {
      const store = readMockDB();
      store.audit_logs.push(newLog);
      writeMockDB(store);
      return newLog;
    }
    const { data } = await supabase!.from('audit_logs').insert(log).select().single();
    return data || newLog;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isMock) {
      const store = readMockDB();
      return store.audit_logs;
    }
    const { data } = await supabase!.from('audit_logs').select('*').order('created_at', { ascending: false });
    return data || [];
  }
};
