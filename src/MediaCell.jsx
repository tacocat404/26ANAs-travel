import { Play, X } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberName } from './utils.js'

// 갤러리 한 칸(사진 또는 동영상). 여행 갤러리 탭과 홈 갤러리가 함께 쓴다.
// 예전엔 칸 전체가 <button>이었는데, 안에 삭제 버튼을 넣으려면 버튼 안에 버튼이
// 되어버려서 겉을 <div>로 바꾸고 "열기 버튼 + 삭제 버튼"을 나란히 둔다.
//
// className으로 모양만 갈아끼운다: photo-cell(정사각) / masonry-cell(원본 비율) / gal-hero(대표).
export default function MediaCell({ db, me, item, className, onOpen, refresh, isAdmin = false, label }) {
  const confirmDlg = useConfirm()
  const isVideo = item.kind === 'video' && !!item.video_url
  const mine = item.member_id === me.id
  const canDelete = mine || isAdmin
  const what = isVideo ? '동영상' : '사진'

  const del = async (e) => {
    e.stopPropagation()
    const extra = mine ? '' : `\n(${memberName(db, item.member_id)} 님이 올린 것을 관리자 권한으로 지웁니다.)`
    if (!(await confirmDlg(`이 ${what}을 삭제할까요?${extra}`, { okLabel: '삭제', danger: true }))) return
    await store.removePhoto(item.id, item.storage_path)
    refresh()
  }

  return (
    <div className={className}>
      <button className="media-open" onClick={onOpen} aria-label={label || `${what} 크게 보기`}>
        <img src={item.data_url} alt={item.caption || ''} />
      </button>
      {isVideo && (
        <span className="play-badge" aria-hidden="true">
          <Play size={16} weight="fill" />
        </span>
      )}
      {canDelete && (
        <button className="media-del" onClick={del} aria-label={`이 ${what} 삭제`} title={`이 ${what} 삭제`}>
          <X size={13} weight="bold" />
        </button>
      )}
    </div>
  )
}
