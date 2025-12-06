-- =============================================================================
-- Vehicle Rental Management System - PostgreSQL Schema
-- =============================================================================

-- Drop existing objects if they exist (for clean re-runs)
DROP POLICY IF EXISTS admin_full_access_users ON users;
DROP POLICY IF EXISTS admin_full_access_vehicles ON vehicles;
DROP POLICY IF EXISTS admin_full_access_bookings ON bookings;
DROP POLICY IF EXISTS admin_full_access_transactions ON transactions;
DROP POLICY IF EXISTS admin_full_access_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS admin_full_access_complaints ON complaints;
DROP POLICY IF EXISTS delivery_agent_view_assigned_bookings ON bookings;
DROP POLICY IF EXISTS delivery_agent_manage_delivery_logs ON delivery_logs;
DROP POLICY IF EXISTS helpline_agent_manage_complaints ON complaints;
DROP POLICY IF EXISTS public_view_available_vehicles ON vehicles;
DROP POLICY IF EXISTS public_insert_bookings ON bookings;

DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS delivery_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS rent_type CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS delivery_action CASCADE;
DROP TYPE IF EXISTS complaint_priority CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'delivery', 'helpline');

CREATE TYPE rent_type AS ENUM ('daily', 'hourly');

CREATE TYPE availability_status AS ENUM ('available', 'booked', 'maintenance');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'delivered', 'returned', 'cancelled');

CREATE TYPE transaction_type AS ENUM ('advance', 'full', 'refund');

CREATE TYPE payment_status AS ENUM ('success', 'failed', 'refunded');

CREATE TYPE delivery_action AS ENUM ('delivered', 'picked_up');

CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high');

CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved');

-- =============================================================================
-- Tables
-- =============================================================================

-- Users table (Admin / Delivery Agent / Helpline Agent)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    rent_type rent_type NOT NULL,
    rent_price NUMERIC(10, 2) NOT NULL CHECK (rent_price >= 0),
    condition VARCHAR(255),
    availability_status availability_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings table (Customer details collected directly, no login)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    driving_license VARCHAR(100) NOT NULL,
    delivery_location TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    advance_amount NUMERIC(10, 2) NOT NULL CHECK (advance_amount >= 0),
    status booking_status NOT NULL DEFAULT 'pending',
    otp_code VARCHAR(10),
    assigned_delivery_agent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bookings_date_check CHECK (end_date > start_date)
);

-- Transactions table (Payment tracking)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status payment_status NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery Logs table
CREATE TABLE delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    delivery_agent_id UUID NOT NULL,
    action delivery_action NOT NULL,
    action_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Complaints table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    description TEXT NOT NULL,
    priority complaint_priority NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'pending',
    helpline_agent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Foreign Key Constraints
-- =============================================================================

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT;

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_delivery_agent
    FOREIGN KEY (assigned_delivery_agent_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE delivery_logs
    ADD CONSTRAINT fk_delivery_logs_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE delivery_logs
    ADD CONSTRAINT fk_delivery_logs_agent
    FOREIGN KEY (delivery_agent_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_helpline_agent
    FOREIGN KEY (helpline_agent_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================================================
-- Performance Indexes
-- =============================================================================

-- users indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- vehicles indexes
CREATE INDEX idx_vehicles_availability_status ON vehicles(availability_status);
CREATE INDEX idx_vehicles_model_fulltext ON vehicles USING GIN (to_tsvector('english', model));

-- bookings indexes
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_assigned_delivery_agent_id ON bookings(assigned_delivery_agent_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- transactions indexes
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);

-- delivery_logs indexes
CREATE INDEX idx_delivery_logs_booking_id ON delivery_logs(booking_id);
CREATE INDEX idx_delivery_logs_delivery_agent_id ON delivery_logs(delivery_agent_id);

-- complaints indexes
CREATE INDEX idx_complaints_helpline_agent_id ON complaints(helpline_agent_id);
CREATE INDEX idx_complaints_booking_id ON complaints(booking_id);
CREATE INDEX idx_complaints_status ON complaints(status);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Admin: Full access to all tables
-- -----------------------------------------------------------------------------

CREATE POLICY admin_full_access_users ON users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

CREATE POLICY admin_full_access_vehicles ON vehicles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

CREATE POLICY admin_full_access_bookings ON bookings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

CREATE POLICY admin_full_access_transactions ON transactions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

CREATE POLICY admin_full_access_delivery_logs ON delivery_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

CREATE POLICY admin_full_access_complaints ON complaints
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- Delivery Agent: View assigned bookings, manage delivery_logs for assigned
-- -----------------------------------------------------------------------------

CREATE POLICY delivery_agent_view_assigned_bookings ON bookings
    FOR SELECT
    TO authenticated
    USING (
        assigned_delivery_agent_id = current_setting('app.current_user_id', true)::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'delivery'
        )
    );

CREATE POLICY delivery_agent_manage_delivery_logs ON delivery_logs
    FOR ALL
    TO authenticated
    USING (
        delivery_agent_id = current_setting('app.current_user_id', true)::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'delivery'
        )
        AND EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_id 
            AND b.assigned_delivery_agent_id = current_setting('app.current_user_id', true)::UUID
        )
    )
    WITH CHECK (
        delivery_agent_id = current_setting('app.current_user_id', true)::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'delivery'
        )
        AND EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.id = booking_id 
            AND b.assigned_delivery_agent_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- -----------------------------------------------------------------------------
-- Helpline Agent: View and modify assigned complaints
-- -----------------------------------------------------------------------------

CREATE POLICY helpline_agent_manage_complaints ON complaints
    FOR ALL
    TO authenticated
    USING (
        helpline_agent_id = current_setting('app.current_user_id', true)::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'helpline'
        )
    )
    WITH CHECK (
        helpline_agent_id = current_setting('app.current_user_id', true)::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id', true)::UUID 
            AND u.role = 'helpline'
        )
    );

-- -----------------------------------------------------------------------------
-- Public (Unauthenticated): View available vehicles, insert bookings
-- -----------------------------------------------------------------------------

CREATE POLICY public_view_available_vehicles ON vehicles
    FOR SELECT
    TO anon
    USING (availability_status = 'available');

CREATE POLICY public_insert_bookings ON bookings
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- =============================================================================
-- Trigger for updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
