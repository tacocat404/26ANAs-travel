export function memberById(db, id) {
  return db.members.find((m) => m.id === id)
}

export function memberName(db, id) {
  return memberById(db, id)?.name || '알 수 없음'
}

/* ── 날짜 헬퍼 ── */
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
export const pad2 = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
export const todayStr = () => ymd(new Date())
export const dowOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// '2026-08-15' → '2026.08.15(토)'
export function fmtDate(dateStr) {
  if (!dateStr) return ''
  return `${dateStr.replaceAll('-', '.')}(${WEEK[dowOf(dateStr)]})`
}

// 확정된 여행 기간을 사람이 읽기 좋게. 당일치기/여러 날 모두 처리.
export function fmtRange(start, end) {
  if (!start) return ''
  if (!end || end === start) return fmtDate(start)
  const sameMonth = start.slice(0, 7) === end.slice(0, 7)
  const endLabel = sameMonth ? `${Number(end.slice(8))}(${WEEK[dowOf(end)]})` : fmtDate(end)
  return `${fmtDate(start)} ~ ${endLabel}`
}

// 앞으로 60일 안에서 "모두 되는 날"을 찾는다. (아무도 안 되는 날로 표시 안 한 날)
// 멤버가 2명 이상일 때만 의미가 있다. 최대 limit개까지.
export function allFreeDays(db, limit = 4) {
  if (!db?.members?.length || db.members.length < 2) return []
  const busy = new Set(db.unavailable.map((u) => u.date))
  const out = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 1; i <= 60 && out.length < limit; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const s = ymd(d)
    if (!busy.has(s)) out.push(s)
  }
  return out
}

// 여행이 지금 어느 단계인지 자동 판정: 1 일정조율 / 2 세부일정 / 3 추억정리
export function tripStage(trip) {
  if (!trip.confirmed_start) return 1
  const last = trip.confirmed_end || trip.confirmed_start
  return todayStr() > last ? 3 : 2
}

// 그날까지 남은 날 수. 오늘 자정 기준이라 "D-1 = 내일".
export function dday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((start - now) / 86400000)
}

// 여행 카드에 붙는 상태 배지. 여행 목록·대시보드가 같은 규칙을 쓰도록 한 곳에 둔다.
// withDone=true면 지난 여행을 '다녀옴'으로 (대시보드용). 목록은 탭으로 이미 나뉘어 필요 없다.
export function tripStatus(trip, { withDone = false } = {}) {
  const stage = tripStage(trip)
  if (withDone && stage === 3) return { label: '다녀옴', kind: 'plan' }
  if (stage === 1) return { label: '날짜 조율 중', kind: 'plan' }
  const today = todayStr()
  const end = trip.confirmed_end || trip.confirmed_start
  if (today >= trip.confirmed_start && today <= end) return { label: '여행 중', kind: 'live' }
  return { label: `D-${dday(trip.confirmed_start)}`, kind: 'soon', num: true }
}

// 후보 시기(월 범위)를 읽기 좋게. '2026-08' → '2026.08', 범위면 '2026.08 ~ 2026.09'
export function fmtMonths(trip) {
  if (!trip.start_month) return '시기 미정'
  const s = trip.start_month.replace('-', '.')
  if (trip.end_month && trip.end_month !== trip.start_month) return `${s} ~ ${trip.end_month.replace('-', '.')}`
  return s
}

/* ── 달력 그리드 ── (캘린더 화면 두 곳이 같은 계산을 쓰도록) */
// 'YYYY-MM' → 그 달의 요일 정렬된 칸 배열. 앞쪽 빈칸은 null.
export function monthGrid(ym) {
  const [year, month] = ym.split('-').map(Number)
  const firstDow = new Date(year, month - 1, 1).getDay()
  const days = new Date(year, month, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  return { year, month, days, cells }
}

// 'YYYY-MM'에서 delta개월 이동
export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const t = new Date(y, m - 1 + delta, 1)
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}`
}

// 업로드 사진을 최대 1000px, JPEG 75%로 압축해 용량을 줄인다.
export async function compressImage(file) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })
  const max = 1000
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(img.src)
  return c.toDataURL('image/jpeg', 0.75)
}
