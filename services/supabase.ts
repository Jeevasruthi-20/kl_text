import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://erhtqiyamppypchkeymf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaHRxaXlhbXBweXBjaGtleW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjYxMDQsImV4cCI6MjA5MjYwMjEwNH0.LhHGJfFv_DoUs5cKO8HBcNXbGbWkH_5RJ0nShHzvY0U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
