import {
  Plus,
  CaretRight,
  CalendarBlank,
  Images,
  Megaphone,
  Confetti,
  AirplaneTilt,
} from '@phosphor-icons/react'
import { tripStage, fmtRange, memberById, allFreeDays, fmtDate, tripStatus } from './utils.js'

// 한 화면에 모든 걸 분류해 보여주는 홈 대시보드(포털).
// 대표 여행 + 요약 통계 + 섹션 패널(진행 중 / 최근 공지 / 갤러리 / 추억).
// 각 섹션의 "더보기"로 상세 탭으로 이동한다.
const statusOf = (t) => tripStatus(t, { withDone: true })

export default function HomeDashboard({ db, me, setTab, onOpen }) {
  const coverOf = (tid) => {
    const ps = db.photos
      .filter((p) => p.trip_id === tid)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return ps[0]?.data_url || null
  }
  const graded = db.trips.map((t) => ({ t, stage: tripStage(t) }))
  const ongoing = graded.filter((x) => x.stage !== 3).map((x) => x.t)
  const done = graded
    .filter((x) => x.stage === 3)
    .map((x) => x.t)
    .sort((a, b) => (b.confirmed_end || b.confirmed_start || '').localeCompare(a.confirmed_end || a.confirmed_start || ''))

  // 대표 여행: 확정·미도래(임박순) → 조율 중(최근) → 추억(최근)
  const featured =
    ongoing
      .filter((t) => t.confirmed_start)
      .sort((a, b) => a.confirmed_start.localeCompare(b.confirmed_start))[0] ||
    ongoing.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0] ||
    done[0] ||
    null

  const recentPhotos = [...db.photos]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 8)
  const recentNotices = [...db.notices]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 4)
  const tripById = (id) => db.trips.find((t) => t.id === id)

  const ongoingSorted = [...ongoing].sort((a, b) => {
    const rank = (t) => (tripStage(t) === 2 ? 0 : 1)
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    if (tripStage(a) === 2) return a.confirmed_start.localeCompare(b.confirmed_start)
    return (b.created_at || '').localeCompare(a.created_at || '')
  })

  const cover = featured ? coverOf(featured.id) : null
  const fst = featured ? statusOf(featured) : null
  const freeDays = allFreeDays(db, 4)

  return (
    <div className="dash">
      {/* ── 대표 여행 히어로 ── */}
      {featured ? (
        <button className="card dash-hero" onClick={() => onOpen(featured.id)}>
          <span
            className="dash-hero-photo"
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
          >
            {!cover && <span className="dash-hero-emoji">{featured.emoji}</span>}
          </span>
          <span className="dash-hero-body">
            <span className={'trip-status ' + fst.kind + (fst.num ? ' num' : '')}>{fst.label}</span>
            <b className="dash-hero-title">
              {featured.emoji} {featured.title}
            </b>
            <small className="num">
              <CalendarBlank size={13} />
              {featured.confirmed_start
                ? fmtRange(featured.confirmed_start, featured.confirmed_end)
                : featured.start_month
                ? `${featured.start_month.replace('-', '.')} 즈음`
                : '아직 날짜 조율 중'}
            </small>
            <span className="dash-hero-cta hand">이 여행 열어보기 →</span>
          </span>
        </button>
      ) : (
        <div className="card dash-empty-hero">
          <AirplaneTilt size={34} weight="duotone" />
          <b>아직 여행이 없어요</b>
          <span>친구들과 갈 첫 여행을 만들어 보세요.</span>
          <button className="primary accent" onClick={() => setTab('ongoing')}>
            <Plus size={15} weight="bold" />새 여행 만들기
          </button>
        </div>
      )}

      {/* ── 모두 되는 날 (이 앱의 핵심 가치) ── */}
      {freeDays.length > 0 && (
        <div className="card dash-free">
          <span className="dash-free-head hand">다 같이 되는 날</span>
          <div className="dash-free-days">
            {freeDays.map((d) => (
              <button key={d} className="dash-free-day num" onClick={() => setTab('cal')}>
                {fmtDate(d).slice(5)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 요약 통계 ── */}
      <div className="dash-stats card">
        <Stat n={ongoing.length} label="진행 중" onClick={() => setTab('ongoing')} />
        <Stat n={done.length} label="다녀온 여행" onClick={() => setTab('done')} />
        <Stat n={db.photos.length} label="사진" onClick={() => setTab('gallery')} />
        <Stat n={db.members.length} label="친구" />
      </div>

      {/* ── 섹션 패널 (분류) ── */}
      <div className="dash-grid">
        {/* 진행 중 여행 */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <span className="dash-kicker hand">지금 계획 중</span>
            <b>진행 중 여행</b>
            <button className="dash-more" onClick={() => setTab('ongoing')}>
              더보기 <CaretRight size={13} weight="bold" />
            </button>
          </div>
          {ongoingSorted.length === 0 ? (
            <button className="dash-add-row" onClick={() => setTab('ongoing')}>
              <Plus size={15} weight="bold" />새 여행 만들기
            </button>
          ) : (
            <div className="dash-list">
              {ongoingSorted.slice(0, 3).map((t) => {
                const st = statusOf(t)
                return (
                  <button key={t.id} className="dash-trip" onClick={() => onOpen(t.id)}>
                    <span className="dash-trip-emoji">{t.emoji}</span>
                    <span className="dash-trip-body">
                      <b>{t.title}</b>
                      <small className="num">
                        {t.confirmed_start ? fmtRange(t.confirmed_start, t.confirmed_end) : '날짜 조율 중'}
                      </small>
                    </span>
                    <span className={'trip-status ' + st.kind + (st.num ? ' num' : '')}>{st.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* 최근 공지 */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <span className="dash-kicker hand">friends talk</span>
            <b>최근 공지</b>
          </div>
          {recentNotices.length === 0 ? (
            <p className="dash-empty-note">아직 공지가 없어요.</p>
          ) : (
            <div className="dash-list">
              {recentNotices.map((n) => {
                const author = memberById(db, n.member_id)
                const t = tripById(n.trip_id)
                return (
                  <button key={n.id} className="dash-notice" onClick={() => t && onOpen(t.id)}>
                    <span className="av blob" style={{ background: author?.color || 'var(--sub)' }} />
                    <span className="dash-notice-body">
                      <span className="dash-notice-text">{n.content}</span>
                      <small>
                        {author?.name || '알 수 없음'}
                        {t ? ` · ${t.emoji} ${t.title}` : ''}
                      </small>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* 갤러리 */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <span className="dash-kicker hand">우리 사진</span>
            <b>갤러리</b>
            <button className="dash-more" onClick={() => setTab('gallery')}>
              더보기 <CaretRight size={13} weight="bold" />
            </button>
          </div>
          {recentPhotos.length === 0 ? (
            <p className="dash-empty-note">아직 사진이 없어요.</p>
          ) : (
            <div className="dash-photos">
              {recentPhotos.map((p) => (
                <button key={p.id} className="dash-photo" onClick={() => setTab('gallery')}>
                  <img src={p.data_url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 추억 (끝난 여행) */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <span className="dash-kicker hand">다녀온 곳</span>
            <b>추억</b>
            <button className="dash-more" onClick={() => setTab('done')}>
              더보기 <CaretRight size={13} weight="bold" />
            </button>
          </div>
          {done.length === 0 ? (
            <p className="dash-empty-note">
              <Confetti size={16} weight="duotone" /> 여행을 다녀오면 여기에 모여요.
            </p>
          ) : (
            <div className="dash-memories">
              {done.slice(0, 3).map((t) => {
                const c = coverOf(t.id)
                return (
                  <button key={t.id} className="dash-memory" onClick={() => onOpen(t.id)}>
                    <span
                      className="dash-memory-cover"
                      style={c ? { backgroundImage: `url(${c})` } : undefined}
                    >
                      {!c && <span>{t.emoji}</span>}
                    </span>
                    <b>{t.title}</b>
                    <small className="num">{fmtRange(t.confirmed_start, t.confirmed_end)}</small>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ n, label, onClick }) {
  const El = onClick ? 'button' : 'div'
  return (
    <El className="dash-stat" onClick={onClick}>
      <b className="num">{n}</b>
      <small>{label}</small>
    </El>
  )
}
