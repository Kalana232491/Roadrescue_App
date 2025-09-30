-- Users table: service providers and service recipients, plus admins
create table if not exists users (
  id            bigserial primary key,
  username      varchar(50) not null unique,
  phone         varchar(20) not null unique,
  password_hash text not null,
  role          varchar(20) not null check (role in ('admin','provider','recipient')),
  created_at    timestamptz not null default now()
);

-- Providers have types: INDUSTRIALIST (mechanic), ACCESSORY_SELLER, CARRIER (tow truck)
create table if not exists provider_profiles (
  id             bigserial primary key,
  user_id        bigint not null references users(id) on delete cascade,
  display_name   varchar(100) not null,
  about          text,
  phone_public   varchar(20) not null,
  lat            double precision,
  lng            double precision,
  address_text   text,
  status         varchar(20) not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Provider types (many-to-many flags)
create table if not exists provider_types (
  id          bigserial primary key,
  profile_id  bigint not null references provider_profiles(id) on delete cascade,
  type        varchar(30) not null check (type in ('INDUSTRIALIST','ACCESSORY_SELLER','CARRIER')),
  unique(profile_id, type)
);

-- Provider images (profile/workplace/carrier vehicle). Max 5 enforced at app layer.
create table if not exists provider_images (
  id          bigserial primary key,
  profile_id  bigint not null references provider_profiles(id) on delete cascade,
  url         text not null
);

-- Accessories sold by ACCESSORY_SELLER profiles
create table if not exists accessories (
  id          bigserial primary key,
  profile_id  bigint not null references provider_profiles(id) on delete cascade,
  title       varchar(25) not null, -- max 25 chars
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_url   text
);

-- Reviews by recipients on providers
create table if not exists reviews (
  id           bigserial primary key,
  provider_id  bigint not null references provider_profiles(id) on delete cascade,
  author_id    bigint not null references users(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  unique(provider_id, author_id)
);