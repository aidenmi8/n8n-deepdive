/*
  # Fix RLS Policies for Data Ingestion

  1. Security Updates
    - Add INSERT policies for data ingestion on all tables
    - Add UPDATE policies for data updates
    - Allow anonymous access for public procurement data
    
  2. Data Ingestion Support
    - Enable anonymous INSERT/UPDATE for procurement data
    - Maintain authenticated user policies for user data
*/

-- Fix procurement_releases policies
DROP POLICY IF EXISTS "Public read access for procurement releases" ON procurement_releases;

CREATE POLICY "Public read access for procurement releases"
  ON procurement_releases
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for procurement releases"
  ON procurement_releases
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for procurement releases"
  ON procurement_releases
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix procurement_parties policies
DROP POLICY IF EXISTS "Public read access for procurement parties" ON procurement_parties;

CREATE POLICY "Public read access for procurement parties"
  ON procurement_parties
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for procurement parties"
  ON procurement_parties
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for procurement parties"
  ON procurement_parties
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix procurement_documents policies
DROP POLICY IF EXISTS "Public read access for procurement documents" ON procurement_documents;

CREATE POLICY "Public read access for procurement documents"
  ON procurement_documents
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for procurement documents"
  ON procurement_documents
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for procurement documents"
  ON procurement_documents
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix procurement_awards policies
DROP POLICY IF EXISTS "Public read access for procurement awards" ON procurement_awards;

CREATE POLICY "Public read access for procurement awards"
  ON procurement_awards
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for procurement awards"
  ON procurement_awards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for procurement awards"
  ON procurement_awards
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix procurement_contracts policies
DROP POLICY IF EXISTS "Public read access for procurement contracts" ON procurement_contracts;

CREATE POLICY "Public read access for procurement contracts"
  ON procurement_contracts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for procurement contracts"
  ON procurement_contracts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for procurement contracts"
  ON procurement_contracts
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix vendor_performance policies
DROP POLICY IF EXISTS "Public read access for vendor performance" ON vendor_performance;

CREATE POLICY "Public read access for vendor performance"
  ON vendor_performance
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for vendor performance"
  ON vendor_performance
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for vendor performance"
  ON vendor_performance
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix pricing_intelligence policies
DROP POLICY IF EXISTS "Public read access for pricing intelligence" ON pricing_intelligence;

CREATE POLICY "Public read access for pricing intelligence"
  ON pricing_intelligence
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for pricing intelligence"
  ON pricing_intelligence
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for pricing intelligence"
  ON pricing_intelligence
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix entity_statistics policies
DROP POLICY IF EXISTS "Public read access for entity statistics" ON entity_statistics;

CREATE POLICY "Public read access for entity statistics"
  ON entity_statistics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion for entity statistics"
  ON entity_statistics
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data updates for entity statistics"
  ON entity_statistics
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix data_ingestion_log policies  
DROP POLICY IF EXISTS "Admin access to ingestion log" ON data_ingestion_log;

CREATE POLICY "Public read access to ingestion log"
  ON data_ingestion_log
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow data ingestion logging"
  ON data_ingestion_log
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow data ingestion log updates"
  ON data_ingestion_log
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);