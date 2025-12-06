# Supabase Authentication Setup Guide

## Vehicle Rental Management System

This guide covers setting up Supabase authentication for Admin, Delivery Agent, and Helpline Agent users.

---

## Step 1: Supabase Dashboard Configuration

### 1.1 Enable Email/Password Authentication

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Ensure **Email** provider is enabled
5. Configure settings:
   - ✅ Enable Email Signup
   - ✅ Confirm Email: **Disabled** (for simplicity) or **Enabled** (for production)
   - ✅ Secure Email Change: Enabled
   - ✅ Secure Password Change: Enabled

### 1.2 Disable Other Auth Providers

For this system, we only need email/password:
- ❌ Disable Google, GitHub, Facebook, etc.
- ❌ Disable Phone authentication
- ❌ Disable Magic Link (optional, can keep for password recovery)

### 1.3 Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation Email
   - Password Reset Email
   - Email Change Email

---

## Step 2: Database Configuration

### 2.1 Link auth.users to public.users

Run this SQL in Supabase SQL Editor to sync Supabase auth users with your users table:

```sql
-- =============================================================================
-- Supabase Auth Integration
-- =============================================================================

-- Modify users table to link with Supabase auth
-- The id column will match auth.users.id

-- Drop the password_hash column since Supabase handles passwords
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Add auth_id column to link with Supabase auth.users
-- (We'll use the same UUID, so id = auth.users.id)

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'Unknown'),
        NEW.email,
        (NEW.raw_user_meta_data ->> 'role')::user_role,
        NEW.raw_user_meta_data ->> 'phone'
    );
    RETURN NEW;
END;
$$;

-- Trigger to auto-create user profile on Supabase auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user deletion (optional)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

-- Trigger to delete user profile when auth user is deleted
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();
```

### 2.2 Update RLS Policies for Supabase Auth

Replace the existing RLS policies with these that use Supabase's `auth.uid()`:

```sql
-- =============================================================================
-- Updated Row Level Security for Supabase Auth
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS admin_full_access_users ON users;
DROP POLICY IF EXISTS admin_full_access_vehicles ON vehicles;
DROP POLICY IF EXISTS admin_full_access_bookings ON bookings;
DROP POLICY IF EXISTS admin_full_access_transactions ON transactions;
DROP POLICY IF EXISTS admin_full_access_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS admin_full_access_complaints ON complaints;
DROP POLICY IF EXISTS delivery_agent_view_assigned_bookings ON bookings;
DROP POLICY IF EXISTS delivery_agent_manage_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS helpline_agent_manage_complaints ON complaints;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Admin Policies: Full access to all tables
-- -----------------------------------------------------------------------------

CREATE POLICY admin_full_access_users ON users
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_full_access_vehicles ON vehicles
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_full_access_bookings ON bookings
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_full_access_transactions ON transactions
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_full_access_delivery_logs ON delivery_logs
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY admin_full_access_complaints ON complaints
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- -----------------------------------------------------------------------------
-- Delivery Agent Policies
-- -----------------------------------------------------------------------------

CREATE POLICY delivery_agent_view_assigned_bookings ON bookings
    FOR SELECT TO authenticated
    USING (
        assigned_delivery_agent_id = auth.uid()
        AND public.get_user_role() = 'delivery'
    );

CREATE POLICY delivery_agent_manage_delivery_logs ON delivery_logs
    FOR ALL TO authenticated
    USING (
        delivery_agent_id = auth.uid()
        AND public.get_user_role() = 'delivery'
    )
    WITH CHECK (
        delivery_agent_id = auth.uid()
        AND public.get_user_role() = 'delivery'
    );

-- -----------------------------------------------------------------------------
-- Helpline Agent Policies
-- -----------------------------------------------------------------------------

CREATE POLICY helpline_agent_view_complaints ON complaints
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'helpline');

CREATE POLICY helpline_agent_manage_assigned_complaints ON complaints
    FOR UPDATE TO authenticated
    USING (
        helpline_agent_id = auth.uid()
        AND public.get_user_role() = 'helpline'
    )
    WITH CHECK (
        helpline_agent_id = auth.uid()
        AND public.get_user_role() = 'helpline'
    );

-- -----------------------------------------------------------------------------
-- Users can view their own profile
-- -----------------------------------------------------------------------------

CREATE POLICY users_view_own_profile ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- Public Policies (for customers without login)
-- -----------------------------------------------------------------------------

-- Keep existing public policies for vehicles and bookings
```

---

## Step 3: Environment Variables

### 3.1 Get Your Supabase Credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3.2 Create `.env` File

Create `.env` or `.env.local` in your project root:

```env
# =============================================================================
# Supabase Configuration
# =============================================================================

# Your Supabase project URL
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Public anon key (safe to expose in browser)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (SERVER-ONLY - never expose to frontend!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Security Notes

⚠️ **CRITICAL SECURITY RULES:**

| Variable | Prefix | Exposure |
|----------|--------|----------|
| `PUBLIC_SUPABASE_URL` | `PUBLIC_` | ✅ Safe for frontend |
| `PUBLIC_SUPABASE_ANON_KEY` | `PUBLIC_` | ✅ Safe for frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | None | ❌ Server-only! Never expose! |

The `PUBLIC_` prefix in SvelteKit makes variables available to the browser.
Variables without this prefix are server-only.

---

## Step 4: Session & Token Management

### 4.1 How Supabase Handles Sessions

- **Access Token**: Short-lived JWT (~1 hour)
- **Refresh Token**: Long-lived token to get new access tokens
- **Storage**: Supabase stores tokens in `localStorage` by default

### 4.2 Auto Token Refresh

The Supabase client automatically:
1. Detects when access token is about to expire
2. Uses refresh token to get a new access token
3. Updates the session seamlessly

### 4.3 Session Persistence

Sessions persist across page reloads because tokens are stored in localStorage.

To handle session in SSR (SvelteKit):
- Use `hooks.server.ts` to validate sessions on the server
- Pass session data to page load functions

---

## Step 5: Testing Instructions

### 5.1 Test Sign Up

1. Navigate to `/signup`
2. Fill in:
   - Name: Test Admin
   - Email: admin@test.com
   - Password: TestPassword123!
   - Phone: 1234567890
   - Role: Admin
3. Click "Create Account"
4. Should redirect to `/admin/dashboard`

### 5.2 Test Sign In

1. Navigate to `/sign-in`
2. Enter credentials created above
3. Should redirect based on role:
   - Admin → `/admin/dashboard`
   - Delivery → `/agent/dashboard`
   - Helpline → `/help/dashboard`

### 5.3 Test Protected Routes

1. Sign out
2. Try accessing `/admin/dashboard` directly
3. Should redirect to `/sign-in`

### 5.4 Verify Database Sync

1. After sign up, check Supabase:
   - **Authentication** → **Users**: Should see new auth user
   - **Table Editor** → **users**: Should see matching profile

---

## Step 6: Production Checklist

- [ ] Enable email confirmation in Supabase Auth settings
- [ ] Configure custom SMTP for emails
- [ ] Set up proper CORS origins
- [ ] Enable Rate Limiting in Supabase
- [ ] Review and test all RLS policies
- [ ] Set up proper error monitoring
- [ ] Configure password requirements
- [ ] Enable MFA (optional but recommended for admin)
