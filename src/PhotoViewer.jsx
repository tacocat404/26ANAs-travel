import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberName } from './utils.js'

// 사진 확대 보기. 여행 갤러리 탭과 홈 갤러리에서 함께 쓴다.
export default function PhotoViewer({ db, me, photo, onClose, refresh }) {
  const confirmDlg = useConfirm()
  if (!photo) return null
  return (
    <div className="viewer" onClick={onClose}>
      <img src={photo.data_url} alt="" onClick={(e) => e.stopPropagation()} />
      <div className="viewer-bar" onClick={(e) => e.stopPropagation()}>
        <span className="num">
          {memberName(db, photo.member_id)} · {(photo.created_at || '').slice(0, 10).replaceAll('-', '.')}
        </span>
        {photo.member_id === me.id && (
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
