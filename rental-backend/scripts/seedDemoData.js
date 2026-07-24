// rental-backend/scripts/seedDemoData.js
// Script to populate realistic demo data for development.
// It inserts data only if the corresponding tables are empty, and marks
// each record with an `is_demo` flag (boolean). The flag can be used in the UI
// to display a "Demo Data" badge.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials are missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to ensure `is_demo` column exists (adds it if missing)
async function ensureDemoColumn(table) {
  // Check if column exists via information_schema (Postgres specific)
  const { data: colData, error: colError } = await supabase
    .rpc('pg_table_def', { table_name: table })
    .single();
  // If RPC not available, ignore – we assume column may already exist.
  if (colError) return;
  if (!colData?.column_name?.includes('is_demo')) {
    console.log(`Adding is_demo column to ${table}`);
    const sql = `ALTER TABLE ${table} ADD COLUMN is_demo boolean DEFAULT false;`;
    await supabase.rpc('execute_sql', { sql });
  }
}

async function insertIfEmpty(table, rows) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.error(`Error counting ${table}:`, error);
    return;
  }
  if (count && count > 0) {
    console.log(`${table} already has data (${count} rows). Skipping demo insertion.`);
    return;
  }

  // Ensure demo flag column exists
  await ensureDemoColumn(table);

  const { data, error: insertError } = await supabase.from(table).insert(rows);
  if (insertError) console.error(`Error inserting demo data into ${table}:`, insertError);
  else console.log(`Inserted ${data?.length || rows.length} demo rows into ${table}`);
}

async function seed() {
  // Users
  await insertIfEmpty('users', [
    {
      email: 'demo_user1@example.com',
      name: 'Demo User One',
      avatar_url: 'https://i.pravatar.cc/150?img=1',
      is_demo: true,
    },
    {
      email: 'demo_user2@example.com',
      name: 'Demo User Two',
      avatar_url: 'https://i.pravatar.cc/150?img=2',
      is_demo: true,
    },
  ]);

  // User Profiles (assuming separate table)
  await insertIfEmpty('profiles', [
    {
      user_id: 1,
      phone: '+1-555-0101',
      bio: 'This is a demo profile.',
      is_demo: true,
    },
    {
      user_id: 2,
      phone: '+1-555-0202',
      bio: 'Another demo profile.',
      is_demo: true,
    },
  ]);

  // KYC Requests
  await insertIfEmpty('kyc_submissions', [
    {
      user_id: 1,
      status: 'pending',
      document_url: 'https://placehold.co/400x600',
      is_demo: true,
    },
    {
      user_id: 2,
      status: 'approved',
      document_url: 'https://placehold.co/400x600',
      is_demo: true,
    },
  ]);

  // Categories
  await insertIfEmpty('categories', [
    { name: 'Apartment', description: 'Demo category', is_demo: true },
    { name: 'House', description: 'Demo category', is_demo: true },
    { name: 'Studio', description: 'Demo category', is_demo: true },
  ]);

  // Product Listings (products)
  await insertIfEmpty('products', [
    {
      owner_id: 1,
      title: 'Demo Cozy Apartment',
      description: 'A realistic demo apartment for testing.',
      price_per_day: 50,
      category: 'Apartment',
      images: ['https://placehold.co/400x300'],
      status: 'active',
      is_demo: true,
    },
    {
      owner_id: 2,
      title: 'Demo Modern Studio',
      description: 'A stylish studio space.',
      price_per_day: 40,
      category: 'Studio',
      images: ['https://placehold.co/400x300'],
      status: 'active',
      is_demo: true,
    },
  ]);

  // Bookings
  await insertIfEmpty('bookings', [
    {
      product_id: 1,
      renter_id: 2,
      owner_id: 1,
      status: 'approved',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      is_demo: true,
    },
  ]);

  // Reviews
  await insertIfEmpty('reviews', [
    {
      product_id: 1,
      user_id: 2,
      rating: 4,
      comment: 'Great place for a short stay, demo data.',
      is_demo: true,
    },
  ]);

  // Notifications
  await insertIfEmpty('notifications', [
    {
      user_id: 1,
      type: 'booking_created',
      payload: { booking_id: 1 },
      read: false,
      is_demo: true,
    },
  ]);

  // Chat Messages
  await insertIfEmpty('messages', [
    {
      booking_id: 1,
      sender_id: 1,
      content: 'Hello! This is demo chat.',
      created_at: new Date().toISOString(),
      is_demo: true,
    },
    {
      booking_id: 1,
      sender_id: 2,
      content: 'Hi, looking forward to the stay.',
      created_at: new Date().toISOString(),
      is_demo: true,
    },
  ]);

  // Payments
  await insertIfEmpty('payments', [
    {
      user_id: 2,
      booking_id: 1,
      amount: 150,
      status: 'succeeded',
      method: 'card',
      is_demo: true,
    },
  ]);

  // Disputes
  await insertIfEmpty('disputes', [
    {
      booking_id: 1,
      reported_by: 2,
      reason: 'Demo dispute reason',
      status: 'open',
      is_demo: true,
    },
  ]);

  // Wishlist (assuming a table name)
  await insertIfEmpty('wishlists', [
    { user_id: 1, product_id: 2, is_demo: true },
    { user_id: 2, product_id: 1, is_demo: true },
  ]);

  // Admin Dashboard Statistics – typically aggregated, so we insert dummy rows
  await insertIfEmpty('admin_stats', [
    { key: 'total_users', value: 2, is_demo: true },
    { key: 'total_products', value: 2, is_demo: true },
    { key: 'total_bookings', value: 1, is_demo: true },
  ]);
}

seed()
  .then(() => console.log('Demo data seeding complete'))
  .catch((e) => console.error('Seeding error:', e));
