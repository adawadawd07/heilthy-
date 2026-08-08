create table if not exists users (
  id uuid primary key,
  email text unique not null,
  display_name text,
  language text default 'ar',
  timezone text default 'Asia/Riyadh',
  theme text default 'system',
  notifications_enabled boolean default false,
  created_at timestamptz default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text,
  name_ar text,
  name_en text,
  timestamp timestamptz default now(),
  logical_date date not null,
  meal_type text not null,
  total_calories numeric not null,
  total_protein_g numeric not null,
  total_carbs_g numeric not null,
  total_fat_g numeric not null,
  image_url text,
  source text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid references meals(id) on delete cascade,
  food_id text,
  name text not null,
  name_ar text,
  name_en text,
  quantity numeric not null,
  unit text not null,
  weight_g numeric not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  confidence text
);

create table if not exists favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  name_ar text,
  items jsonb not null,
  total_calories numeric not null,
  total_protein_g numeric not null,
  total_carbs_g numeric not null,
  total_fat_g numeric not null
);

create index if not exists idx_meals_user_id_logical_date on meals(user_id, logical_date);
create index if not exists idx_meals_user_id on meals(user_id);
create index if not exists idx_meal_items_meal_id on meal_items(meal_id);
