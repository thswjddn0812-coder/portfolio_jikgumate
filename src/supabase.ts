import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxzxrbbuguvkaungicax.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4enhyYmJ1Z3V2a2F1bmdpY2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NTAwMDcsImV4cCI6MjA4MjAyNjAwN30.PkF-ftx4noYdXGTe5fMGI3yqC81Nff5UoUyQVpMsBHE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
