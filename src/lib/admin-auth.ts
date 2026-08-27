import crypto from 'crypto';

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-admin-secret-key-1234567890';

export function signAdminToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 hours
    role: 'admin'
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  return `${header}.${payload}.${signature}`;
}

export function verifyAdminToken(token: string): { email: string } | null {
  if (!token) return null;
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) return null;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    // Verify payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    
    // Verify role and check admin list
    if (payload.role !== 'admin') return null;
    
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase());
      
    if (!adminEmails.includes(payload.email.toLowerCase())) {
      return null; // Not an admin
    }
    
    return { email: payload.email };
  } catch (e) {
    return null;
  }
}

export function getAdminEmailFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyAdminToken(token);
    return decoded ? decoded.email : null;
  }
  return null;
}
