import { useState } from 'react'
import { Images, WarningCircle } from '@phosphor-icons/react'
import { store } from './store.js'
import { compressImage, isVideoFile, videoPoster, blankPoster, MAX_VIDEO_MB } from './utils.js'
import PhotoViewer from './PhotoViewer.jsx'
import MediaCell from './MediaCell.jsx'

export default function GalleryTab({ db, me, trip, refresh, isAdmin = false }) {
  const [viewer, setViewer] = useState(null)
  const [uploading, setUploading] = useState('')
  const [uploadError, setUploadError] = useState('')
  // 동영상 칸이 아직 없는 DB(SETUP 6단계 전)에서는 사진만 받는다.
  const videoOk = db.media_ready !== false

  const photos = db.photos
    .filter((p) => p.trip_id === trip.id)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  const onFile = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setUploadError('')
    try {
      for (const [i, f] of files.entries()) {
        const step = files.length > 1 ? ` (${i + 1}/${files.length})` : ''
        if (isVideoFile(f)) {
          if (!videoOk) throw new Error('동영상은 아직 준비 중이에요. (SETUP.md 6단계)')
          if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
            throw new Error(`동영상은 ${MAX_VIDEO_MB}MB까지 올릴 수 있어요. 짧게 잘라서 올려주세요.`)
          }
          setUploading(`미리보기 만드는 중…${step}`)
          const data_url = await videoPoster(f).catch(() => blankPoster())
          setUploading(`동영상 올리는 중…${step}`)
          const { video_url, storage_path } = await store.uploadVideo(f)
          await store.addPhoto({
            trip_id: trip.id,
            member_id: me.id,
            data_url,
            caption: '',
            kind: 'video',
            video_url,
            storage_path,
          })
        } else {
          setUploading(`사진 올리는 중…${step}`)
          const data_url = await compressImage(f)
          await store.addPhoto({ trip_id: trip.id, member_id: me.id, data_url, caption: '', kind: 'image' })
        }
      }
      refresh()
    } catch (err) {
      console.error(err)
      setUploadError(err?.message || '올리지 못했어요. 다른 파일로 다시 시도해 주세요.')
      refresh() // 여러 개 중 앞부분은 이미 올라갔을 수 있다
    } finally {
      setUploading('')
    }
  }

  return (
    <div className="tab-body">
      <label className={'upload-btn primary' + (uploading ? ' disabled' : '')}>
        <Images size={18} weight="bold" />
        {uploading || (videoOk ? '사진·동영상 올리기' : '사진 올리기')}
        <input
          type="file"
          accept={videoOk ? 'image/*,video/*' : 'image/*'}
          multiple
          hidden
          onChange={onFile}
          disabled={!!uploading}
        />
      </label>
      {videoOk && <p className="upload-hint">동영상은 한 개 {MAX_VIDEO_MB}MB까지 올라가요.</p>}
      {uploadError && (
        <p className="inline-error">
          <WarningCircle size={16} weight="bold" />
          {uploadError}
        </p>
      )}
      {photos.length === 0 && (
        <div className="empty card">
          <Images size={30} weight="duotone" />
          <span>
            아직 사진이 없어요. 숙소나 맛집 스크린샷도 좋고,
            {videoOk ? ' 짧은 영상도 괜찮아요.' : ' 편하게 올려보세요.'}
          </span>
        </div>
      )}
      <div className="photo-grid">
        {photos.map((p) => (
          <MediaCell
            key={p.id}
            db={db}
            me={me}
            item={p}
            className="photo-cell"
            onOpen={() => setViewer(p)}
            refresh={refresh}
            isAdmin={isAdmin}
          />
        ))}
      </div>
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
