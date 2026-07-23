import { useEffect, useMemo, useState } from 'react'
import { CaretLeft, CaretRight, Confetti, CalendarCheck, ArrowCounterClockwise } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberById, fmtRange, fmtDate } from './utils.js'
import MemberLegend from './MemberLegend.jsx'

// 1단계 일정 조율: 각자 안 되는 날을 표시하고, 모두 되는 날짜를 골라 "가는 날"로 확정한다.
const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const p2 = (n) => String(n).padStart(2, '0')

export default function CalendarTab({ db, me, trip, refresh }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${p2(today.getMonth() + 1)}-${p2(today.getDate())}`
  const thisMonth = todayStr.slice(0, 7)
  const [ym, setYm] = useState(trip.start_month || thisMonth)
  const [selected, setSelected] = useState(null)
  // 낙관적 업데이트: 서버 응답을 기다리지 않고 내 표시를 즉시 화면에 반영한다.
  const [pending, setPending] = useState({})
  const [year, month] = ym.split('-').map(Number)
  const confirmDlg = useConfirm()

  const confirmed = !!trip.confirmed_start

  useEffect(() => {
    setPending({})
  }, [db.unavailable])

  const busy = useMemo(() => {
    const map = {}
    for (const u of db.unavailable) (map[u.date] ||= []).push(u.member_id)
    return map
  }, [db.unavailable])

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

  // 가는 날 확정 / 해제
  const setDates = async (start, end, ask) => {
    if (ask && !(await confirmDlg(`${fmtRange(start, end)}\n이 날짜로 확정할까요?`, { okLabel: '확정' }))) return
    await store.setTripDates(trip.id, { confirmed_start: start, confirmed_end: end })
    refresh()
  }
  const clearDates = async () => {
    if (await confirmDlg('확정된 날짜를 지우고 다시 조율할까요?', { okLabel: '다시 조율', danger: true })) {
      await store.setTripDates(trip.id, { confirmed_start: null, confirmed_end: null })
      refresh()
    }
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
        out.push({ sat, sun: sunStr, day: d, sunDay: sun.getDate() })
      }
    }
    return out
  }, [db.members.length, busy, year, month, daysInMonth, todayStr])

  const selBusy = selected ? busyOn(selected) : null
  const selMine = selected ? selBusy.includes(me.id) : false
  const monthInPast = ym < thisMonth
  const inTrip = (date) =>
    confirmed && date >= trip.confirmed_start && date <= (trip.confirmed_end || trip.confirmed_start)

  return (
    <div className="tab-body">
      {confirmed ? (
        <div className="card confirmed-card">
          <div className="confirmed-main">
            <CalendarCheck size={22} weight="fill" />
            <div>
              <small>가는 날 확정</small>
              <b className="num">{fmtRange(trip.confirmed_start, trip.confirmed_end)}</b>
            </div>
          </div>
          <button className="ghost small" onClick={clearDates}>
            <ArrowCounterClockwise size={14} weight="bold" />
            다시 조율
          </button>
        </div>
      ) : (
        <p className="hint">
          날짜를 탭해 <b>내가 안 되는 날</b>을 표시하고, 모두 되는 날을 골라 아래에서 <b>가는 날로 확정</b>하면
          2단계로 넘어가요.
        </p>
      )}

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
                  (inTrip(date) ? ' trip-day' : '') +
                  (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '')
                }
                style={mine ? { '--c': me.color } : undefined}
                aria-pressed={mine}
                aria-label={`${month}월 ${d}일 ${WEEK[dow]}요일${inTrip(date) ? ', 가는 날' : ''}${
                  mine ? ', 내가 안 되는 날' : ''
                }${list.length ? `, 안 되는 사람 ${list.length}명` : ''}`}
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
          <b className="num">{fmtDate(selected)}</b>
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
          <div className="reco-row">
            {!confirmed && (
              <button className="primary small" onClick={() => setDates(selected, selected, true)}>
                <CalendarCheck size={14} weight="bold" />이 날로 확정
              </button>
            )}
            {confirmed && !inTrip(selected) && (
              <button className="ghost small" onClick={() => setDates(selected, selected, true)}>
                이 날짜로 변경
              </button>
            )}
            {confirmed && selected > trip.confirmed_start && (
              <button className="ghost small" onClick={() => setDates(trip.confirmed_start, selected, true)}>
                {fmtDate(trip.confirmed_start).slice(5)}부터 여기까지
              </button>
            )}
          </div>
        </div>
      )}

      {!confirmed && freeWeekends && !monthInPast && (
        <div className="card reco-card">
          <b className="reco-title">
            <Confetti size={17} weight="duotone" />
            모두 갈 수 있는 주말
          </b>
          {freeWeekends.length === 0 ? (
            <p className="reco-none">이번 달엔 모두 되는 주말이 없어요. 다른 달을 넘겨보세요.</p>
          ) : (
            <>
              <p className="reco-none">마음에 드는 주말을 탭하면 가는 날로 확정돼요.</p>
              <div className="reco-row">
                {freeWeekends.map((w) => (
                  <button key={w.sat} className="day-chip num" onClick={() => setDates(w.sat, w.sun, true)}>
                    {month}.{p2(w.day)}(토)~{w.sunDay}(일)
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="card legend-card">
        <MemberLegend db={db} me={me} />
      </div>
    </div>
  )
}
