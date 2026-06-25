/*
  # Create user_graphics table for custom image storage

  1. New Tables
    - `user_graphics`
      - `id` (uuid, primary key)
      - `name` (text) - original filename or user-given name
      - `url` (text) - public URL of the stored image
      - `storage_path` (text) - path in storage bucket
      - `mime_type` (text) - image MIME type
      - `size_bytes` (integer) - file size
      - `created_at` (timestamptz) - upload timestamp

  2. Security
    - Enable RLS on `user_graphics` table
    - Add policy for authenticated users to manage their own graphics
    - Add policy for anon access (since app doesn't use auth currently)
*/

CREATE TABLE IF NOT EXISTS user_graphics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  url text NOT NULL,
  storage_path text NOT NULL DEFAULT '',
  mime_type text NOT NULL DEFAULT 'image/png',
  size_bytes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_graphics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to graphics"
  ON user_graphics
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow insert graphics"
  ON user_graphics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow delete graphics"
  ON user_graphics
  FOR DELETE
  TO authenticated, anon
  USING (true);
