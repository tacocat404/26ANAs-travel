# 공유 모드 + 배포 준비 가이드 (운영자용)

지금 앱은 **데모 모드**예요. 내 컴퓨터/폰에만 저장되고 친구들에겐 안 보여요.
친구들과 같은 데이터를 보려면 아래 두 가지가 필요해요. **계정 만들기만 직접 하시면, 나머지는 Claude가 해요.**

## 1단계. Supabase (무료 데이터 창고) — 약 5분

1. https://supabase.com 접속 → **Start your project** → GitHub 계정으로 가입
2. **New project** 클릭
   - Name: `trip-calendar` (아무거나 OK)
   - Database Password: 아무거나 만들고 **메모** (다시 쓸 일 거의 없음)
   - Region: `Northeast Asia (Seoul)` 선택
3. 프로젝트가 만들어지면(1~2분) 왼쪽 메뉴 **SQL Editor** 클릭
   → 이 폴더의 `supabase/schema.sql` 파일 내용을 **전체 복사해서 붙여넣고 Run**
4. 왼쪽 메뉴 **Project Settings(톱니바퀴) → API** 에서 두 값을 복사:
   - `Project URL` (https://xxxx.supabase.co 형태)
   - `anon public` 키 (긴 문자열)
5. Claude에게 이렇게 말하기:
   > "Supabase 만들었어. URL은 ○○○, anon 키는 ○○○야. 연결해줘"

   → Claude가 `src/config.js`에 넣으면 자동으로 공유 모드로 바뀌어요.

## 2단계. 배포 (친구들에게 링크 주기)

블로그 때와 똑같은 방식이에요 (GitHub + Vercel).

1. GitHub에서 **New repository** → 이름 예: `trip-calendar` (Private 말고 **Public** 또는 Vercel 연결되는 Private)
2. Claude에게: "저장소 만들었어, 주소는 ○○○야. 올려줘" → Claude가 push
3. https://vercel.com → **Add New Project** → 방금 만든 저장소 선택 → **Deploy** (설정 바꿀 것 없음, Vite 자동 인식)
4. 나온 주소(`https://trip-calendar-xxx.vercel.app`)를 친구들에게 공유! 🎉

## 참고

- anon 키는 "링크 아는 사람은 쓸 수 있는 열쇠"예요. 친구들끼리만 링크를 공유하면 돼요. 위험한 관리자 키(`service_role`)는 절대 아무 데도 넣지 않아요.
- 무료 용량: Supabase 500MB — 사진을 자동 압축(장당 약 0.1~0.2MB)하니 수천 장은 거뜬해요.
