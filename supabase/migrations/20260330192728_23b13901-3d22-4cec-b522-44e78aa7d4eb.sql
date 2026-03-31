
-- Add is_approved column to profiles (default false for new signups)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Existing profiles should be approved
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;
