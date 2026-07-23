import { useState } from 'react'
import { Images, CaretRight } from '@phosphor-icons/react'
import PhotoViewer from './PhotoViewer.jsx'

// 홈의 메인 갤러리: 모든 여행의 사진을 여행별 묶음으로 모아 보여준다.
export default function HomeGallery({ db, me, refresh, onOpen }) {
  const [viewer, setViewer] = useState(null)

  const groups = db.trips
    .map((t) => ({
      trip: t,
      photos: db.photos
        .filter((p) => p.trip_id === t.id)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    }))
    .filter((g) => g.photos.length > 0)

  return (
    <div className="tab-body">
      {groups.length === 0 && (
        <div className="empty card">
          <Images size={30} weight="duotone" />
          <span>
            아직 올린 사진이 없어요.
            <br />각 여행의 갤러리 탭에서 사진을 올리면 여기에 모여요.
          </span>
        </div>
      )}
      {groups.map(({ trip, photos }) => (
        <section key={trip.id} className="card gal-group">
          <button className="gal-group-head" onClick={() => onOpen(trip.id)}>
            <span className="gal-group-emoji">{trip.emoji}</span>
            <b>{trip.title}</b>
            <small className="num">{photos.length}장</small>
            <CaretRight size={16} className="chev" />
          </button>
          <div className="photo-grid">
            {photos.map((p) => (
              <button key={p.id} className="photo-cell" onClick={() => setViewer(p)}>
                <img src={p.data_url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      ))}
      <PhotoViewer db={db} me={me} photo={viewer} onClose={() => setViewer(null)} refresh={refresh} />
    </div>
  )
}
