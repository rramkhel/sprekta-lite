alter table profiles add column if not exists facts jsonb default '[]';
alter table profiles add column if not exists priorities jsonb default '[]';
alter table profiles add column if not exists situations jsonb default '[]';
alter table profiles add column if not exists onboarded boolean default false;
