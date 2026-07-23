import { useState } from 'react'
import { Images } from '@phosphor-icons/react'
import { store } from './store.js'
import { compressImage, memberName } from './utils.js'

export default function GalleryTab({ db, me, trip, refresh }) {
  const [viewer, setViewer] = useState(null)
  const [uploading, setUploading] = useState(false)

  const photos = db.photos
    .filter((p) => p.trip_id === trip.id)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  const onFile = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      for (const f of files) {
        const data_url = await compressImage(f)
        await store.addPhoto({ trip_id: trip.id, member_id: me.id, data_url, caption: '' })
      }
      refresh()
    } catch (err) {
      console.error(err)
      alert('사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="tab-body">
      <label className={'upload-btn primary' + (uploading ? ' disabled' : '')}>
        <Images size={18} weight="bold" />
        {uploading ? '올리는 중…' : '사진 올리기'}
        <input type="file" accept="image/*" multiple hidden onChange={onFile} disabled={uploading} />
      </label>
      {photos.length === 0 && (
        <div className="empty card">
          <Images size={30} weight="duotone" />
          <span>아직 사진이 없어요. 숙소나 맛집 스크린샷도 좋아요.</span>
        </div>
      )}
      <div className="photo-grid">
        {photos.map((p) => (
          <button key={p.id} className="photo-cell" onClick={() => setViewer(p)}>
            <img src={p.data_url} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {viewer && (
        <div className="viewer" onClick={() => setViewer(null)}>
          <img src={viewer.data_url} alt="" onClick={(e) => e.stopPropagation()} />
          <div className="viewer-bar" onClick={(e) => e.stopPropagation()}>
            <span className="num">
              {memberName(db, viewer.member_id)} · {(viewer.created_at || '').slice(0, 10).replaceAll('-', '.')}
            </span>
            {viewer.member_id === me.id && (
              <button
                onClick={async () => {
                  if (confirm('이 사진을 삭제할까요?')) {
                    await store.removePhoto(viewer.id)
                    setViewer(null)
                    refresh()
                  }
                }}
              >
                삭제
              </button>
            )}
            <button onClick={() => setViewer(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
