/*
  # Track flyer name on notifications

  ## Overview
  Notifications now reference flyers from a Storage bucket rather than rows in
  the templates table. We store the flyer's display name and image URL on the
  notification record so history is preserved even if the file is later removed.

  ## 1. Modified Tables
    - `notifications`
      - Adds `template_name` (text) - human-readable flyer name
      - Adds `template_image_url` (text) - public URL of the flyer at send time

  ## 2. Notes
    - `template_id` remains for backwards-compat but is no longer required.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'template_name'
  ) THEN
    ALTER TABLE notifications ADD COLUMN template_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'template_image_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN template_image_url text DEFAULT '';
  END IF;
END $$;
