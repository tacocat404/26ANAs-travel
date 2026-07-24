import { useCallback, useEffect, useState } from 'react'
import { AirplaneTilt, CaretLeft, GearSix } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import Landing from './Landing.jsx'
import Gate from './Gate.jsx'
import Login from './Login.jsx'
import Home from './Home.jsx'
import TripDetail from './TripDetail.jsx'
import AdminPanel from './AdminPanel.jsx'

const ME_KEY = 'trip-cal-me'
const ENTERED_KEY = 'trip-cal-entered' // 입장 코드를 한 번 맞히면 이 기기에선 다시 안 물음

export default function App() {
  const [db, setDb] = useState(null)
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const [meId, setMeId] = useState(localStorage.getItem(ME_KEY) || '')
  const [view, setView] = useState({ page: 'home', tripId: null })
  const [homeTab, setHomeTab] = useState('ongoing')
  const [entered, setEntered] = useState(localStorage.getItem(ENTERED_KEY) === '1')
  const [gateOpen, setGateOpen] = useState(false) // 랜딩 → 입장 코드
  const [adminGate, setAdminGate] = useState(false) // 관리자 PIN 입력 중
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminView, setAdminView] = useState(false)
  const [showIntro, setShowIntro] = useState(false) // 앱 안에서 소개 화면 다시보기
  const confirmDlg = useConfirm()

  const refresh = useCallback(async () => {
    try {
      setDb(await store.getAll())
      setError('')
    } catch (e) {
      console.error(e)
      setError('데이터를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')
    }
  }, [])

  const refreshSettings = useCallback(async () => {
    try {
      setSettings(await store.getSettings())
    } catch {
      setSettings({})
    }
  }, [])

  useEffect(() => {
    refresh()
    refreshSettings()
  }, [refresh, refreshSettings])

  useEffect(() => {
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  if (error && !db) return <div className="loading">{error}</div>
  if (!db || !settings) return <div className="loading">불러오는 중…</div>

  // 1) 입장 전: 소개 랜딩 → 입장 코드
  if (!entered) {
    if (!gateOpen) return <Landing onStart={() => setGateOpen(true)} />
    return (
      <Gate
        title="입장 코드"
        desc="친구가 알려준 입장 코드를 입력해 주세요."
        expect={settings.access_code}
        okLabel="들어가기"
        onOk={() => {
          localStorage.setItem(ENTERED_KEY, '1')
          setEntered(true)
        }}
        onBack={() => setGateOpen(false)}
      />
    )
  }

  // 2) 입장 후: 이름 로그인
  const me = db.members.find((m) => m.id === meId)
  if (!me) {
    return (
      <Login
        members={db.members}
        onLogin={async (name) => {
          const m = await store.addMember(name)
          localStorage.setItem(ME_KEY, m.id)
          setMeId(m.id)
          refresh()
        }}
      />
    )
  }

  // 2.5) 앱 안에서 '소개 다시보기' (로고 클릭)
  if (showIntro) {
    return <Landing intro onStart={() => setShowIntro(false)} />
  }

  // 3) 관리자 PIN 입력 화면
  if (adminGate) {
    return (
      <Gate
        title="관리자 확인"
        desc="관리자 PIN을 입력하면 코드 변경·멤버/여행 정리를 할 수 있어요."
        expect={settings.admin_pin}
        okLabel="관리자로 들어가기"
        onOk={() => {
          setIsAdmin(true)
          setAdminGate(false)
          setAdminView(true)
        }}
        onBack={() => setAdminGate(false)}
      />
    )
  }

  // 4) 관리자 패널
  if (adminView) {
    return (
      <div className="app">
        <AdminPanel
          db={db}
          me={me}
          settings={settings}
          refreshSettings={refreshSettings}
          refresh={refresh}
          onClose={() => setAdminView(false)}
        />
      </div>
    )
  }

  const trip = view.tripId ? db.trips.find((t) => t.id === view.tripId) : null

  return (
    <div className="app">
      <header className="topbar">
        {trip ? (
          <button className="back" onClick={() => setView({ page: 'home', tripId: null })} aria-label="뒤로">
            <CaretLeft size={22} weight="bold" />
          </button>
        ) : (
          <button className="logo" onClick={() => setShowIntro(true)} title="소개 화면 보기">
            <span className="b1 blob" style={{ width: 18, height: 18, background: 'var(--accent)' }} />
            언제갈까
          </button>
        )}
        {trip && (
          <span className="topbar-title">
            {trip.emoji} {trip.title}
          </span>
        )}
        <button
          className="back"
          style={{ marginLeft: 'auto' }}
          aria-label="관리자"
          title="관리자"
          onClick={() => (isAdmin ? setAdminView(true) : setAdminGate(true))}
        >
          <GearSix size={20} />
        </button>
        <button
          className="me-chip"
          style={{ '--c': me.color, marginLeft: 0 }}
          onClick={async () => {
            if (await confirmDlg('다른 이름으로 로그인할까요?', { okLabel: '이름 바꾸기' })) {
              localStorage.removeItem(ME_KEY)
              setMeId('')
            }
          }}
        >
          {me.name}
        </button>
      </header>
      {store.demo && (
        <div className="demo-banner">
          데모 모드 · 지금은 이 기기에만 저장돼요. 친구와 공유하려면 <b>docs/SETUP.md</b>를 따라 연결하세요.
        </div>
      )}
      {trip ? (
        <TripDetail
          db={db}
          me={me}
          trip={trip}
          refresh={refresh}
          onDeleted={() => setView({ page: 'home', tripId: null })}
        />
      ) : (
        <Home
          db={db}
          me={me}
          refresh={refresh}
          tab={homeTab}
          setTab={setHomeTab}
          onOpen={(id) => setView({ page: 'trip', tripId: id })}
        />
      )}
    </div>
  )
}
