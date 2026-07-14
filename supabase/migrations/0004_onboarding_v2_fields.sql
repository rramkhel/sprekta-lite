alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists wishes jsonb default '[]';
alter table profiles add column if not exists challenge text;
alter table profiles add column if not exists onboarding_answers jsonb default '{}';
