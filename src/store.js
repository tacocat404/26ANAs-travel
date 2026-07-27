// 데이터 저장소 — 두 가지 모드를 자동 전환한다.
//  · 데모 모드: 브라우저(localStorage)에 저장. 이 기기에서만 보임.
//  · 공유 모드: Supabase에 저장. src/config.js에 키가 있으면 자동 활성화.
// 두 모드 모두 같은 함수 이름/데이터 모양(snake_case)을 쓴다.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, DEFAULT_ACCESS_CODE, DEFAULT_ADMIN_PIN } from './config.js'

// 관리자 패널이 못 바꾼 초기값. DB settings에 값이 있으면 그게 우선.
const SETTING_DEFAULTS = { access_code: DEFAULT_ACCESS_CODE, admin_pin: DEFAULT_ADMIN_PIN }
const LS_SETTINGS = 'trip-cal-settings'

// 새 멤버에게 주는 색 — 해마풍 파스텔 팔레트.
export const MEMBER_COLORS = [
  '#F4A9B8', '#A9C8EE', '#A9DCC8', '#F6D98A', '#CDB8EE',
  '#F6B79A', '#9FD8E0', '#E9B5D2', '#BFD9A0', '#C9BBA6',
]

// 예전에 저장된 원색(#FF6B6B 등)도 화면에선 파스텔로 보이게 한다.
// DB 원본은 건드리지 않고, 그릴 때만 채도를 낮추고 밝기를 올린다.
export function pastelize(hex) {
  if (typeof hex !== 'string') return hex
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const int = parseInt(m[1], 16)
  let r = (int >> 16) & 255
  let g = (int >> 8) & 255
  let b = int & 255
  // 흰색 쪽으로 42% 섞어 부드럽게 (이미 연한 색은 거의 그대로)
  const mix = 0.42
  r = Math.round(r + (255 - r) * mix)
  g = Math.round(g + (255 - g) * mix)
  b = Math.round(b + (255 - b) * mix)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

const softMembers = (members) => (members || []).map((m) => ({ ...m, color: pastelize(m.color) }))

const LS_KEY = 'trip-cal-v1'
const EMPTY = { members: [], unavailable: [], trips: [], regions: [], places: [], notices: [], photos: [] }
const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

/* ── 날짜 라벨("이런 날이에요") ──────────────────────────────
   공유 모드에서 day_notes 테이블이 아직 없어도 기능이 멈추지 않도록,
   이 기기(localStorage)에 대신 저장하고 UI가 그 사실을 알려준다.
   테이블을 만들면(SETUP.md 5단계) 그다음부터 친구들과 공유된다. */
const LS_NOTES = 'trip-cal-day-notes'
const notesRead = () => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_NOTES))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const notesWrite = (list) => {
  try {
    localStorage.setItem(LS_NOTES, JSON.stringify(list))
  } catch {
    /* 저장 공간이 없으면 조용히 넘어간다 */
  }
}
const notesAddLocal = (n) => {
  const row = { id: uid(), created_at: now(), ...n }
  notesWrite([...notesRead(), row])
  return row
}

function lsRead() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY))
    return { ...EMPTY, ...(d || {}) }
  } catch {
    return { ...EMPTY }
  }
}
function lsWrite(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

const localStore = {
  demo: true,
  async getAll() {
    const db = lsRead()
    return { ...db, members: softMembers(db.members), day_notes: notesRead() }
  },
  async addMember(name) {
    const db = lsRead()
    const ex = db.members.find((m) => m.name === name)
    if (ex) return ex
    const m = { id: uid(), name, color: MEMBER_COLORS[db.members.length % MEMBER_COLORS.length], created_at: now() }
    db.members.push(m)
    lsWrite(db)
    return m
  },
  async toggleUnavailable(member_id, date) {
    const db = lsRead()
    const i = db.unavailable.findIndex((u) => u.member_id === member_id && u.date === date)
    if (i >= 0) db.unavailable.splice(i, 1)
    else db.unavailable.push({ id: uid(), member_id, date })
    lsWrite(db)
  },
  async addTrip(t) {
    const db = lsRead()
    db.trips.push({ id: uid(), created_at: now(), ...t })
    lsWrite(db)
  },
  async removeTrip(id) {
    const db = lsRead()
    db.trips = db.trips.filter((t) => t.id !== id)
    for (const k of ['regions', 'places', 'notices', 'photos']) db[k] = db[k].filter((x) => x.trip_id !== id)
    lsWrite(db)
  },
  async setTripDates(id, dates) {
    const db = lsRead()
    const t = db.trips.find((x) => x.id === id)
    if (t) Object.assign(t, dates) // { confirmed_start, confirmed_end }
    lsWrite(db)
  },
  async addRegion(r) {
    const db = lsRead()
    const row = { id: uid(), created_at: now(), ...r }
    db.regions.push(row)
    lsWrite(db)
    return row
  },
  async removeRegion(id) {
    const db = lsRead()
    db.regions = db.regions.filter((r) => r.id !== id)
    db.places = db.places.filter((p) => p.region_id !== id)
    lsWrite(db)
  },
  async addPlace(p) {
    const db = lsRead()
    db.places.push({ id: uid(), created_at: now(), ...p })
    lsWrite(db)
  },
  async removePlace(id) {
    const db = lsRead()
    db.places = db.places.filter((p) => p.id !== id)
    lsWrite(db)
  },
  async addNotice(n) {
    const db = lsRead()
    db.notices.push({ id: uid(), pinned: false, created_at: now(), ...n })
    lsWrite(db)
  },
  async setNoticePinned(id, pinned) {
    const db = lsRead()
    const n = db.notices.find((x) => x.id === id)
    if (n) n.pinned = pinned
    lsWrite(db)
  },
  async removeNotice(id) {
    const db = lsRead()
    db.notices = db.notices.filter((n) => n.id !== id)
    lsWrite(db)
  },
  async addPhoto(p) {
    const db = lsRead()
    db.photos.push({ id: uid(), created_at: now(), ...p })
    lsWrite(db)
  },
  async removePhoto(id) {
    const db = lsRead()
    db.photos = db.photos.filter((p) => p.id !== id)
    lsWrite(db)
  },
  // 입장 코드 / 관리자 PIN (데모: localStorage)
  async getSettings() {
    try {
      return { ...SETTING_DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}) }
    } catch {
      return { ...SETTING_DEFAULTS }
    }
  },
  async setSetting(key, value) {
    const cur = await this.getSettings()
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ ...cur, [key]: value }))
  },
  // 관리자용: 멤버 삭제 (그 사람의 '안 되는 날'도 함께)
  async removeMember(id) {
    const db = lsRead()
    db.members = db.members.filter((m) => m.id !== id)
    db.unavailable = db.unavailable.filter((u) => u.member_id !== id)
    lsWrite(db)
  },
  async renameMember(id, name) {
    const db = lsRead()
    const m = db.members.find((x) => x.id === id)
    if (m) m.name = name
    lsWrite(db)
  },
  // 날짜 라벨 ("8월 3일은 유노 생일" 같은 표시)
  async addDayNote(n) {
    return notesAddLocal(n)
  },
  async removeDayNote(id) {
    notesWrite(notesRead().filter((n) => n.id !== id))
  },
}

const sb = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
const q = (r) => {
  if (r.error) throw r.error
  return r.data
}

const remoteStore = {
  demo: false,
  async getAll() {
    const names = ['members', 'unavailable', 'trips', 'regions', 'places', 'notices', 'photos']
    const res = await Promise.all(names.map((n) => sb.from(n).select('*')))
    const out = {}
    names.forEach((n, i) => {
      out[n] = q(res[i])
    })
    out.members = softMembers(out.members)
    // 날짜 라벨은 테이블이 아직 없을 수 있어 따로 읽는다 (없으면 이 기기 저장분으로).
    try {
      out.day_notes = q(await sb.from('day_notes').select('*'))
      out.day_notes_local = false
    } catch {
      out.day_notes = notesRead()
      out.day_notes_local = true
    }
    return out
  },
  async addMember(name) {
    const ex = q(await sb.from('members').select('*').eq('name', name).limit(1))
    if (ex.length) return ex[0]
    const all = q(await sb.from('members').select('id'))
    const color = MEMBER_COLORS[all.length % MEMBER_COLORS.length]
    return q(await sb.from('members').insert({ name, color }).select())[0]
  },
  async toggleUnavailable(member_id, date) {
    const ex = q(await sb.from('unavailable').select('id').eq('member_id', member_id).eq('date', date))
    if (ex.length) q(await sb.from('unavailable').delete().eq('id', ex[0].id))
    else q(await sb.from('unavailable').insert({ member_id, date }))
  },
  async addTrip(t) {
    q(await sb.from('trips').insert(t))
  },
  async removeTrip(id) {
    q(await sb.from('trips').delete().eq('id', id))
  },
  async setTripDates(id, dates) {
    q(await sb.from('trips').update(dates).eq('id', id))
  },
  async addRegion(r) {
    return q(await sb.from('regions').insert(r).select())[0]
  },
  async removeRegion(id) {
    q(await sb.from('regions').delete().eq('id', id))
  },
  async addPlace(p) {
    q(await sb.from('places').insert(p))
  },
  async removePlace(id) {
    q(await sb.from('places').delete().eq('id', id))
  },
  async addNotice(n) {
    q(await sb.from('notices').insert(n))
  },
  async setNoticePinned(id, pinned) {
    q(await sb.from('notices').update({ pinned }).eq('id', id))
  },
  async removeNotice(id) {
    q(await sb.from('notices').delete().eq('id', id))
  },
  async addPhoto(p) {
    q(await sb.from('photos').insert(p))
  },
  async removePhoto(id) {
    q(await sb.from('photos').delete().eq('id', id))
  },
  // 입장 코드 / 관리자 PIN — settings 테이블. 테이블이 아직 없으면 기본값으로 폴백.
  async getSettings() {
    try {
      const rows = q(await sb.from('settings').select('key,value'))
      const out = { ...SETTING_DEFAULTS }
      for (const r of rows) out[r.key] = r.value
      return out
    } catch {
      return { ...SETTING_DEFAULTS }
    }
  },
  async setSetting(key, value) {
    q(await sb.from('settings').upsert({ key, value }, { onConflict: 'key' }))
  },
  async removeMember(id) {
    q(await sb.from('members').delete().eq('id', id))
  },
  async renameMember(id, name) {
    q(await sb.from('members').update({ name }).eq('id', id))
  },
  // 날짜 라벨 — 테이블이 없으면 이 기기에 저장해 기능이 멈추지 않게 한다.
  async addDayNote(n) {
    try {
      return q(await sb.from('day_notes').insert(n).select())[0]
    } catch {
      return notesAddLocal(n)
    }
  },
  async removeDayNote(id) {
    try {
      q(await sb.from('day_notes').delete().eq('id', id))
    } catch {
      notesWrite(notesRead().filter((n) => n.id !== id))
    }
  },
}

export const store = sb ? remoteStore : localStore
