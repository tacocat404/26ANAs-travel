import { AirplaneTilt, Confetti, CalendarBlank, Images } from '@phosphor-icons/react'
import TripList from './TripList.jsx'
import HomeCalendar from './HomeCalendar.jsx'
import HomeGallery from './HomeGallery.jsx'

const TABS = [
  ['ongoing', '진행 중', AirplaneTilt],
  ['done', '끝난 여행', Confetti],
  ['cal', '캘린더', CalendarBlank],
  ['gallery', '갤러리', Images],
]

// 홈(메인) 화면: 진행 중 여행 / 끝난 여행 / 여행 단위 캘린더 / 여행별 갤러리.
// 탭 상태는 App이 들고 있어 여행에 다녀와도 보던 탭이 유지된다.
export default function Home({ db, me, refresh, onOpen, tab, setTab }) {
  return (
    <main className="page">
      <nav className="tabs home-tabs">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
            <Icon size={18} weight={tab === k ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </nav>
      {tab === 'ongoing' && <TripList db={db} me={me} refresh={refresh} onOpen={onOpen} mode="ongoing" />}
      {tab === 'done' && <TripList db={db} me={me} refresh={refresh} onOpen={onOpen} mode="done" />}
      {tab === 'cal' && <HomeCalendar db={db} onOpen={onOpen} />}
      {tab === 'gallery' && <HomeGallery db={db} me={me} refresh={refresh} onOpen={onOpen} />}
    </main>
  )
}
