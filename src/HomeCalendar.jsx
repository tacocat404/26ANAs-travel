import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight, CalendarBlank, CalendarDots, Plus, X, ArrowsClockwise } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { fmtRange, fmtDate, pad2, memberById, memberName, monthGrid, shiftMonth, todayStr as getToday } from './utils.js'
import EmojiPicker from './EmojiPicker.jsx'

// 홈의 메인 캘린더: 확정된 "여행" + 우리끼리 정해둔 "이런 날"을 한 달 그리드에 함께 본다.
// 날짜를 누르면 그날 패널이 열려 라벨을 붙이거나(생일·시험 끝 등) 안 되는 날을 표시할 수 있다.
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

// 자주 쓰는 날 — 한 번 눌러 바로 채운다.
const PRESETS = [
  ['🎂', '생일'],
  ['📚', '시험 끝'],
  ['💰', '월급날'],
  ['😴', '쉬는 날'],
  ['✈️', '출발'],
  ['🍻', '모임'],
  ['🎓', '졸업'],
  ['❤️', '기념일'],
]

export default function HomeCalendar({ db, me, refresh, onOpen }) {
  const todayStr = getToday()
  const [ym, setYm] = useState(todayStr.slice(0, 7))
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [emoji, setEmoji] = useState('🎂')
  const [text, setText] = useState('')
  const [yearly, setYearly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [year, month] = ym.split('-').map(Number)
  const confirmDlg = useConfirm()

  const notes = db.day_notes || []
  const confirmedTrips = db.trips.filter((t) => t.confirmed_start)
  const undated = db.trips.filter((t) => !t.confirmed_start)
  const rangeEnd = (t) => t.confirmed_end || t.confirmed_start
  const tripsOnDay = (date) => confirmedTrips.filter((t) => date >= t.confirmed_start && date <= rangeEnd(t))

  // 매년 반복 라벨은 월·일만 같으면 그 해에도 나타난다.
  const notesOnDay = (date) =>
    notes.filter((n) => n.date === date || (n.repeat_yearly && n.date.slice(5) === date.slice(5)))

  // 그날 안 되는 사람
  const busy = useMemo(() => {
    const map = {}
    for (const u of db.unavailable) (map[u.date] ||= []).push(u.member_id)
    return map
  }, [db.unavailable])

  const monthStart = `${ym}-01`
  const monthEnd = `${ym}-${pad2(new Date(year, month, 0).getDate())}`
  const thisMonthTrips = confirmedTrips
    .filter((t) => t.confirmed_start <= monthEnd && rangeEnd(t) >= monthStart)
    .sort((a, b) => a.confirmed_start.localeCompare(b.confirmed_start))

  const { days: daysInMonth, cells } = monthGrid(ym)

  // 이 달에 있는 라벨 (반복 포함) — 아래 목록용
  const monthNotes = useMemo(() => {
    const out = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${ym}-${pad2(d)}`
      for (const n of notesOnDay(date)) out.push({ ...n, on: date })
    }
    return out
  }, [notes, ym, daysInMonth])

  // 빠르게 여러 번 눌러도 누른 만큼 넘어가도록 이전 값에서 계산한다.
  const move = (d) => {
    setYm((cur) => shiftMonth(cur, d))
    setSelected(null)
    setAdding(false)
  }

  const openDay = (date) => {
    setSelected((cur) => (cur === date ? null : date))
    setAdding(false)
    setText('')
  }

  const usePreset = ([e2, label]) => {
    setEmoji(e2)
    setText(label)
    setYearly(e2 === '🎂' || e2 === '❤️' || e2 === '🎓') // 생일·기념일·졸업은 보통 매년
  }

  const saveNote = async (e) => {
    e?.preventDefault()
    if (!text.trim() || !selected || saving) return
    setSaving(true)
    try {
      await store.addDayNote({
        date: selected,
        emoji,
        text: text.trim(),
        repeat_yearly: yearly,
        member_id: me.id,
      })
      setAdding(false)
      setText('')
      setYearly(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  const delNote = async (n) => {
    if (await confirmDlg(`'${n.text}'을(를) 지울까요?`, { okLabel: '삭제', danger: true })) {
      await store.removeDayNote(n.id)
      refresh()
    }
  }

  const toggleMine = async (date) => {
    await store.toggleUnavailable(me.id, date)
    refresh()
  }

  const selTrips = selected ? tripsOnDay(selected) : []
  const selNotes = selected ? notesOnDay(selected) : []
  const selBusy = selected ? busy[selected] || [] : []
  const selMine = selBusy.includes(me.id)

  return (
    <div className="tab-body">
      <p className="hint">
        날짜를 누르면 <b>이런 날이에요</b>를 붙일 수 있어요 (생일·시험 끝·월급날 등). 확정된 여행도 함께 보여요.
      </p>
      {db.day_notes_local && (
        <p className="hint warn">
          지금 날짜 라벨은 <b>이 기기에만</b> 저장돼요. 친구들과 함께 보려면 관리자가 <b>docs/SETUP.md 5단계</b>를
          한 번 실행하면 돼요.
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
            const date = `${ym}-${pad2(d)}`
            const list = tripsOnDay(date)
            const dayNotes = notesOnDay(date)
            const dow = i % 7
            return (
              <button
                key={date}
                className={
                  'cal-day home-day' +
                  (list.length ? ' has-trip' : '') +
                  (selected === date ? ' sel' : '') +
                  (date === todayStr ? ' today' : '') +
                  (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '')
                }
                onClick={() => openDay(date)}
                aria-pressed={selected === date}
                aria-label={`${month}월 ${d}일 ${WEEK[dow]}요일${
                  list.length ? `, 여행 ${list.map((t) => t.title).join(', ')}` : ''
                }${dayNotes.length ? `, ${dayNotes.map((n) => n.text).join(', ')}` : ''}`}
              >
                <span className="d">{d}</span>
                <span className="day-trips">
                  {list.slice(0, 2).map((t) => (
                    <span key={t.id} className="day-trip-emoji">
                      {t.emoji}
                    </span>
                  ))}
                  {dayNotes.slice(0, 2).map((n) => (
                    <span key={n.id} className="day-note-emoji">
                      {n.emoji}
                    </span>
                  ))}
                  {list.length + dayNotes.length > 2 && <em className="num">+</em>}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="card day-panel">
          <div className="day-panel-head">
            <b className="num">{fmtDate(selected)}</b>
            <button className="x" onClick={() => setSelected(null)} aria-label="닫기">
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* 그날 확정된 여행 */}
          {selTrips.map((t) => (
            <button key={t.id} className="day-trip-row" onClick={() => onOpen(t.id)}>
              <span className="trip-chip-emoji">{t.emoji}</span>
              <b>{t.title}</b>
              <small>여행 중인 날</small>
              <span className="undated-cta">열어보기</span>
            </button>
          ))}

          {/* 이런 날이에요 목록 */}
          {selNotes.length > 0 && (
            <ul className="note-list">
              {selNotes.map((n) => (
                <li key={n.id} className="note-item">
                  <span className="note-emoji">{n.emoji}</span>
                  <b>{n.text}</b>
                  {n.repeat_yearly && (
                    <em className="note-repeat">
                      <ArrowsClockwise size={11} weight="bold" />
                      매년
                    </em>
                  )}
                  {n.member_id && <small>{memberName(db, n.member_id)}</small>}
                  {n.member_id === me.id && (
                    <button className="x" onClick={() => delNote(n)} aria-label="지우기">
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* 안 되는 사람 */}
          {selBusy.length > 0 && (
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

          {!adding ? (
            <div className="reco-row">
              <button className="primary small accent" onClick={() => setAdding(true)}>
                <Plus size={14} weight="bold" />
                이런 날이에요
              </button>
              <button
                className={selMine ? 'ghost small' : 'ghost small'}
                style={selMine ? { '--c': me.color, borderColor: me.color } : undefined}
                onClick={() => toggleMine(selected)}
              >
                {selMine ? '안 되는 날 취소' : '나는 이 날 안 돼요'}
              </button>
            </div>
          ) : (
            <form className="note-form" onSubmit={saveNote}>
              <div className="reco-row">
                {PRESETS.map((p) => (
                  <button key={p[1]} type="button" className="day-chip" onClick={() => usePreset(p)}>
                    {p[0]} {p[1]}
                  </button>
                ))}
              </div>
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="어떤 날인가요? (예: 유노 생일)"
                maxLength={20}
                autoFocus
              />
              <label className="note-repeat-check">
                <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
                매년 이 날 반복 (생일·기념일)
              </label>
              <div className="row">
                <button className="primary" disabled={!text.trim() || saving}>
                  {saving ? '저장 중' : '이 날로 저장'}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setAdding(false)
                    setText('')
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 이 달의 "이런 날" 목록 */}
      {monthNotes.length > 0 && (
        <div className="card undated-card">
          <b className="undated-title">
            <CalendarDots size={16} weight="duotone" />이 달의 기억할 날
          </b>
          <div className="undated-list">
            {monthNotes.map((n) => (
              <button key={n.id + n.on} className="undated-row" onClick={() => openDay(n.on)}>
                <span className="trip-chip-emoji">{n.emoji}</span>
                <b>{n.text}</b>
                <small className="num">{Number(n.on.slice(8))}일</small>
                {n.repeat_yearly && (
                  <em className="note-repeat">
                    <ArrowsClockwise size={11} weight="bold" />
                    매년
                  </em>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {db.trips.length === 0 && monthNotes.length === 0 && (
        <div className="empty card">
          <CalendarBlank size={30} weight="duotone" />
          <span>
            아직 여행이 없어요.
            <br />
            날짜를 눌러 <b>기억할 날</b>을 먼저 적어둘 수도 있어요.
          </span>
        </div>
      )}
    </div>
  )
}
