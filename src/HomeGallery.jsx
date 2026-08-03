import { useState } from 'react'
import { Images, CaretRight } from '@phosphor-icons/react'
import PhotoViewer from './PhotoViewer.jsx'
import MediaCell from './MediaCell.jsx'

// 홈의 메인 갤러리: 모든 여행의 사진·동영상을 여행별 묶음으로 모아 보여준다.
// 가장 최근 여행은 대표 사진(히어로)을 크게, 나머지는 원본 비율 그대로 메이슨리로.
export default function HomeGallery({ db, me, refresh, onOpen, isAdmin = false }) {
  const [viewer, setViewer] = useState(null)

  const groups = db.trips
    .map((t) => ({
      trip: t,
      photos: db.photos
        .filter((p) => p.trip_id === t.id)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    }))
    .filter((g) => g.photos.length > 0)
    .sort((a, b) => (b.photos[0].created_at || '').localeCompare(a.photos[0].created_at || ''))

  const totalPhotos = groups.reduce((n, g) => n + g.photos.length, 0)

  return (
    <div className="tab-body">
      {groups.length === 0 ? (
        <div className="empty card">
          <Images size={30} weight="duotone" />
          <span>
            아직 올린 사진이 없어요.
            <br />각 여행의 갤러리 탭에서 사진을 올리면 여기에 모여요.
          </span>
        </div>
      ) : (
        <p className="gal-lead">
          <b className="num">{totalPhotos}장</b>의 추억이 모였어요.
        </p>
      )}

      {groups.map(({ trip, photos }, gi) => {
        const featured = gi === 0
        const hero = featured ? photos[0] : null
        const rest = featured ? photos.slice(1) : photos
        return (
          <section key={trip.id} className={'gal-group' + (featured ? ' featured' : '')}>
            {featured && (
              <MediaCell
                db={db}
                me={me}
                item={hero}
                className="gal-hero"
                label="대표 사진 크게 보기"
                onOpen={() => setViewer(hero)}
                refresh={refresh}
                isAdmin={isAdmin}
              />
            )}
            <button className="gal-group-head" onClick={() => onOpen(trip.id)}>
              <span className="gal-group-emoji">{trip.emoji}</span>
              <b>{trip.title}</b>
              <small className="num">{photos.length}장</small>
              <CaretRight size={16} className="chev" />
            </button>
            {rest.length > 0 && (
              <div className="masonry">
                {/* 사진은 이미 메모리에 있는 data URL이라 lazy 이점이 없고,
                    메이슨리 셀은 로드 전 높이가 0이라 lazy가 발동하지 않으므로 즉시 로드한다. */}
                {rest.map((p) => (
                  <MediaCell
                    key={p.id}
                    db={db}
                    me={me}
                    item={p}
                    className="masonry-cell"
                    onOpen={() => setViewer(p)}
                    refresh={refresh}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <PhotoViewer
        db={db}
        me={me}
        photo={viewer}
        onClose={() => setViewer(null)}
        refresh={refresh}
        isAdmin={isAdmin}
      />
    </div>
  )
}
