-- 언제갈까? 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하면 끝.

create table members (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text not null,
  created_at timestamptz default now()
);

create table unavailable (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  unique (member_id, date)
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  emoji text default '🏝️',
  start_month text,          -- 후보 시기(월). 1단계 일정 조율의 출발점.
  end_month text,
  confirmed_start date,      -- 확정된 여행 시작일. 1단계에서 "가는 날 확정" 시 저장.
  confirmed_end date,        -- 확정된 여행 종료일(당일치기면 시작일과 같음).
  created_by uuid references members(id) on delete set null,
  created_at timestamptz default now()
);
-- 기존 프로젝트에 이미 trips 테이블이 있으면 아래 두 줄만 실행:
-- alter table trips add column if not exists confirmed_start date;
-- alter table trips add column if not exists confirmed_end date;

create table regions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  code text,
  lat double precision not null,
  lng double precision not null,
  added_by uuid references members(id) on delete set null,
  created_at timestamptz default now()
);

-- 후보지(행정구역) 안에 찍는 장소 핀 (맛집, 갈 곳 등). 추가한 순서대로 선으로 이어진다.
create table places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  region_id uuid not null references regions(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  added_by uuid references members(id) on delete set null,
  created_at timestamptz default now()
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  content text not null,
  pinned boolean default false,
  created_at timestamptz default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  data_url text not null,
  caption text default '',
  created_at timestamptz default now()
);

-- 친구끼리 쓰는 앱이라 링크(anon key)를 아는 사람은 모두 읽고 쓸 수 있게 연다.
alter table members enable row level security;
alter table unavailable enable row level security;
alter table trips enable row level security;
alter table regions enable row level security;
alter table places enable row level security;
alter table notices enable row level security;
alter table photos enable row level security;

create policy "open" on members for all using (true) with check (true);
create policy "open" on unavailable for all using (true) with check (true);
create policy "open" on trips for all using (true) with check (true);
create policy "open" on regions for all using (true) with check (true);
create policy "open" on places for all using (true) with check (true);
create policy "open" on notices for all using (true) with check (true);
create policy "open" on photos for all using (true) with check (true);
