import { useState } from 'react'
import { CaretLeft, CaretRight, CalendarBlank, CalendarDots } from '@phosphor-icons/react'
import { fmtRange, pad2 } from './utils.js'

// 홈의 메인 캘린더: 개인 일정이 아니라 확정된 "여행"을 일별 달력에 표시한다.
// 1단계 일정 조율에서 가는 날을 확정하면 여기 실제 날짜에 나타난다.
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export default function HomeCalendar({ db, onOpen }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  const [ym, setYm] = useState(todayStr.slice(0, 7))
  const [year, month] = ym.split('-').map(Number)

  const confirmedTrips = db.trips.filter((t) => t.confirmed_start)
  const undated = db.trips.filter((t) => !t.confirmed_start)
  const rangeEnd = (t) => t.confirmed_end || t.confirmed_start
  const tripsOnDay = (date) => confirmedTrips.filter((t) => date >= t.confirmed_start && date <= rangeEnd(t))

  const monthStart = `${ym}-01`
  const monthEnd = `${ym}-${pad2(new Date(year, month, 0).getDate())}`
  const thisMonthTrips = confirmedTrips
    .filter((t) => t.confirmed_start <= monthEnd && rangeEnd(t) >= monthStart)
    .sort((a, b) => a.confirmed_start.localeCompare(b.confirmed_start))

  const first = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const move = (d) => {
    const t = new Date(year, month - 1 + d, 1)
    setYm(`${t.getFullYear()}-${pad2(t.getMonth() + 1)}`)
  }

  return (
    <div className="tab-body">
      <p className="hint">
        <b>확정된 여행</b>이 날짜에 표시돼요. 아직 날짜를 안 정한 여행은 아래에서 <b>조율</b>할 수 있어요.
      </p>
      <div className="cal card">
        <div className="cal-head">
          <button onClick={() => move(-1)} aria-label="이전 달">
            <CaretLeft size={18} weight="bold" />
          </button>
          <b className="num">
            {year}년 {month}월
          </b>
          <button onClick={() => move(1)} aria-label="다음 달">
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
        <div className="cal-grid">
          {WEEK.map((w, i) => (
            <span key={w} className={'cal-week' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={'e' + i} />
            const date = `${ym}-${pad2(d)}`
            const list = tripsOnDay(date)
            const dow = i % 7
            return (
              <div
                key={date}
                className={
                  'cal-day home-day' +
                  (list.length ? ' has-trip' : '') +
                  (date === todayStr ? ' today' : '') +
                  (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '')
                }
                onClick={() => list.length && onOpen(list[0].id)}
                role={list.length ? 'button' : undefined}
              >
                <span className="d">{d}</span>
                <span className="day-trips">
                  {list.slice(0, 2).map((t) => (
                    <span key={t.id} className="day-trip-emoji">
                      {t.emoji}
                    </span>
                  ))}
                  {list.length > 2 && <em className="num">+{list.length - 2}</em>}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {thisMonthTrips.length > 0 && (
        <ul className="region-list">
          {thisMonthTrips.map((t) => (
            <li key={t.id} className="card region-item">
              <button className="region-name" onClick={() => onOpen(t.id)}>
                <span className="trip-chip-emoji">{t.emoji}</span>
                {t.title}
              </button>
              <small className="num">{fmtRange(t.confirmed_start, t.confirmed_end)}</small>
            </li>
          ))}
        </ul>
      )}

      {undated.length > 0 && (
        <div className="card undated-card">
          <b className="undated-title">
            <CalendarDots size={16} weight="duotone" />
            날짜 조율 중
          </b>
          <div className="undated-list">
            {undated.map((t) => (
              <button key={t.id} className="undated-row" onClick={() => onOpen(t.id)}>
                <span className="trip-chip-emoji">{t.emoji}</span>
                <b>{t.title}</b>
                <small>{t.start_month ? `${t.start_month.replace('-', '.')} 후보` : '시기 미정'}</small>
                <span className="undated-cta">조율하러 가기</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {db.trips.length === 0 && (
        <div className="empty card">
          <CalendarBlank size={30} weight="duotone" />
          <span>
            아직 여행이 없어요.
            <br />
            여행 탭에서 첫 여행을 만들어 보세요.
          </span>
        </div>
      )}
    </div>
  )
}
