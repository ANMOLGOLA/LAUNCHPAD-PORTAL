const fs = require('fs');
const dbPath = 'src/lib/db.ts';
let code = fs.readFileSync(dbPath, 'utf8');

const newTypes = 
export interface UserProfile {
  id: string; // auth id or random UUID
  email: string;
  name: string;
  bio?: string;
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
;

code = code.replace('export interface Event', newTypes + '\nexport interface Event');

const newMethods = 
  // ?? Users ??
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

  // ?? Posts & Discussions ??
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

  // ?? Announcements ??
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
;

code = code.replace('  // ?? Audit Logs ??', newMethods + '\n  // ?? Audit Logs ??');
fs.writeFileSync(dbPath, code);
console.log('Updated db.ts with new methods');
