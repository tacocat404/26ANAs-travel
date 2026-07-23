import { useEffect, useMemo, useState } from 'react'
import { CaretLeft, CaretRight, Confetti } from '@phosphor-icons/react'
import { store } from './store.js'
import { memberById } from './utils.js'
import MemberLegend from './MemberLegend.jsx'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const p2 = (n) => String(n).padStart(2, '0')

export default function CalendarTab({ db, me, trip, refresh }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${p2(today.getMonth() + 1)}-${p2(today.getDate())}`
  const thisMonth = todayStr.slice(0, 7)
  const [ym, setYm] = useState(trip.start_month || thisMonth)
  const [selected, setSelected] = useState(null)
  // 낙관적 업데이트: 서버 응답을 기다리지 않고 내 표시를 즉시 화면에 반영한다.
  // { 날짜: true/false } 형태의 임시 덮어쓰기이며, 새 데이터가 오면 비운다.
  const [pending, setPending] = useState({})
  const [year, month] = ym.split('-').map(Number)

  useEffect(() => {
    setPending({})
  }, [db.unavailable])

  // 날짜별로 "안 되는 사람" 목록을 미리 모아둔다.
  const busy = useMemo(() => {
    const map = {}
    for (const u of db.unavailable) (map[u.date] ||= []).push(u.member_id)
    return map
  }, [db.unavailable])

  // pending을 적용한 최종 목록 (내 표시만 임시 반영)
  const busyOn = (date) => {
    const list = busy[date] || []
    if (!(date in pending)) return list
    const withoutMe = list.filter((id) => id !== me.id)
    return pending[date] ? [...withoutMe, me.id] : withoutMe
  }

  const first = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const move = (d) => {
    const t = new Date(year, month - 1 + d, 1)
    setYm(`${t.getFullYear()}-${p2(t.getMonth() + 1)}`)
    setSelected(null)
  }

  const tapDay = (date) => {
    setSelected(date)
    const mineNow = busyOn(date).includes(me.id)
    setPending((p) => ({ ...p, [date]: !mineNow }))
    store
      .toggleUnavailable(me.id, date)
      .then(refresh)
      .catch(() => setPending((p) => ({ ...p, [date]: mineNow })))
  }

  // 이번 달에서 "모두 갈 수 있는 주말"(토+일 모두 아무도 표시 안 함)을 찾는다.
  const freeWeekends = useMemo(() => {
    if (db.members.length < 2) return null
    const out = []
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month - 1, d).getDay() !== 6) continue
      const sat = `${year}-${p2(month)}-${p2(d)}`
      if (sat < todayStr) continue
      const sun = new Date(year, month - 1, d + 1)
      const sunStr = `${sun.getFullYear()}-${p2(sun.getMonth() + 1)}-${p2(sun.getDate())}`
      if ((busy[sat] || []).length === 0 && (busy[sunStr] || []).length === 0) {
        out.push({ sat, day: d, sunDay: sun.getDate() })
      }
    }
    return out
  }, [db.members.length, busy, year, month, daysInMonth, todayStr])

  const selBusy = selected ? busyOn(selected) : null
  const selMine = selected ? selBusy.includes(me.id) : false
  const monthInPast = ym < thisMonth

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
            const list = busyOn(date)
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
                aria-pressed={mine}
                aria-label={`${month}월 ${d}일 ${WEEK[dow]}요일${mine ? ', 내가 안 되는 날' : ''}${
                  list.length ? `, 안 되는 사람 ${list.length}명` : ''
                }`}
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
          {selMine && <p className="day-mine">내가 안 되는 날로 표시했어요. 날짜를 다시 탭하면 취소돼요.</p>}
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

      {freeWeekends && !monthInPast && (
        <div className="card reco-card">
          <b className="reco-title">
            <Confetti size={17} weight="duotone" />
            모두 갈 수 있는 주말
          </b>
          {freeWeekends.length === 0 ? (
            <p className="reco-none">이번 달엔 모두 되는 주말이 없어요. 다른 달을 넘겨보세요.</p>
          ) : (
            <div className="reco-row">
              {freeWeekends.map((w) => (
                <button key={w.sat} className="day-chip num" onClick={() => setSelected(w.sat)}>
                  {month}.{p2(w.day)}(토)~{w.sunDay}(일)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card legend-card">
        <MemberLegend db={db} me={me} />
      </div>
    </div>
  )
}
