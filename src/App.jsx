import { useCallback, useEffect, useState } from 'react'
import { AirplaneTilt, CaretLeft } from '@phosphor-icons/react'
import { store } from './store.js'
import Login from './Login.jsx'
import TripList from './TripList.jsx'
import TripDetail from './TripDetail.jsx'

const ME_KEY = 'trip-cal-me'

export default function App() {
  const [db, setDb] = useState(null)
  const [error, setError] = useState('')
  const [meId, setMeId] = useState(localStorage.getItem(ME_KEY) || '')
  const [view, setView] = useState({ page: 'home', tripId: null })

  const refresh = useCallback(async () => {
    try {
      setDb(await store.getAll())
      setError('')
    } catch (e) {
      console.error(e)
      setError('데이터를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // 다른 친구가 올린 내용이 보이도록, 화면에 다시 돌아올 때마다 새로 불러온다.
  useEffect(() => {
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  if (error && !db) return <div className="loading">{error}</div>
  if (!db) return <div className="loading">불러오는 중…</div>

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

  const trip = view.tripId ? db.trips.find((t) => t.id === view.tripId) : null

  return (
    <div className="app">
      <header className="topbar">
        {trip ? (
          <button className="back" onClick={() => setView({ page: 'home', tripId: null })} aria-label="뒤로">
            <CaretLeft size={22} weight="bold" />
          </button>
        ) : (
          <span className="logo">
            <AirplaneTilt size={19} weight="fill" />
            언제갈까
          </span>
        )}
        {trip && (
          <span className="topbar-title">
            {trip.emoji} {trip.title}
          </span>
        )}
        <button
          className="me-chip"
          style={{ '--c': me.color }}
          onClick={() => {
            if (confirm('다른 이름으로 로그인할까요?')) {
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
        <TripList db={db} me={me} refresh={refresh} onOpen={(id) => setView({ page: 'trip', tripId: id })} />
      )}
    </div>
  )
}
