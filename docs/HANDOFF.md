# HANDOFF - 새 대화에서 이어가기용 상황 정리

> 마지막 갱신: 2026-07-24. 새 세션의 Claude는 이 문서 + `CLAUDE.md` + `docs/PLAN.md` + `docs/DEVLOG.md`를 읽으면 맥락이 복원된다.

## 프로젝트가 뭔가
- **"언제갈까?"** - 친구들이 각자 "안 되는 날"을 색깔로 표시해 모두 갈 수 있는 여행 날짜를 찾는 웹앱.
- 위치: `C:\기미주\일정캘린더`. React + Vite. 운영자는 비개발자.
- 원격 저장소: https://github.com/tacocat404/- (main + feature/map push됨, 2026-07-24). Vercel 연결은 운영자 진행 대기.

## 지금까지 완성된 것 (전부 동작 확인됨)
1. **이름 로그인** (비밀번호 없음, 사람마다 고유 색 자동 배정)
2. **여행 목록/추가** (이모지 + 후보 시기)
3. **캘린더**: 날짜 탭 = 내 "안 되는 날" 토글(내 색), 친구는 색 점, 오늘 마커, 날짜 선택 시 안 되는 사람 이름
4. **지도 (대개편 완료)**: 통계청 시군구 경계로 만든 스타일 지도(딥블루 바다 + 시도별 파스텔, "감도 여행 다트" 레퍼런스). 구역 탭 → 확대 + 거리지도(OSM) + 바깥 마스킹 → 지도 탭으로 장소 핀(번호, 찍은 사람 색) → 찍은 순서대로 선 연결. 첫 핀을 찍으면 자동으로 후보지에 담김.
5. **공지** (고정/삭제), **갤러리** (자동 압축 업로드)
6. **디자인 시스템 v2** "잉크 & 멤버 컬러": 모노크롬 zinc 베이스, 색은 멤버 색만. 라이트/다크 자동, Phosphor 아이콘, 반경 3단(카드16/컨트롤12/칩 pill), reduced-motion 존중. 900px 이상 화면은 와이드 레이아웃(폭 1100px).

## 아키텍처 핵심 (수정 시 반드시 알아야 함)
- **저장소 2단 구조** `src/store.js`: `src/config.js`의 Supabase 키가 비면 **데모 모드**(localStorage, 이 기기만), 채우면 **공유 모드**(Supabase). 두 모드는 같은 함수·같은 snake_case 데이터 모양. 테이블: members / unavailable / trips / regions / **places** / notices / photos.
- "안 되는 날"(unavailable)은 여행별이 아니라 **사람 기준 전역** (이유: PLAN.md §4).
- DB 스키마 = `supabase/schema.sql` (테이블 바꾸면 이 파일도 같이).
- 행정구역 경계: `src/assets/geo/municipalities.json` (KOSTAT, southkorea-maps 경량본). 지도 탭에서 lazy import.
- 화면 코드: `src/*.jsx` (App/Login/TripList/TripDetail/CalendarTab/MapTab/NoticeTab/GalleryTab), 스타일은 `src/styles.css` 하나.
- ⚠️ PowerShell로 한글 파일 치환 금지(인코딩 깨짐) - Edit/Write 도구 사용.
- 미리보기: `.claude/launch.json`(Blog 세션 기준)에 `trip-calendar` 항목이 있고, 일반적으로는 `npm run dev` (포트 5173).

## 남은 일 (우선순위 순)
1. **Supabase 연결**: 운영자가 supabase.com에서 프로젝트 생성(가이드: `docs/SETUP.md` 1단계) → URL + anon 키를 주면 `src/config.js`에 넣기 → 자동으로 공유 모드.
2. **배포**: 운영자가 GitHub 저장소 생성(계정 tacocat404) → push → Vercel 연결(SETUP.md 2단계). git push = 배포.
3. 이후 아이디어(합의 안 됨, 제안만): 핀 순서 바꾸기, 전원 가능일 자동 추천, 후보지 투표, 샘플 데이터 정리 기능.

## 현재 데모 데이터 (운영자 브라우저 localStorage)
- 멤버 "미주"(실사용) + 테스트용 가상 멤버 "철수", 여행 "여름 제주도", 옛 방식 후보지 "제주 애월"(구역 코드 없어 확대 불가), 정선군 + 핀 2개, 공지 1, 사진 1. 운영자가 원하면 정리해 줄 것.

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
