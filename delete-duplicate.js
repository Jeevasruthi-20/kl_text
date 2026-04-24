const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://erhtqiyamppypchkeymf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaHRxaXlhbXBweXBjaGtleW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjYxMDQsImV4cCI6MjA5MjYwMjEwNH0.LhHGJfFv_DoUs5cKO8HBcNXbGbWkH_5RJ0nShHzvY0U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { error } = await supabase.from('invoices').delete().eq('id', 2);
  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted duplicate invoice (id: 2)');
  }
}

run();
