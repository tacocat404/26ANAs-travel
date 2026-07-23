import { useState } from 'react'
import { store } from './store.js'

const EMOJIS = ['🏝️', '⛰️', '🏙️', '🎿', '🏕️', '🌸', '🍜', '🚗', '✈️', '🚆']

function fmtPeriod(t) {
  if (!t.start_month) return '시기 미정'
  const s = t.start_month.replace('-', '.')
  if (t.end_month && t.end_month !== t.start_month) return `${s} ~ ${t.end_month.replace('-', '.')}`
  return s
}

export default function TripList({ db, me, refresh, onOpen }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🏝️')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await store.addTrip({
      title: title.trim(),
      emoji,
      start_month: start || null,
      end_month: end || start || null,
      created_by: me.id,
    })
    setAdding(false)
    setTitle('')
    setStart('')
    setEnd('')
    refresh()
  }

  const count = (arr, tid) => arr.filter((x) => x.trip_id === tid).length
  const trips = [...db.trips].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  return (
    <main className="page">
      <div className="section-head">
        <h2>우리 여행</h2>
        <button className="primary small" onClick={() => setAdding((v) => !v)}>
          {adding ? '닫기' : '+ 여행 추가'}
        </button>
      </div>

      {adding && (
        <form className="card form" onSubmit={submit}>
          <div className="emoji-row">
            {EMOJIS.map((e2) => (
              <button
                type="button"
                key={e2}
                className={'emoji-btn' + (emoji === e2 ? ' on' : '')}
                onClick={() => setEmoji(e2)}
              >
                {e2}
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="여행 이름 (예: 여름 제주도)" maxLength={20} />
          <div className="row month-row">
            <label>
              후보 시기
              <input type="month" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <span>~</span>
            <label>
              <input type="month" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <button className="primary" disabled={!title.trim()}>
            만들기
          </button>
        </form>
      )}

      {trips.length === 0 && !adding && (
        <div className="empty card">
          아직 여행이 없어요.
          <br />
          <b>+ 여행 추가</b>로 첫 여행을 만들어 보세요! ✈️
        </div>
      )}

      <div className="trip-cards">
        {trips.map((t) => (
          <button key={t.id} className="card trip-card" onClick={() => onOpen(t.id)}>
            <span className="trip-emoji">{t.emoji}</span>
            <span className="trip-info">
              <b>{t.title}</b>
              <small>🗓️ {fmtPeriod(t)}</small>
              <small>
                📍 후보지 {count(db.regions, t.id)} · 📢 공지 {count(db.notices, t.id)} · 📷 사진 {count(db.photos, t.id)}
              </small>
            </span>
            <span className="chev">›</span>
          </button>
        ))}
      </div>

      <section className="card members-card">
        <h3>함께하는 친구들</h3>
        <div className="legend">
          {db.members.map((m) => (
            <span key={m.id} className="legend-item">
              <i style={{ background: m.color }} />
              {m.name}
              {m.id === me.id ? ' (나)' : ''}
            </span>
          ))}
        </div>
        <p className="sub-note">친구에게 링크를 알려주면, 이름만 입력하고 바로 참여할 수 있어요.</p>
      </section>
    </main>
  )
}
