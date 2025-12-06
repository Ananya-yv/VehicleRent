-- =============================================================================
-- Supabase Auth Fix - Run this AFTER the main migration if login isn't working
-- =============================================================================

-- Drop the problematic policy that might conflict
DROP POLICY IF EXISTS users_view_own_profile ON users;

-- Recreate with a simpler approach - allow all authenticated users to view their own row
CREATE POLICY users_view_own_profile ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Also ensure delivery and helpline users can view their own profile
-- by adding explicit policies for each role
DROP POLICY IF EXISTS delivery_agent_view_own_profile ON users;
CREATE POLICY delivery_agent_view_own_profile ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS helpline_agent_view_own_profile ON users;
CREATE POLICY helpline_agent_view_own_profile ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Fix the get_user_role function to handle edge cases
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- Verify the trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'Warning: on_auth_user_created trigger does not exist. Please run the main migration first.';
    END IF;
END
$$;
