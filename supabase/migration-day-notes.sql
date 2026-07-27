-- 날짜 라벨("이런 날이에요") 저장용 day_notes 테이블 추가 (기존 DB에 한 번만 실행)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 이걸 안 해도 앱은 동작해요. 다만 날짜 라벨이 "내 기기에만" 저장되고,
-- 이걸 실행하면 그때부터 친구들과 함께 보입니다.

create table if not exists day_notes (
  id uuid primary key default gen_random_uuid(),
  date date not null,                        -- 어떤 날인지
  emoji text default '🎂',
  text text not null,                        -- 예: 유노 생일, 시험 끝나는 날
  repeat_yearly boolean default false,       -- 생일·기념일처럼 매년 반복
  member_id uuid references members(id) on delete set null,
  created_at timestamptz default now()
);

alter table day_notes enable row level security;

-- 이미 있으면 무시
drop policy if exists "open" on day_notes;
create policy "open" on day_notes for all using (true) with check (true);
