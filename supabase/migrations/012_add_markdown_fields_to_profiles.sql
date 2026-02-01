-- Add markdown fields for profile and projects
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS about_me TEXT,
  ADD COLUMN IF NOT EXISTS projects TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.about_me IS 'Markdown content for user profile (patterns, preferences, priorities, etc)';
COMMENT ON COLUMN public.profiles.projects IS 'Markdown content for active projects and goals';
