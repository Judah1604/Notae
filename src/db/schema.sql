create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    color text not null default '#E05252',
    created_at timestamptz default now()
);