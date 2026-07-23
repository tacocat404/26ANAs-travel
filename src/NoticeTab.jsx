import { useState } from 'react'
import { store } from './store.js'
import { memberById } from './utils.js'

export default function NoticeTab({ db, me, trip, refresh }) {
  const [text, setText] = useState('')

  const notices = db.notices
    .filter((n) => n.trip_id === trip.id)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.created_at || '').localeCompare(a.created_at || ''))

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await store.addNotice({ trip_id: trip.id, member_id: me.id, content: text.trim() })
    setText('')
    refresh()
  }

  return (
    <div>
      <form className="card form" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'공지를 남겨보세요.\n예) 숙소는 내가 알아볼게! / 회비 5만원씩 모으자'}
          rows={3}
          maxLength={500}
        />
        <button className="primary" disabled={!text.trim()}>
          공지 올리기
        </button>
      </form>
      {notices.length === 0 && <div className="empty card">아직 공지가 없어요 📢</div>}
      {notices.map((n) => {
        const author = memberById(db, n.member_id)
        return (
          <div key={n.id} className={'card notice' + (n.pinned ? ' pinned' : '')}>
            <div className="notice-head">
              <span className="legend-item">
                <i style={{ background: author?.color }} />
                {author?.name || '알 수 없음'}
              </span>
              <small>{(n.created_at || '').slice(0, 10).replaceAll('-', '.')}</small>
              <span className="notice-btns">
                <button
                  className={'ghost-icon' + (n.pinned ? ' on' : '')}
                  title={n.pinned ? '고정 해제' : '위로 고정'}
                  onClick={async () => {
                    await store.setNoticePinned(n.id, !n.pinned)
                    refresh()
                  }}
                >
                  📌
                </button>
                {n.member_id === me.id && (
                  <button
                    className="ghost-icon"
                    title="삭제"
                    onClick={async () => {
                      if (confirm('이 공지를 삭제할까요?')) {
                        await store.removeNotice(n.id)
                        refresh()
                      }
                    }}
                  >
                    ✕
                  </button>
                )}
              </span>
            </div>
            <p className="notice-body">{n.content}</p>
          </div>
        )
      })}
    </div>
  )
}
