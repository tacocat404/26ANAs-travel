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
