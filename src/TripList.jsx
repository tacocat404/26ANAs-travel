import { useState } from 'react'
import { Plus, CalendarBlank, MapPin, Megaphone, Images, CaretRight, AirplaneTilt, Confetti } from '@phosphor-icons/react'
import { store } from './store.js'
import MemberLegend from './MemberLegend.jsx'
import EmojiPicker from './EmojiPicker.jsx'
import { tripStage, fmtRange, fmtMonths, tripStatus } from './utils.js'

export default function TripList({ db, me, refresh, onOpen, mode = 'ongoing' }) {
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
  const coverOf = (tid) => {
    const ps = db.photos
      .filter((p) => p.trip_id === tid)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return ps[0]?.data_url || null
  }
  const rangeEnd = (t) => t.confirmed_end || t.confirmed_start

  const done = mode === 'done'
  const graded = db.trips.map((t) => ({ t, stage: tripStage(t) }))
  const trips = done
    ? graded
        .filter((x) => x.stage === 3)
        .sort((a, b) => (rangeEnd(b.t) || '').localeCompare(rangeEnd(a.t) || ''))
        .map((x) => x.t)
    : graded
        .filter((x) => x.stage !== 3)
        .sort((a, b) => {
          const rank = (s) => (s === 2 ? 0 : 1) // 확정·미도래 여행을 조율 중보다 먼저
          if (rank(a.stage) !== rank(b.stage)) return rank(a.stage) - rank(b.stage)
          if (a.stage === 2) return a.t.confirmed_start.localeCompare(b.t.confirmed_start)
          return (b.t.created_at || '').localeCompare(a.t.created_at || '')
        })
        .map((x) => x.t)

  // ── 끝난 여행: 사진을 앞세운 추억 카드 ──
  if (done) {
    return (
      <div className="tab-body">
        <div className="section-head">
          <h2>끝난 여행</h2>
          {trips.length > 0 && <small className="count-note num">{trips.length}</small>}
        </div>

        {trips.length === 0 ? (
          <div className="empty card">
            <Confetti size={30} weight="duotone" />
            <span>
              아직 끝난 여행이 없어요.
              <br />
              여행을 다녀오면 여기에 <b>추억</b>으로 모여요.
            </span>
          </div>
        ) : (
          <div className="memory-cards">
            {trips.map((t) => {
              const cover = coverOf(t.id)
              const photos = count(db.photos, t.id)
              return (
                <button key={t.id} className="card memory-card" onClick={() => onOpen(t.id)}>
                  <span
                    className="memory-cover"
                    style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                  >
                    {!cover && <span className="memory-emoji">{t.emoji}</span>}
                    {photos > 0 && (
                      <span className="memory-count num">
                        <Images size={13} weight="fill" />
                        {photos}
                      </span>
                    )}
                  </span>
                  <span className="memory-body">
                    <b>
                      <span className="trip-chip-emoji">{t.emoji}</span> {t.title}
                    </b>
                    <small className="num">
                      <CalendarBlank size={12} />
                      {fmtRange(t.confirmed_start, t.confirmed_end)} 다녀옴
                    </small>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── 진행 중 여행: 조율 중 + 확정·미도래 ──
  return (
    <div className="tab-body">
      <div className="section-head">
        <h2>진행 중 여행</h2>
        <button className="primary small" onClick={() => setAdding((v) => !v)}>
          {adding ? '닫기' : (
            <>
              <Plus size={15} weight="bold" />
              여행 추가
            </>
          )}
        </button>
      </div>

      {adding && (
        <form className="card form" onSubmit={submit}>
          <label className="pick-label">
            이 여행을 나타낼 이모지 <span className="pick-current">{emoji}</span>
          </label>
          <EmojiPicker value={emoji} onChange={setEmoji} />
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
          <AirplaneTilt size={30} weight="duotone" />
          <span>
            아직 진행 중인 여행이 없어요.
            <br />
            <b>여행 추가</b>로 첫 여행을 시작해 보세요.
          </span>
        </div>
      )}

      <div className="trip-cards">
        {trips.map((t) => {
          const cover = coverOf(t.id)
          const st = tripStatus(t)
          return (
            <button key={t.id} className="card trip-card" onClick={() => onOpen(t.id)}>
              {cover ? (
                <span className="trip-cover" style={{ backgroundImage: `url(${cover})` }} />
              ) : (
                <span className="trip-emoji">{t.emoji}</span>
              )}
              <span className="trip-info">
                <span className="trip-title-row">
                  <b>{t.title}</b>
                  <span className={'trip-status ' + st.kind + (st.num ? ' num' : '')}>{st.label}</span>
                </span>
                <small className="trip-meta">
                  <CalendarBlank size={13} />
                  {st.kind === 'plan' ? fmtMonths(t) : fmtRange(t.confirmed_start, t.confirmed_end)}
                </small>
                <small className="trip-meta num">
                  <MapPin size={13} />
                  {count(db.regions, t.id)}
                  <span className="gap" />
                  <Megaphone size={13} />
                  {count(db.notices, t.id)}
                  <span className="gap" />
                  <Images size={13} />
                  {count(db.photos, t.id)}
                </small>
              </span>
              <span className="chev">
                <CaretRight size={18} />
              </span>
            </button>
          )
        })}
      </div>

      <section className="card members-card">
        <h3>함께하는 친구들</h3>
        <MemberLegend db={db} me={me} />
        <p className="sub-note">친구에게 링크를 알려주면, 이름만 입력하고 바로 참여할 수 있어요.</p>
      </section>
    </div>
  )
}
