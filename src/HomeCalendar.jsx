import { useState } from 'react'
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react'

// 홈의 메인 캘린더: 개인 일정이 아니라 "여행" 단위로 본다.
// 여행의 후보 시기가 월 단위라서 1년 12칸에 여행 칩을 얹는 연간 뷰.
const p2 = (n) => String(n).padStart(2, '0')
const inMonth = (t, ym) => t.start_month && ym >= t.start_month && ym <= (t.end_month || t.start_month)

function TripChip({ trip, onOpen }) {
  return (
    <button className="trip-chip" onClick={() => onOpen(trip.id)}>
      <span className="trip-chip-emoji">{trip.emoji}</span>
      <span className="trip-chip-name">{trip.title}</span>
    </button>
  )
}

export default function HomeCalendar({ db, onOpen }) {
  const now = new Date()
  const thisYm = `${now.getFullYear()}-${p2(now.getMonth() + 1)}`
  const [year, setYear] = useState(now.getFullYear())
  const undated = db.trips.filter((t) => !t.start_month)

  return (
    <div className="tab-body">
      <p className="hint">
        여행이 <b>후보 시기</b>에 맞춰 달력에 표시돼요. 여행을 탭하면 그 여행으로 이동해요.
      </p>
      <div className="card year-cal">
        <div className="cal-head">
          <button onClick={() => setYear((y) => y - 1)} aria-label="이전 해">
            <CaretLeft size={18} weight="bold" />
          </button>
          <b className="num">{year}년</b>
          <button onClick={() => setYear((y) => y + 1)} aria-label="다음 해">
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
        <div className="year-grid">
          {Array.from({ length: 12 }, (_, i) => {
            const ym = `${year}-${p2(i + 1)}`
            const list = db.trips.filter((t) => inMonth(t, ym))
            return (
              <div key={ym} className={'month-cell' + (ym === thisYm ? ' now' : '')}>
                <span className="month-name num">{i + 1}월</span>
                {list.map((t) => (
                  <TripChip key={t.id} trip={t} onOpen={onOpen} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {undated.length > 0 && (
        <div className="card undated-card">
          <b className="undated-title">시기 미정</b>
          <div className="reco-row">
            {undated.map((t) => (
              <TripChip key={t.id} trip={t} onOpen={onOpen} />
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
