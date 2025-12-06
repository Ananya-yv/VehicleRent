-- =============================================================================
-- Supabase Auth Integration Migration
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Modify users table for Supabase Auth
-- -----------------------------------------------------------------------------

-- Remove password_hash since Supabase Auth handles passwords
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- -----------------------------------------------------------------------------
-- Step 2: Create trigger to auto-create user profile on signup
-- -----------------------------------------------------------------------------

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
        (NEW.raw_user_meta_data ->> 'role')::public.user_role,
        NEW.raw_user_meta_data ->> 'phone'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Step 3: Create trigger to delete user profile when auth user is deleted
-- -----------------------------------------------------------------------------

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

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();

-- -----------------------------------------------------------------------------
-- Step 4: Helper function to get current user's role
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Step 5: Drop existing RLS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS admin_full_access_users ON users;
DROP POLICY IF EXISTS admin_full_access_vehicles ON vehicles;
DROP POLICY IF EXISTS admin_full_access_bookings ON bookings;
DROP POLICY IF EXISTS admin_full_access_transactions ON transactions;
DROP POLICY IF EXISTS admin_full_access_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS admin_full_access_complaints ON complaints;
DROP POLICY IF EXISTS delivery_agent_view_assigned_bookings ON bookings;
DROP POLICY IF EXISTS delivery_agent_manage_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS helpline_agent_manage_complaints ON complaints;

-- -----------------------------------------------------------------------------
-- Step 6: Create new RLS policies using auth.uid()
-- -----------------------------------------------------------------------------

-- Admin: Full access to all tables
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

-- Users can view their own profile
CREATE POLICY users_view_own_profile ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Delivery Agent: View assigned bookings
CREATE POLICY delivery_agent_view_assigned_bookings ON bookings
    FOR SELECT TO authenticated
    USING (
        assigned_delivery_agent_id = auth.uid()
        AND public.get_user_role() = 'delivery'
    );

-- Delivery Agent: Manage their own delivery logs
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

-- Helpline Agent: View all complaints
CREATE POLICY helpline_agent_view_complaints ON complaints
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'helpline');

-- Helpline Agent: Manage assigned complaints
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

-- Helpline Agent: Can assign themselves to unassigned complaints
CREATE POLICY helpline_agent_claim_complaints ON complaints
    FOR UPDATE TO authenticated
    USING (
        helpline_agent_id IS NULL
        AND public.get_user_role() = 'helpline'
    )
    WITH CHECK (
        helpline_agent_id = auth.uid()
        AND public.get_user_role() = 'helpline'
    );

-- -----------------------------------------------------------------------------
-- Verification: List all policies
-- -----------------------------------------------------------------------------

-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';
