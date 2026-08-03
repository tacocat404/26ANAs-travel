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
    return { ...db, members: softMembers(db.members), day_notes: notesRead(), media_ready: true }
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
    db.photos.push({ id: uid(), created_at: now(), kind: 'image', ...p })
    lsWrite(db)
  },
  async removePhoto(id) {
    const db = lsRead()
    db.photos = db.photos.filter((p) => p.id !== id)
    lsWrite(db)
  },
  // 데모 모드엔 파일 보관함이 없다. 브라우저 저장 공간(약 5MB)에 넣어야 해서
  // 아주 짧은 영상만 받고, 넘치면 이유를 알려준다.
  async uploadVideo(file) {
    const LIMIT = 2 * 1024 * 1024
    if (file.size > LIMIT) {
      throw new Error('이 기기 저장 모드에서는 2MB보다 작은 영상만 올릴 수 있어요.')
    }
    const video_url = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => reject(new Error('동영상을 읽지 못했어요'))
      r.readAsDataURL(file)
    })
    return { video_url, storage_path: null }
  },
  async setPhotoCaption(id, caption) {
    const db = lsRead()
    const p = db.photos.find((x) => x.id === id)
    if (p) p.caption = caption
    lsWrite(db)
  },
  async updateTrip(id, fields) {
    const db = lsRead()
    const t = db.trips.find((x) => x.id === id)
    if (t) Object.assign(t, fields)
    lsWrite(db)
  },
  async updatePlace(id, fields) {
    const db = lsRead()
    const p = db.places.find((x) => x.id === id)
    if (p) Object.assign(p, fields)
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
const MEDIA_BUCKET = 'media' // 동영상 파일 보관함 (supabase/migration-media.sql)
const q = (r) => {
  if (r.error) throw r.error
  return r.data
}

/* ── 사진 본문 캐시 ─────────────────────────────────────────
   사진은 base64로 DB에 들어 있어 한 장에 100~200KB다. 예전에는 getAll()이
   매번 photos.* 를 통째로 받아, 창을 다시 볼 때마다(=focus) 전체를 재다운로드했다.
   이제 목록은 가벼운 메타데이터만 받고, 본문은 "처음 보는 사진"만 받아 캐시한다.
   → 두 번째 새로고침부터 사진 트래픽이 0에 가깝다. */
const photoCache = new Map() // id → data_url
const PHOTO_META = 'id,trip_id,member_id,caption,created_at'
// 동영상 칸(migration-media.sql)이 아직 없는 DB에서도 앱이 멈추지 않게,
// 확장 칸은 따로 붙여 읽어 보고 실패하면 기본 칸만 쓴다.
const PHOTO_META_MEDIA = PHOTO_META + ',kind,video_url,storage_path'
const PHOTO_BATCH = 20 // 한 번에 받을 사진 수 (요청 URL이 너무 길어지지 않게)
let mediaReady = true // photos에 동영상 칸이 있는지 (한 번 실패하면 false로 굳는다)

async function fetchPhotosCached() {
  let metas = null
  if (mediaReady) {
    try {
      metas = q(await sb.from('photos').select(PHOTO_META_MEDIA))
    } catch {
      mediaReady = false // 아직 6단계 마이그레이션 전 — 사진만 쓰는 모드
    }
  }
  if (!metas) metas = q(await sb.from('photos').select(PHOTO_META))
  const missing = metas.filter((p) => !photoCache.has(p.id)).map((p) => p.id)
  for (let i = 0; i < missing.length; i += PHOTO_BATCH) {
    const rows = q(await sb.from('photos').select('id,data_url').in('id', missing.slice(i, i + PHOTO_BATCH)))
    for (const r of rows) photoCache.set(r.id, r.data_url)
  }
  // 지워진 사진은 캐시에서도 정리 (메모리 누수 방지)
  const alive = new Set(metas.map((p) => p.id))
  for (const id of photoCache.keys()) if (!alive.has(id)) photoCache.delete(id)
  return metas.map((p) => ({ ...p, data_url: photoCache.get(p.id) || '' }))
}

const remoteStore = {
  demo: false,
  async getAll() {
    // photos는 본문이 무거워 캐시를 거쳐 따로 받는다 (위 fetchPhotosCached 주석 참고).
    const names = ['members', 'unavailable', 'trips', 'regions', 'places', 'notices']
    const [photos, ...res] = await Promise.all([fetchPhotosCached(), ...names.map((n) => sb.from(n).select('*'))])
    const out = { photos, media_ready: mediaReady }
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
    // 동영상 칸이 아직 없는 DB에 kind/video_url을 보내면 통째로 실패한다.
    // 6단계 마이그레이션 전에도 사진 올리기는 그대로 되게 없는 칸은 빼고 보낸다.
    let payload = p
    if (!mediaReady) {
      const { kind, video_url, storage_path, ...rest } = p
      payload = rest
    }
    // 방금 올린 사진은 본문을 이미 들고 있으니 캐시에 바로 넣어 재다운로드를 막는다.
    const row = q(await sb.from('photos').insert(payload).select('id'))[0]
    if (row?.id && p.data_url) photoCache.set(row.id, p.data_url)
  },
  async removePhoto(id, storage_path) {
    q(await sb.from('photos').delete().eq('id', id))
    photoCache.delete(id)
    // 동영상이면 보관함의 실제 파일도 지운다 (용량 차지 방지).
    // 파일 삭제가 실패해도 목록에서는 이미 사라졌으니 앱을 멈추지 않는다.
    if (storage_path) {
      try {
        await sb.storage.from(MEDIA_BUCKET).remove([storage_path])
      } catch (e) {
        console.error('보관함 파일 삭제 실패', e)
      }
    }
  },
  // 동영상 파일을 보관함(Storage)에 올리고 주소를 돌려준다.
  // DB에는 주소만 들어가서, 사진처럼 통째로 내려받는 일이 없다.
  async uploadVideo(file) {
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
    const storage_path = `videos/${uid()}.${ext}`
    const { error } = await sb.storage
      .from(MEDIA_BUCKET)
      .upload(storage_path, file, { contentType: file.type || 'video/mp4' })
    if (error) {
      console.error(error)
      throw new Error('동영상 보관함이 아직 준비되지 않았어요. (SETUP.md 6단계)')
    }
    const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(storage_path)
    return { video_url: data.publicUrl, storage_path }
  },
  async setPhotoCaption(id, caption) {
    q(await sb.from('photos').update({ caption }).eq('id', id))
  },
  async updateTrip(id, fields) {
    q(await sb.from('trips').update(fields).eq('id', id))
  },
  async updatePlace(id, fields) {
    q(await sb.from('places').update(fields).eq('id', id))
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
