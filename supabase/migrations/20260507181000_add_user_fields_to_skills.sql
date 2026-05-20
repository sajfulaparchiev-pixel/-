-- Add missing user profile fields to skills table for public visibility
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_bio TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_location TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_telegram TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS user_email TEXT;
