import { useState } from 'react'
import { Megaphone } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { tripStage } from './utils.js'
import StageStepper from './StageStepper.jsx'
import CalendarTab from './CalendarTab.jsx'
import MapTab from './MapTab.jsx'
import NoticeTab from './NoticeTab.jsx'
import GalleryTab from './GalleryTab.jsx'

// 여행 상세: 단계 흐름(1 일정조율 → 2 세부일정 → 3 추억정리) + 공지 상시 접근.
export default function TripDetail({ db, me, trip, refresh, onDeleted }) {
  const suggested = tripStage(trip)
  const suggestedKey = ['schedule', 'plan', 'memory'][suggested - 1]
  const [view, setView] = useState(suggestedKey)
  // 한 번 연 화면은 숨겨두고 유지한다. 지도 확대 상태, 캘린더 선택이 단계를 오가도 남는다.
  const [visited, setVisited] = useState(() => new Set([suggestedKey]))
  const confirmDlg = useConfirm()

  const go = (k) => {
    setView(k)
    setVisited((prev) => (prev.has(k) ? prev : new Set(prev).add(k)))
  }

  const noticeCount = db.notices.filter((n) => n.trip_id === trip.id).length

  return (
    <main className="page">
      <div className="stage-nav">
        <StageStepper view={view} suggested={suggested} onGo={go} />
        <button className={'notice-access' + (view === 'notice' ? ' on' : '')} onClick={() => go('notice')}>
          <Megaphone size={17} weight={view === 'notice' ? 'fill' : 'regular'} />
          공지
          {noticeCount > 0 && <span className="notice-count num">{noticeCount}</span>}
        </button>
      </div>

      {visited.has('schedule') && (
        <div hidden={view !== 'schedule'}>
          <CalendarTab db={db} me={me} trip={trip} refresh={refresh} />
        </div>
      )}
      {visited.has('plan') && (
        <div hidden={view !== 'plan'}>
          <MapTab db={db} me={me} trip={trip} refresh={refresh} active={view === 'plan'} />
        </div>
      )}
      {visited.has('memory') && (
        <div hidden={view !== 'memory'}>
          <GalleryTab db={db} me={me} trip={trip} refresh={refresh} />
        </div>
      )}
      {visited.has('notice') && (
        <div hidden={view !== 'notice'}>
          <NoticeTab db={db} me={me} trip={trip} refresh={refresh} />
        </div>
      )}

      <button
        className="danger-link"
        onClick={async () => {
          if (
            await confirmDlg(`'${trip.title}' 여행을 삭제할까요?\n지도의 후보지·공지·사진도 함께 삭제돼요.`, {
              okLabel: '삭제',
              danger: true,
            })
          ) {
            await store.removeTrip(trip.id)
            onDeleted()
            refresh()
          }
        }}
      >
        이 여행 삭제
      </button>
    </main>
  )
}
