import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { store } from './store.js'
import { memberById } from './utils.js'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const p2 = (n) => String(n).padStart(2, '0')

export default function CalendarTab({ db, me, trip, refresh }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${p2(today.getMonth() + 1)}-${p2(today.getDate())}`
  const thisMonth = todayStr.slice(0, 7)
  const [ym, setYm] = useState(trip.start_month || thisMonth)
  const [selected, setSelected] = useState(null)
  const [year, month] = ym.split('-').map(Number)

  // 날짜별로 "안 되는 사람" 목록을 미리 모아둔다.
  const busy = useMemo(() => {
    const map = {}
    for (const u of db.unavailable) (map[u.date] ||= []).push(u.member_id)
    return map
  }, [db.unavailable])

  const first = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const move = (d) => {
    const t = new Date(year, month - 1 + d, 1)
    setYm(`${t.getFullYear()}-${p2(t.getMonth() + 1)}`)
    setSelected(null)
  }

  const tapDay = async (date) => {
    setSelected(date)
    await store.toggleUnavailable(me.id, date)
    refresh()
  }

  const selBusy = selected ? busy[selected] || [] : null

  return (
    <div className="tab-body">
      <p className="hint">
        날짜를 탭하면 <b>내가 안 되는 날</b>로 표시돼요. 다시 탭하면 취소되고, 친구들이 안 되는 날은 색깔 점으로
        보여요.
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
            const date = `${year}-${p2(month)}-${p2(d)}`
            const list = busy[date] || []
            const mine = list.includes(me.id)
            const dow = i % 7
            return (
              <button
                key={date}
                className={
                  'cal-day' +
                  (mine ? ' mine' : '') +
                  (selected === date ? ' sel' : '') +
                  (date === todayStr ? ' today' : '') +
                  (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '')
                }
                style={mine ? { '--c': me.color } : undefined}
                onClick={() => tapDay(date)}
              >
                <span className="d">{d}</span>
                <span className="dots">
                  {list.slice(0, 4).map((id) => (
                    <i key={id} style={{ background: memberById(db, id)?.color }} />
                  ))}
                  {list.length > 4 && <em>+</em>}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="card day-panel">
          <b className="num">{selected.replaceAll('-', '.')}</b>
          {selBusy.length === 0 ? (
            <p>이 날은 모두 갈 수 있어요!</p>
          ) : (
            <p className="pill-row">
              안 되는 사람:{' '}
              {selBusy.map((id) => {
                const m = memberById(db, id)
                return (
                  <span key={id} className="pill" style={{ '--c': m?.color }}>
                    {m?.name}
                    {id === me.id ? ' (나)' : ''}
                  </span>
                )
              })}
            </p>
          )}
        </div>
      )}

      <div className="card legend-card">
        <div className="legend">
          {db.members.map((m) => (
            <span key={m.id} className="legend-item">
              <i style={{ background: m.color }} />
              {m.name}
              {m.id === me.id ? ' (나)' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
