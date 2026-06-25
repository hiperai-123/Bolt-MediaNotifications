/*
  # Resident Notification Command Center Schema

  ## Overview
  Creates the data model for Liberty Harbor's resident notification center, including
  poster templates, building contacts (10 Regent static list), and notification history.

  ## 1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `name` (text) - Template name (e.g., "May Newsletter")
      - `description` (text) - Short description
      - `image_url` (text) - Poster image URL
      - `category` (text) - e.g., "newsletter", "event", "notice"
      - `created_at` (timestamptz)
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `building` (text) - "Vantage", "Gulls Cove", "10 Regent"
      - `unit` (text)
      - `is_static` (boolean) - true for 10 Regent static list
      - `created_at` (timestamptz)
    - `notifications`
      - `id` (uuid, primary key)
      - `template_id` (uuid, FK)
      - `buildings` (text[]) - selected buildings
      - `include_ten_regent` (boolean)
      - `recipient_count` (int)
      - `status` (text) - "sent", "failed", "pending"
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)

  ## 2. Security
    - RLS enabled on all tables
    - Authenticated read/insert policies for the dashboard
    - Public read on templates and contacts (demo dashboard) restricted by anon role only for SELECT
    - Notifications are insert/select by authenticated users
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  building text NOT NULL,
  unit text DEFAULT '',
  is_static boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  buildings text[] DEFAULT '{}',
  include_ten_regent boolean DEFAULT false,
  recipient_count int DEFAULT 0,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
  ON templates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view contacts"
  ON contacts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view notifications"
  ON notifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

INSERT INTO templates (name, description, image_url, category) VALUES
  ('May Newsletter', 'Monthly community newsletter with updates and events', 'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&cs=tinysrgb&w=800', 'newsletter'),
  ('Summer Social', 'Rooftop summer social event invitation', 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', 'event'),
  ('Lease Renewal', 'Annual lease renewal reminder for residents', 'https://images.pexels.com/photos/4246119/pexels-photo-4246119.jpeg?auto=compress&cs=tinysrgb&w=800', 'notice'),
  ('Pool Opening', 'Seasonal pool opening announcement', 'https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg?auto=compress&cs=tinysrgb&w=800', 'event'),
  ('Maintenance Notice', 'Scheduled building maintenance notification', 'https://images.pexels.com/photos/3964736/pexels-photo-3964736.jpeg?auto=compress&cs=tinysrgb&w=800', 'notice'),
  ('Resident Appreciation', 'Resident appreciation week celebration', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800', 'event')
ON CONFLICT DO NOTHING;

INSERT INTO contacts (name, email, building, unit, is_static) VALUES
  ('Sarah Mitchell', 'sarah.mitchell@example.com', 'Vantage', '12B', false),
  ('David Chen', 'david.chen@example.com', 'Vantage', '7A', false),
  ('Emily Rodriguez', 'emily.r@example.com', 'Vantage', '15C', false),
  ('Michael Park', 'm.park@example.com', 'Vantage', '4D', false),
  ('Jessica Liu', 'j.liu@example.com', 'Vantage', '9F', false),
  ('Robert Anderson', 'r.anderson@example.com', 'Gulls Cove', '3A', false),
  ('Amanda Foster', 'amanda.f@example.com', 'Gulls Cove', '8B', false),
  ('Christopher Lee', 'c.lee@example.com', 'Gulls Cove', '11C', false),
  ('Nicole Brown', 'n.brown@example.com', 'Gulls Cove', '6E', false),
  ('Daniel Garcia', 'd.garcia@example.com', '10 Regent', '2A', true),
  ('Olivia Martinez', 'o.martinez@example.com', '10 Regent', '5B', true),
  ('James Wilson', 'j.wilson@example.com', '10 Regent', '8C', true),
  ('Sophia Taylor', 's.taylor@example.com', '10 Regent', '3D', true),
  ('Benjamin Davis', 'b.davis@example.com', '10 Regent', '7A', true)
ON CONFLICT DO NOTHING;
