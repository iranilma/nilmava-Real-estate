-- ============================================================================
-- NILMA VA REAL ESTATE — PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (TENANTS)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    legal_entity_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    default_measurement_unit VARCHAR(10) DEFAULT 'sqm', -- 'sqm' or 'sqft'
    default_commission_rate NUMERIC(5,2) DEFAULT 3.00,
    agency_split_pct NUMERIC(5,2) DEFAULT 50.00,
    agent_split_pct NUMERIC(5,2) DEFAULT 50.00,
    annual_sales_target NUMERIC(15,2) DEFAULT 30000000.00,
    annual_profit_target NUMERIC(15,2) DEFAULT 450000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS (RBAC)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'platform_super_admin',
        'agency_principal',
        'senior_broker',
        'transaction_coordinator'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'senior_broker',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- 4. AGENTS (OPERATIONAL BROKER PROFILES)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Broker Associate',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    annual_quota NUMERIC(15,2) DEFAULT 3000000.00,
    commission_split_rate NUMERIC(5,2) DEFAULT 50.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENTS
DO $$ BEGIN
    CREATE TYPE client_type AS ENUM ('Buyer', 'Seller', 'Investor', 'Tenant');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client_type client_type NOT NULL DEFAULT 'Buyer',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    preferred_location VARCHAR(255),
    budget NUMERIC(15,2),
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    birthday DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROPERTIES
DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('Available', 'Under Offer', 'Sold', 'Off Market');
    CREATE TYPE property_type AS ENUM ('Villa', 'Penthouse', 'Apartment', 'Townhouse', 'Commercial', 'Land');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ref_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    property_type property_type NOT NULL DEFAULT 'Villa',
    location VARCHAR(255) NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    bedrooms INT DEFAULT 0,
    bathrooms NUMERIC(3,1) DEFAULT 0,
    
    -- Canonical Measurement: Square Metres stored with 2 decimal precision
    size_sqm NUMERIC(10,2) NOT NULL,
    entry_measurement_unit VARCHAR(10) NOT NULL DEFAULT 'sqm',
    
    -- Featured Image URL
    image_url TEXT,
    
    -- Simple Google Drive property folder link
    google_drive_folder_url TEXT,
    
    status property_status NOT NULL DEFAULT 'Available',
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    date_listed DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, ref_code)
);

-- 7. LEADS & ENQUIRIES
DO $$ BEGIN
    CREATE TYPE lead_source AS ENUM ('Website', 'Portal', 'Referral', 'Walk-in', 'Social', 'Sign Call');
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Viewing Scheduled', 'Negotiation', 'Closed Won', 'Lost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    source lead_source NOT NULL DEFAULT 'Website',
    lead_type VARCHAR(50) DEFAULT 'Buyer',
    status lead_status NOT NULL DEFAULT 'New',
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    budget_min NUMERIC(15,2),
    budget_max NUMERIC(15,2),
    property_interest VARCHAR(255),
    timeline VARCHAR(50) DEFAULT '3-6 mo',
    is_preapproved BOOLEAN DEFAULT FALSE,
    heat_score INT DEFAULT 20,
    last_contact_date DATE,
    next_followup_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALES PIPELINE (DEALS)
DO $$ BEGIN
    CREATE TYPE pipeline_stage AS ENUM (
        'new_enquiry',
        'contacted',
        'qualified',
        'viewing_scheduled',
        'negotiation',
        'offer_accepted',
        'closed_won',
        'closed_lost'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    assigned_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    stage pipeline_stage NOT NULL DEFAULT 'new_enquiry',
    deal_value NUMERIC(15,2) NOT NULL,
    probability_pct INT NOT NULL DEFAULT 10,
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PROPERTY VIEWINGS / SHOWINGS
DO $$ BEGIN
    CREATE TYPE viewing_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'No-Show');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS viewings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    assigned_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    viewing_date DATE NOT NULL,
    viewing_time TIME NOT NULL,
    status viewing_status NOT NULL DEFAULT 'Scheduled',
    rating INT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ACTION TASKS
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Client Follow-up',
    due_date DATE NOT NULL,
    priority task_priority NOT NULL DEFAULT 'Medium',
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    linked_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    linked_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    linked_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CLOSED FINANCIAL TRANSACTIONS (IMMUTABLE SETTLEMENTS)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    settlement_reference VARCHAR(50) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE RESTRICT,
    property_title_snapshot VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name_snapshot VARCHAR(255),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    agent_name_snapshot VARCHAR(255) NOT NULL,
    closing_date DATE NOT NULL,
    sale_price NUMERIC(15,2) NOT NULL,
    
    commission_rate NUMERIC(5,2) NOT NULL,
    agency_split_pct NUMERIC(5,2) NOT NULL,
    agent_split_pct NUMERIC(5,2) NOT NULL,
    
    gross_commission NUMERIC(15,2) NOT NULL,
    agency_share NUMERIC(15,2) NOT NULL,
    agent_share NUMERIC(15,2) NOT NULL,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. OPERATING OVERHEAD & EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    recurrence VARCHAR(50) DEFAULT 'Monthly',
    amount NUMERIC(15,2) NOT NULL,
    vendor VARCHAR(255),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    user_identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: current user organization membership
CREATE OR REPLACE FUNCTION current_user_org_ids()
RETURNS TABLE (org_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE profile_id = auth.uid() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Tenant Isolation Policy Boilerplate
CREATE POLICY org_members_tenant_isolation ON organization_members
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY agents_tenant_isolation ON agents
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY clients_tenant_isolation ON clients
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY leads_tenant_isolation ON leads
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY deals_tenant_isolation ON deals
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY viewings_tenant_isolation ON viewings
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY tasks_tenant_isolation ON tasks
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY transactions_tenant_isolation ON transactions
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY expenses_tenant_isolation ON expenses
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL USING (organization_id IN (SELECT current_user_org_ids()));
