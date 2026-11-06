create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    color text not null default '#000',
    created_at timestamptz default now()
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY,
  name TEXT NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  image_path text,
  image_uploaded_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE room_members (
  room_id uuid NOT NULL REFERENCES rooms(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),

  pin_id uuid not null
    references public.pins(id)
    on delete cascade,

  author_id uuid not null
    references auth.users(id)
    on delete cascade,

  comment text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);