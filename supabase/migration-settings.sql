-- 입장 코드 / 관리자 PIN 저장용 settings 테이블 추가 (기존 DB에 한 번만 실행)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 이걸 안 해도 앱은 config.js의 기본값으로 동작해요. 다만 이걸 해야
-- 관리자 패널에서 코드/PIN 변경이 "저장"됩니다.

create table if not exists settings (
  key text primary key,
  value text
);

alter table settings enable row level security;

-- 이미 있으면 무시
drop policy if exists "open" on settings;
create policy "open" on settings for all using (true) with check (true);
