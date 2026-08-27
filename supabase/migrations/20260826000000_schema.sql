-- Supabase Schema Migration — Team Launchpad Portal

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- ── 1. Events Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    task_url TEXT NOT NULL,
    task_instructions TEXT,
    verification_mode VARCHAR(50) DEFAULT 'click_detection' CHECK (verification_mode IN ('click_detection', 'return_confirmation', 'dwell_time')),
    template_path TEXT, -- Storage bucket path
    template_fields JSONB DEFAULT '{}'::jsonb, -- Coordinate config (x, y, size, font)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching active events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ── 2. Participants (Allowlist) Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    email citext NOT NULL,
    name VARCHAR(255), -- Optional recipient name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_participants_lookup ON participants(event_id, email);

-- ── 3. Claims (User Claims & Tokens) Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    email citext NOT NULL,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    session_token VARCHAR(255) UNIQUE,
    task_started_at TIMESTAMP WITH TIME ZONE,
    task_completed_at TIMESTAMP WITH TIME ZONE,
    task_click_meta JSONB DEFAULT '{}'::jsonb,
    certificate_id VARCHAR(50) UNIQUE, -- Public unique verification ID
    certificate_pdf_path TEXT,
    certificate_png_path TEXT,
    certificate_generated_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'unlocked', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_claims_auth ON claims(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_claims_certificate ON claims(certificate_id);

-- ── 4. Audit Logs Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255),
    meta JSONB DEFAULT '{}'::jsonb,
    ip VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ── Enable Row Level Security (RLS) on all tables ──────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────────

-- 1. Events policies
CREATE POLICY "Public read active events" ON events 
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins full access on events" ON events 
    FOR ALL TO authenticated USING (
        (auth.jwt() ->> 'email') IN (
            SELECT email::text FROM (
                SELECT unnest(string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')) AS email
            ) AS admin_list
        )
    );

-- 2. Participants policies
CREATE POLICY "Admins full access on participants" ON participants 
    FOR ALL TO authenticated USING (
        (auth.jwt() ->> 'email') IN (
            SELECT email::text FROM (
                SELECT unnest(string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')) AS email
            ) AS admin_list
        )
    );

-- 3. Claims policies
CREATE POLICY "Public read claims by verification code or session" ON claims
    FOR SELECT USING (
        -- User can only read their own claim linked by their active session token
        session_token = coalesce(current_setting('app.current_session_token', true), '')
    );

CREATE POLICY "Public update claims with token" ON claims
    FOR UPDATE USING (
        session_token = coalesce(current_setting('app.current_session_token', true), '')
    );

CREATE POLICY "Admins full access on claims" ON claims
    FOR ALL TO authenticated USING (
        (auth.jwt() ->> 'email') IN (
            SELECT email::text FROM (
                SELECT unnest(string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')) AS email
            ) AS admin_list
        )
    );

-- 4. Audit Logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT TO authenticated USING (
        (auth.jwt() ->> 'email') IN (
            SELECT email::text FROM (
                SELECT unnest(string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',')) AS email
            ) AS admin_list
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);
