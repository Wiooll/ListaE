/*
  # Add completed column to list_items

  1. Changes
    - Add `completed` boolean column to `list_items` table with default value of false

  2. Security
    - No changes to security policies required
*/

ALTER TABLE list_items 
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;