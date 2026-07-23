import { useState } from 'react'
import { CalendarBlank, MapPin, Megaphone, Images } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import CalendarTab from './CalendarTab.jsx'
import MapTab from './MapTab.jsx'
import NoticeTab from './NoticeTab.jsx'
import GalleryTab from './GalleryTab.jsx'

const TABS = [
  ['cal', '캘린더', CalendarBlank],
  ['map', '지도', MapPin],
  ['notice', '공지', Megaphone],
  ['gallery', '갤러리', Images],
]

export default function TripDetail({ db, me, trip, refresh, onDeleted }) {
  const [tab, setTab] = useState('cal')
  // 한 번 연 탭은 화면만 숨겨두고 유지한다. 지도 확대 상태, 캘린더 선택이 탭을 오가도 남는다.
  const [visited, setVisited] = useState(() => new Set(['cal']))
  const confirmDlg = useConfirm()

  const open = (k) => {
    setTab(k)
    setVisited((prev) => (prev.has(k) ? prev : new Set(prev).add(k)))
  }

  return (
    <main className="page">
      <nav className="tabs">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => open(k)}>
            <Icon size={18} weight={tab === k ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </nav>
      {visited.has('cal') && (
        <div hidden={tab !== 'cal'}>
          <CalendarTab db={db} me={me} trip={trip} refresh={refresh} />
        </div>
      )}
      {visited.has('map') && (
        <div hidden={tab !== 'map'}>
          <MapTab db={db} me={me} trip={trip} refresh={refresh} active={tab === 'map'} />
        </div>
      )}
      {visited.has('notice') && (
        <div hidden={tab !== 'notice'}>
          <NoticeTab db={db} me={me} trip={trip} refresh={refresh} />
        </div>
      )}
      {visited.has('gallery') && (
        <div hidden={tab !== 'gallery'}>
          <GalleryTab db={db} me={me} trip={trip} refresh={refresh} />
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
