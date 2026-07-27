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

## 3단계 (선택). 장소 검색을 카카오로 업그레이드 — 약 5분

지도 탭의 장소 검색은 기본으로 OpenStreetMap(무료, 키 없음)을 써요.
동네 맛집까지 촘촘하게 검색하고 싶으면 카카오 키를 발급받아 연결할 수 있어요.

1. https://developers.kakao.com 접속 → 카카오 계정으로 로그인
2. 상단 **내 애플리케이션** → **애플리케이션 추가하기**
   - 앱 이름: `언제갈까` (아무거나 OK), 회사명: 본인 이름 아무거나
3. 만든 앱 클릭 → **[앱 설정] → [플랫폼]** → **Web 플랫폼 등록** 에서 사이트 도메인 추가:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - (배포 후) `https://우리앱주소.vercel.app` 도 잊지 말고 추가
4. **[앱 설정] → [앱 키]** 에서 **JavaScript 키** 복사
5. Claude에게: "카카오 JavaScript 키 발급했어. ○○○야. 연결해줘"
   → `src/config.js`의 `KAKAO_JS_KEY`에 넣으면 자동으로 카카오 검색으로 바뀌어요.

- JavaScript 키는 "등록한 도메인에서만 동작"하는 키라 공개돼도 크게 위험하지 않아요. 단, 도메인 등록을 안 하면 검색이 안 되니 3번을 꼭 하세요.

## 4단계 (선택). 입장 코드·관리자 저장 켜기 — 약 2분

앱에 **입장 코드**(친구만 들어오게)와 **관리자 PIN**이 생겼어요.
이걸 안 해도 앱은 `src/config.js`의 기본값(입장 코드 `7264`, 관리자 PIN `1004`)으로 동작해요.
다만 아래를 하면 **관리자 패널에서 코드·PIN을 바꿔 저장**할 수 있어요.

1. Supabase 대시보드 → **SQL Editor**
2. 이 폴더의 `supabase/migration-settings.sql` 내용을 붙여넣고 **Run**
3. 앱에서 관리자(⚙️) → 관리자 PIN 입력 → 코드·PIN을 원하는 값으로 바꾸고 저장

- ⚠️ **배포 후 관리자 PIN(`1004`)은 꼭 바꾸세요.** Claude에게 "관리자 PIN을 ○○로 바꿔줘" 하면 config 기본값도 바꿔줘요.
- 솔직히: 입장 코드·PIN은 낯선 사람을 막는 **부드러운 잠금**이에요. 친구들에게만 코드를 알려주면 충분하지만, 기술을 아는 사람은 우회할 수 있어요(이 앱의 기존 보안 수준과 동일).

## 5단계 (선택). 날짜 라벨을 친구들과 함께 보기 — 약 1분

캘린더에서 날짜를 누르면 **"이런 날이에요"**(생일·시험 끝·월급날 등)를 붙일 수 있어요.
이걸 안 해도 기능은 바로 동작하는데, 라벨이 **내 기기에만** 저장돼요.
아래를 하면 그때부터 **친구들 화면에도 같이** 보여요.

1. Supabase 대시보드 → **SQL Editor**
2. 이 폴더의 `supabase/migration-day-notes.sql` 내용을 붙여넣고 **Run**
3. 앱을 새로고침하면 캘린더 위의 "이 기기에만 저장돼요" 안내가 사라져요

- 이 단계를 하기 전에 내 기기에 적어둔 라벨은 옮겨지지 않아요. 몇 개 안 되면 다시 적어주세요.

## 참고

- anon 키는 "링크 아는 사람은 쓸 수 있는 열쇠"예요. 친구들끼리만 링크를 공유하면 돼요. 위험한 관리자 키(`service_role`)는 절대 아무 데도 넣지 않아요.
- 무료 용량: Supabase 500MB — 사진을 자동 압축(장당 약 0.1~0.2MB)하니 수천 장은 거뜬해요.
