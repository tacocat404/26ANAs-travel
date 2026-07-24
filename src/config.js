// ── 공유 모드 설정 ──────────────────────────────────────────
// 친구들과 실시간으로 데이터를 공유하려면 Supabase 프로젝트를 만들고
// 아래 두 값을 채워 넣으세요. 자세한 방법: docs/SETUP.md
// 비어 있으면 "데모 모드"(이 기기에만 저장)로 동작합니다.
export const SUPABASE_URL = 'https://ipjiyweguvoxduhmakmr.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_HZJYEv9I29q_SOf_GnJy1A_tFnleKrl'

// ── 입장 코드 / 관리자 (친구용 부드러운 잠금) ────────────────
// 아래 값은 "처음 기본값"이에요. Supabase에 settings 테이블이 있으면
// 관리자 패널에서 바꾼 값(DB)이 우선합니다. (docs/SETUP.md 4단계)
// ※ 솔직히: 이건 낯선 사람을 막는 '부드러운 잠금'이에요. 링크+공개키를
//   아는 기술자는 우회할 수 있어요 (이 앱의 기존 보안 모델과 동일).
export const DEFAULT_ACCESS_CODE = '7264' // 친구들과 공유하는 입장 코드
export const DEFAULT_ADMIN_PIN = '1004' // 관리자만 아는 PIN — 배포 후 꼭 바꾸세요

// ── 장소 검색 업그레이드 (선택) ─────────────────────────────
// 카카오 개발자(developers.kakao.com)에서 발급받은 JavaScript 키를 넣으면
// 지도 탭의 장소 검색이 카카오(네이버급 상호 데이터)로 자동 전환됩니다.
// 비어 있으면 OpenStreetMap 검색으로 동작합니다. 방법: docs/SETUP.md
export const KAKAO_JS_KEY = '0ad7baa8f374da7a3ec968733658aa18'
