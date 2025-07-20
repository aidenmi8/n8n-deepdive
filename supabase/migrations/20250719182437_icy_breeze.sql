/*
  # RFP Tracking System Database Schema

  1. Core Tables
    - `procurement_releases` - Main procurement opportunities data
    - `procurement_parties` - Entities involved (buyers, suppliers)
    - `procurement_documents` - Associated documents
    - `procurement_awards` - Award information
    - `procurement_contracts` - Contract details

  2. User Features
    - `user_profiles` - User preferences and settings
    - `user_alerts` - Email alert configurations
    - `user_bookmarks` - Saved/tracked opportunities
    - `user_notes` - User notes on opportunities

  3. Analytics
    - `vendor_performance` - Historical vendor performance
    - `pricing_intelligence` - Historical pricing data
    - `entity_statistics` - Entity procurement patterns

  4. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core procurement data tables
CREATE TABLE IF NOT EXISTS procurement_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocid text UNIQUE NOT NULL,
  title text,
  description text,
  status text,
  procurement_method text,
  procurement_method_details text,
  main_procurement_category text,
  submission_method text[],
  submission_method_details text,
  budget_amount numeric,
  budget_currency text DEFAULT 'DOP',
  start_date timestamptz,
  end_date timestamptz,
  enquiry_start_date timestamptz,
  enquiry_end_date timestamptz,
  has_enquiries boolean DEFAULT false,
  eligibility_criteria text,
  award_criteria text,
  award_criteria_details text,
  buyer_id text,
  buyer_name text,
  language text DEFAULT 'es',
  published_date timestamptz,
  tender_period_start timestamptz,
  tender_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  raw_data jsonb, -- Store original API response
  data_source text DEFAULT 'dgcp_api'
);

CREATE TABLE IF NOT EXISTS procurement_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  party_id text NOT NULL,
  name text NOT NULL,
  roles text[] NOT NULL,
  identifier_scheme text,
  identifier_id text,
  legal_name text,
  address_locality text,
  address_region text,
  address_country text DEFAULT 'Dominican Republic',
  contact_name text,
  contact_email text,
  contact_telephone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procurement_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  document_id text,
  document_type text,
  title text,
  description text,
  url text,
  date_published timestamptz,
  date_modified timestamptz,
  format text,
  language text DEFAULT 'es',
  file_size bigint,
  downloaded_at timestamptz,
  local_path text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procurement_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  award_id text,
  title text,
  description text,
  status text,
  date timestamptz,
  value_amount numeric,
  value_currency text DEFAULT 'DOP',
  contract_period_start timestamptz,
  contract_period_end timestamptz,
  suppliers jsonb, -- Array of supplier information
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procurement_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  award_id uuid REFERENCES procurement_awards(id),
  contract_id text,
  title text,
  description text,
  status text,
  period_start timestamptz,
  period_end timestamptz,
  value_amount numeric,
  value_currency text DEFAULT 'DOP',
  created_at timestamptz DEFAULT now()
);

-- User management tables
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  company text,
  position text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  keywords text[],
  entities text[],
  regions text[],
  categories text[],
  min_budget numeric,
  max_budget numeric,
  is_active boolean DEFAULT true,
  email_frequency text DEFAULT 'daily', -- immediate, daily, weekly
  last_sent timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  tags text[],
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, release_id)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id uuid REFERENCES procurement_releases(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS vendor_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_identifier text,
  entity_name text NOT NULL,
  total_awards integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  currency text DEFAULT 'DOP',
  average_award_value numeric DEFAULT 0,
  first_award_date timestamptz,
  last_award_date timestamptz,
  categories text[],
  success_rate numeric, -- percentage of bids won
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_name, entity_name)
);

CREATE TABLE IF NOT EXISTS pricing_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  entity_name text NOT NULL,
  region text,
  average_value numeric,
  median_value numeric,
  min_value numeric,
  max_value numeric,
  currency text DEFAULT 'DOP',
  sample_size integer,
  date_range_start timestamptz,
  date_range_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL,
  region text,
  total_opportunities integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  currency text DEFAULT 'DOP',
  average_opportunity_value numeric DEFAULT 0,
  most_common_category text,
  most_common_method text,
  active_opportunities integer DEFAULT 0,
  completed_opportunities integer DEFAULT 0,
  date_range_start timestamptz,
  date_range_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_name, date_range_start, date_range_end)
);

-- Data ingestion tracking
CREATE TABLE IF NOT EXISTS data_ingestion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  endpoint text,
  date_range_start date,
  date_range_end date,
  total_records integer DEFAULT 0,
  successful_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  errors jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' -- running, completed, failed
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_procurement_releases_ocid ON procurement_releases(ocid);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_buyer_name ON procurement_releases(buyer_name);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_status ON procurement_releases(status);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_end_date ON procurement_releases(end_date);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_published_date ON procurement_releases(published_date);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_category ON procurement_releases(main_procurement_category);
CREATE INDEX IF NOT EXISTS idx_procurement_releases_budget ON procurement_releases(budget_amount);

CREATE INDEX IF NOT EXISTS idx_procurement_parties_release_id ON procurement_parties(release_id);
CREATE INDEX IF NOT EXISTS idx_procurement_parties_roles ON procurement_parties USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_procurement_parties_region ON procurement_parties(address_region);

CREATE INDEX IF NOT EXISTS idx_procurement_documents_release_id ON procurement_documents(release_id);
CREATE INDEX IF NOT EXISTS idx_procurement_documents_type ON procurement_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_active ON user_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_release_id ON user_bookmarks(release_id);

CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor ON vendor_performance(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_entity ON vendor_performance(entity_name);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_procurement_releases_search ON procurement_releases 
  USING gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(buyer_name, '')));

-- Enable Row Level Security
ALTER TABLE procurement_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_ingestion_log ENABLE ROW LEVEL SECURITY;

-- Public read access for procurement data
CREATE POLICY "Public read access for procurement releases"
  ON procurement_releases
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for procurement parties"
  ON procurement_parties
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for procurement documents"
  ON procurement_documents
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for procurement awards"
  ON procurement_awards
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for procurement contracts"
  ON procurement_contracts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for vendor performance"
  ON vendor_performance
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for pricing intelligence"
  ON pricing_intelligence
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for entity statistics"
  ON entity_statistics
  FOR SELECT
  TO public
  USING (true);

-- User-specific policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own alerts"
  ON user_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
  ON user_bookmarks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes"
  ON user_notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies for data ingestion
CREATE POLICY "Admin access to ingestion log"
  ON data_ingestion_log
  FOR ALL
  TO authenticated
  USING (true); -- In production, restrict to admin role