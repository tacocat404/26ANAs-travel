-- 갤러리에 동영상 추가 (SETUP.md 6단계)
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하면 끝.
-- 이미 있는 사진은 그대로 두고, 동영상용 칸과 파일 보관함만 새로 만듭니다.

-- 1) photos 테이블에 동영상용 칸 3개 추가
--    kind         : 'image'(사진) 또는 'video'(동영상)
--    video_url    : 동영상 파일 주소 (아래 보관함에 올라간 파일)
--    storage_path : 보관함 안 파일 경로 (지울 때 필요)
--    ※ 동영상도 data_url에 '미리보기 사진(첫 장면)'을 넣어 두므로,
--      갤러리 목록은 사진과 똑같이 그려집니다.
alter table photos add column if not exists kind text not null default 'image';
alter table photos add column if not exists video_url text;
alter table photos add column if not exists storage_path text;

-- 2) 동영상 파일 보관함(Storage 버킷) 만들기
--    한 개 최대 50MB, 무료 용량은 총 1GB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array[
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v',
    'video/x-matroska', 'video/3gpp', 'video/mpeg', 'video/x-msvideo'
  ]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 3) 친구들(링크 아는 사람)이 올리고 보고 지울 수 있게
--    — 다른 테이블(members/photos 등)과 같은 수준의 "열린" 정책입니다.
drop policy if exists "media read" on storage.objects;
drop policy if exists "media write" on storage.objects;
drop policy if exists "media delete" on storage.objects;

create policy "media read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media write" on storage.objects
  for insert with check (bucket_id = 'media');
create policy "media delete" on storage.objects
  for delete using (bucket_id = 'media');
