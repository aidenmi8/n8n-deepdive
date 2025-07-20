/*
  # Add Missing Unique Constraints for Upsert Operations

  1. Constraints Added
    - `procurement_documents` table: unique constraint on (release_id, document_id)
    - `procurement_parties` table: unique constraint on (release_id, party_id)
  
  2. Purpose
    - Enable upsert operations (ON CONFLICT) in data ingestion
    - Prevent duplicate entries during data synchronization
    - Support efficient data updates without errors

  3. Impact
    - Fixes "no unique constraint matching ON CONFLICT" errors
    - Allows proper data ingestion and updates
    - Maintains data integrity
*/

-- Add unique constraint for procurement_documents upsert operations
ALTER TABLE public.procurement_documents
ADD CONSTRAINT procurement_documents_release_id_document_id_key
UNIQUE (release_id, document_id);

-- Add unique constraint for procurement_parties upsert operations  
ALTER TABLE public.procurement_parties
ADD CONSTRAINT procurement_parties_release_id_party_id_key
UNIQUE (release_id, party_id);