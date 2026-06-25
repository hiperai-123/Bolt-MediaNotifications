/*
  # Flyer Bank Storage Bucket

  ## Overview
  Creates a public storage bucket named `flyer-bank` to host event poster/flyer
  images for the Liberty Harbor notification center. The dashboard reads files
  directly from this bucket so any image uploaded to it becomes available as a
  selectable poster template.

  ## 1. Storage
    - New bucket: `flyer-bank` (public read)
    - File size limit: 10 MB
    - Allowed mime types: png, jpeg, jpg, webp, gif

  ## 2. Security
    - Public can read flyers (this is a public bucket for resident emails)
    - Only authenticated users may upload, update, or delete
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyer-bank',
  'flyer-bank',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public can read flyer-bank'
  ) THEN
    CREATE POLICY "Public can read flyer-bank"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'flyer-bank');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can upload flyers'
  ) THEN
    CREATE POLICY "Authenticated can upload flyers"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'flyer-bank');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can update flyers'
  ) THEN
    CREATE POLICY "Authenticated can update flyers"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'flyer-bank')
      WITH CHECK (bucket_id = 'flyer-bank');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can delete flyers'
  ) THEN
    CREATE POLICY "Authenticated can delete flyers"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'flyer-bank');
  END IF;
END $$;
