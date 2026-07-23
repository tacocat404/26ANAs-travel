import { useState } from 'react'
import { store } from './store.js'
import CalendarTab from './CalendarTab.jsx'
import MapTab from './MapTab.jsx'
import NoticeTab from './NoticeTab.jsx'
import GalleryTab from './GalleryTab.jsx'

const TABS = [
  ['cal', '🗓️', '캘린더'],
  ['map', '🗺️', '지도'],
  ['notice', '📢', '공지'],
  ['gallery', '📷', '갤러리'],
]

export default function TripDetail({ db, me, trip, refresh, onDeleted }) {
  const [tab, setTab] = useState('cal')
  return (
    <main className="page">
      <nav className="tabs">
        {TABS.map(([k, icon, label]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'cal' && <CalendarTab db={db} me={me} trip={trip} refresh={refresh} />}
      {tab === 'map' && <MapTab db={db} me={me} trip={trip} refresh={refresh} />}
      {tab === 'notice' && <NoticeTab db={db} me={me} trip={trip} refresh={refresh} />}
      {tab === 'gallery' && <GalleryTab db={db} me={me} trip={trip} refresh={refresh} />}
      <button
        className="danger-link"
        onClick={async () => {
          if (confirm(`'${trip.title}' 여행을 삭제할까요?\n지도·공지·사진도 함께 삭제돼요.`)) {
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
