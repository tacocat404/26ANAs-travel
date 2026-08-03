# HANDOFF - 새 대화에서 이어가기용 상황 정리

> 마지막 갱신: 2026-08-03. 새 세션의 Claude는 이 문서 + `CLAUDE.md` + `docs/PLAN.md` + `docs/DEVLOG.md`를 읽으면 맥락이 복원된다.

## 프로젝트가 뭔가
- **"언제갈까?"** - 친구들이 각자 "안 되는 날"을 색깔로 표시해 모두 갈 수 있는 여행 날짜를 찾는 웹앱.
- 위치: `C:\기미주\일정캘린더`. React + Vite. 운영자는 비개발자.
- 원격 저장소: https://github.com/tacocat404/26ANAs-travel (2026-07-24 `-`에서 이름 변경됨). main + feature/map push됨.
- 배포: GitHub Pages(Actions). main push = 자동 배포. `vite.config.js` base=`/26ANAs-travel/`(빌드 시). 워크플로 `.github/workflows/deploy.yml`. 운영자가 Settings→Pages→Source="GitHub Actions" 1회 설정 필요. 예상 주소 https://tacocat404.github.io/26ANAs-travel/
  - ⚠️ 저장소 이름을 또 바꾸면 vite.config.js의 base도 같이 바꿔야 함.

## 지금까지 완성된 것 (전부 동작 확인됨)
1. **이름 로그인** (비밀번호 없음, 사람마다 고유 색 자동 배정)
2. **여행 목록/추가** (이모지 + 후보 시기)
3. **캘린더**: 날짜 탭 = 내 "안 되는 날" 토글(내 색), 친구는 색 점, 오늘 마커, 날짜 선택 시 안 되는 사람 이름
4. **지도 (대개편 완료)**: 통계청 시군구 경계로 만든 스타일 지도(딥블루 바다 + 시도별 파스텔, "감도 여행 다트" 레퍼런스). 구역 탭 → 확대 + 거리지도(OSM) + 바깥 마스킹 → 지도 탭으로 장소 핀(번호, 찍은 사람 색) → 찍은 순서대로 선 연결. 첫 핀을 찍으면 자동으로 후보지에 담김.
5. **공지** (고정/삭제), **갤러리** (사진 자동 압축 업로드 + 동영상, 격자에서 바로 × 삭제 — 올린 사람과 관리자만)
6. **디자인 시스템 v3** "여행 기록(해마풍 파스텔 일기)" — 2026-07-24 배포. 웜 화이트 배경 + 흰 카드(둥근 22px) + 옅은 그림자 + 단일 복숭아 액센트(`--accent`) + 파스텔 멤버 블롭 + 손글씨(Gaegu, `--hand`). 버튼 알약형. 라이트/다크 자동. (이전 v2 "잉크&멤버컬러" 대체.)
7. **소개 랜딩** (`Landing.jsx`): 스크롤 내려가며 앱 설명 → 시작하기.
8. **입장 코드 + 관리자 PIN** (`Gate.jsx`/`AdminPanel.jsx`): 랜딩 → 입장 코드(친구만) → 이름 로그인. 상단 ⚙️ → 관리자 PIN → 관리자 패널(입장 코드·PIN 변경/멤버·여행 삭제). 기본값 config.js `DEFAULT_ACCESS_CODE='7264'`, `DEFAULT_ADMIN_PIN='1004'`. DB `settings`(key/value)에 저장하면 그게 우선(테이블 없으면 config 폴백).
   - ✅ 2026-08-03 확인: `settings` 테이블 생성 완료, **입장 코드·관리자 PIN 모두 기본값에서 변경됨**. 실제 값은 공개 저장소라 여기 적지 않는다(필요하면 운영자에게 묻거나 관리자 패널에서 확인). 코드/PIN은 "부드러운 잠금"(친구용, 기술적 우회 가능).

## 아키텍처 핵심 (수정 시 반드시 알아야 함)
- **저장소 2단 구조** `src/store.js`: `src/config.js`의 Supabase 키가 비면 **데모 모드**(localStorage, 이 기기만), 채우면 **공유 모드**(Supabase). 두 모드는 같은 함수·같은 snake_case 데이터 모양. 테이블: members / unavailable / trips / regions / **places** / notices / photos.
- "안 되는 날"(unavailable)은 여행별이 아니라 **사람 기준 전역** (이유: PLAN.md §4).
- DB 스키마 = `supabase/schema.sql` (테이블 바꾸면 이 파일도 같이).
- 행정구역 경계: `src/assets/geo/municipalities.json` (KOSTAT, southkorea-maps 경량본). 지도 탭에서 lazy import.
- 화면 코드: `src/*.jsx` (App/Login/TripList/TripDetail/CalendarTab/MapTab/NoticeTab/GalleryTab 등).
- **스타일은 `src/styles/` 주제별 16개 파일** + `src/styles.css`가 순서대로 `@import`. ⚠️ **import 순서가 곧 캐스케이드 우선순위**라 임의로 바꾸지 말 것. 빌드하면 한 파일로 합쳐진다.
- **공통 로직은 `src/utils.js`에 모은다**: 날짜(`pad2/ymd/todayStr/fmtDate/fmtRange/fmtMonths`), 달력(`monthGrid/shiftMonth`), 여행 상태(`tripStage/tripStatus/dday`), `allFreeDays`, `compressImage`. 화면마다 같은 계산을 다시 만들지 말 것.
- **사진 성능 주의**: 사진은 base64로 DB에 있어 무겁다. `store.js`의 `fetchPhotosCached()`가 목록은 메타데이터만 받고 본문은 처음 보는 것만 받아 캐시한다. photos를 `select('*')`로 다시 바꾸면 새로고침마다 전체 재다운로드가 되살아난다.
- **동영상**: 파일은 DB가 아니라 **Supabase Storage `media` 버킷**에 있고 `photos.video_url`엔 주소만 있다(`kind='video'`, 지울 때 쓰는 `storage_path`). `data_url`에는 업로드할 때 만든 **첫 장면 미리보기 사진**이 들어가 목록·커버가 사진과 똑같이 그려진다. 새 칸이 없는 DB에서도 앱이 안 깨지게 `media_ready` 플래그로 사진 전용 모드로 내려간다 — 이 폴백을 지우지 말 것. 마이그레이션: `supabase/migration-media.sql`(SETUP.md 6단계).
- **갤러리 한 칸은 `MediaCell.jsx`** 공통 부품(열기 버튼 + × 삭제 + ▶ 배지). 칸을 다시 `<button>`으로 되돌리면 안에 삭제 버튼을 넣을 수 없다.
- **지도는 `React.lazy`로 분리**돼 있다(TripDetail). Leaflet이 첫 화면 번들에 끼지 않게 하려는 것이라 정적 import로 되돌리지 말 것.
- ⚠️ PowerShell로 한글 파일 치환 금지(인코딩 깨짐) - Edit/Write 도구 사용.
- 미리보기: `.claude/launch.json`(Blog 세션 기준)에 `trip-calendar` 항목이 있고, 일반적으로는 `npm run dev` (포트 5173).

## 남은 일 (우선순위 순)
1. ~~**Supabase 연결**~~ — 2026-07-24 완료. `src/config.js`에 URL + Publishable key(`sb_publishable_...`, 새 Supabase 키 체계) 입력됨. 앱은 이제 **공유 모드**로 동작 중 (친구들끼리 같은 데이터 공유).
2. ~~**배포**~~ — GitHub Pages로 이미 자동 배포 중 (main push = 배포). https://tacocat404.github.io/26ANAs-travel/
3. ~~**`supabase/migration-media.sql` 실행**~~ — 2026-08-03 완료. 갤러리 동영상 켜짐(업로드→재생→삭제까지 실 환경 검증, 삭제 시 보관함 파일도 함께 삭제됨).
4. 이후 아이디어(합의 안 됨, 제안만): 전원 가능일 자동 추천, 후보지 투표, 준비물 체크리스트, 비용 정산, 공지 수정, 샘플 데이터 정리 기능.

## 현재 실사용 데이터 (2026-08-03, 공유 DB)
- 멤버 10명(김민준·김성민·박윤호·이채환·고다은·박서영·허아진·최지윤·김나연·정다인), 여행 2개(🎂 유노 생일파티 / 🏖️ 26아박령 MT, 8/10~11 확정), 사진 1장, 공지 있음, 생일 라벨 5개.
- ⚠️ 실사용 중이므로 **테스트는 데모 모드(config 임시 변경)로 하고 반드시 원상 복구**할 것. 실 DB에 만든 테스트 데이터는 그 자리에서 지운다.

## 브랜치 / worktree 운영 (2026-07-24부터)
- 대화(세션)마다 브랜치를 나눠 병렬 작업한다. 브랜치별로 **전용 폴더(worktree)**가 있다:
  - `C:\기미주\일정캘린더` = **main** (안정 버전. 여기서 직접 기능 작업하지 말 것)
  - `C:\기미주\일정캘린더-map` = **feature/map** (지도 기능 개편 전담)
  - 새 브랜치가 필요하면: `git worktree add -b feature/<이름> ..\일정캘린더-<이름>` + 그 폴더에서 `npm install`
- 자기 브랜치 폴더 안에서만 수정·커밋한다. 완성되면 main에 merge (merge는 운영자가 시키면 Claude가 수행).
- DEVLOG.md는 브랜치마다 자기 작업을 기록 - merge 때 충돌나면 양쪽 항목을 모두 남기는 방식으로 해결.
- 미리보기: main은 포트 5173(`trip-calendar`), map 브랜치는 포트 5174(`trip-calendar-map`, launch.json 등록됨).

## 작업 규칙 (요약)
- 모든 작업 후 `docs/DEVLOG.md`에 기록 (형식: 날짜 → `### [태그] 제목` → 사용자 프롬프트 요약 + 변경사항 + 다음 단계).
- 운영자는 비개발자: 설명은 쉽게, 계정 생성은 운영자 직접, Claude는 기계적 단계만.
- 디자인 작업 시 taste-skill(= design-taste-frontend) 원칙 준수: 이모지는 콘텐츠에만, em-dash 금지, 다크모드 필수, 모노크롬+멤버색 시스템 유지.
