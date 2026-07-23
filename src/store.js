// 데이터 저장소 — 두 가지 모드를 자동 전환한다.
//  · 데모 모드: 브라우저(localStorage)에 저장. 이 기기에서만 보임.
//  · 공유 모드: Supabase에 저장. src/config.js에 키가 있으면 자동 활성화.
// 두 모드 모두 같은 함수 이름/데이터 모양(snake_case)을 쓴다.
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

export const MEMBER_COLORS = [
  '#FF6B6B', '#4D96FF', '#6BCB77', '#FFB830', '#9B5DE5',
  '#F15BB5', '#00BBF9', '#FF9F1C', '#00C49A', '#845EC2',
]

const LS_KEY = 'trip-cal-v1'
const EMPTY = { members: [], unavailable: [], trips: [], regions: [], places: [], notices: [], photos: [] }
const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

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
    return lsRead()
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
}

export const store = sb ? remoteStore : localStore
