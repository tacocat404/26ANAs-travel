import { useState } from 'react'
import { CalendarBlank, MapPin, Megaphone, Images } from '@phosphor-icons/react'
import { store } from './store.js'
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
  return (
    <main className="page">
      <nav className="tabs">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            <Icon size={18} weight={tab === k ? 'fill' : 'regular'} />
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
