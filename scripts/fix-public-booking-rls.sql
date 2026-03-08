-- ============================================
-- FIX PUBLIC BOOKING RLS POLICY
-- Run this in Supabase SQL Editor to allow anonymous users to create booking requests
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "booking_requests_public_insert" ON booking_requests;

-- Create policy that allows anyone (anonymous or authenticated) to create booking requests
-- This enables public booking via QR code/link without requiring login
CREATE POLICY "booking_requests_public_insert" ON booking_requests
  FOR INSERT 
  WITH CHECK (true);

-- Verify the policy was created
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'booking_requests'
  AND policyname = 'booking_requests_public_insert';

