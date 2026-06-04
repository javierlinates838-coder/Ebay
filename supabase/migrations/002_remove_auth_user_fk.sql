-- Allow inventory storage without Supabase Auth login (uses service role + demo user id)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_user_id_fkey;
ALTER TABLE ebay_connections DROP CONSTRAINT IF EXISTS ebay_connections_user_id_fkey;
