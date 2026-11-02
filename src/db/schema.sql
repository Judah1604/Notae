create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    color text not null default '#E05252',
    created_at timestamptz default now()
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY,
  name TEXT NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE room_members (
  room_id uuid NOT NULL REFERENCES rooms(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);