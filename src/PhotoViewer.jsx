import { useEffect, useState } from 'react'
import { PencilSimple, Check } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberName } from './utils.js'

// 사진 확대 보기. 여행 갤러리 탭과 홈 갤러리에서 함께 쓴다.
// 올린 사람은 한 줄 설명(캡션)을 달 수 있다.
export default function PhotoViewer({ db, me, photo: opened, onClose, refresh }) {
  const confirmDlg = useConfirm()
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)

  // 부모가 넘겨준 사진 객체는 열었던 순간의 값이라, 설명을 저장해도 그대로다.
  // 항상 최신 db에서 같은 id를 찾아 쓴다 (없으면 넘겨받은 값으로 폴백).
  const photo = (opened && db.photos.find((p) => p.id === opened.id)) || opened

  // 다른 사진으로 넘어가면 편집 상태를 초기화한다.
  useEffect(() => {
    setEditing(false)
    setCaption(photo?.caption || '')
  }, [photo?.id])

  // 열려 있을 때 Esc로 닫기 (편집 중엔 편집만 취소)
  useEffect(() => {
    if (!photo) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (editing) setEditing(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photo, editing, onClose])

  if (!photo) return null
  const mine = photo.member_id === me.id

  const saveCaption = async () => {
    if (saving) return
    setSaving(true)
    try {
      await store.setPhotoCaption(photo.id, caption.trim())
      setEditing(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="viewer" onClick={onClose}>
      <img src={photo.data_url} alt={photo.caption || ''} onClick={(e) => e.stopPropagation()} />

      <div className="viewer-caption" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
              placeholder="이 사진 한 줄 설명 (예: 첫날 숙소 앞)"
              maxLength={40}
              autoFocus
            />
            <button onClick={saveCaption} disabled={saving} aria-label="설명 저장">
              <Check size={14} weight="bold" />
              {saving ? '저장 중' : '저장'}
            </button>
          </>
        ) : (
          <>
            {photo.caption ? <span className="viewer-cap-text">{photo.caption}</span> : null}
            {mine && (
              <button onClick={() => setEditing(true)}>
                <PencilSimple size={13} weight="bold" />
                {photo.caption ? '설명 고치기' : '설명 넣기'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="viewer-bar" onClick={(e) => e.stopPropagation()}>
        <span className="num">
          {memberName(db, photo.member_id)} · {(photo.created_at || '').slice(0, 10).replaceAll('-', '.')}
        </span>
        {mine && (
          <button
            onClick={async () => {
              if (await confirmDlg('이 사진을 삭제할까요?', { okLabel: '삭제', danger: true })) {
                await store.removePhoto(photo.id)
                onClose()
                refresh()
              }
            }}
          >
            삭제
          </button>
        )}
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
