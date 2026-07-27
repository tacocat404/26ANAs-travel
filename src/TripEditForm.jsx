import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { store } from './store.js'
import EmojiPicker from './EmojiPicker.jsx'

// 여행 정보 수정: 이모지·이름·후보 시기. (예전엔 만든 뒤 고칠 수 없어 삭제밖에 방법이 없었다.)
// 확정된 가는 날은 1단계 캘린더에서 다루므로 여기서 건드리지 않는다.
export default function TripEditForm({ trip, refresh, onClose }) {
  const [emoji, setEmoji] = useState(trip.emoji || '🏝️')
  const [title, setTitle] = useState(trip.title)
  const [start, setStart] = useState(trip.start_month || '')
  const [end, setEnd] = useState(trip.end_month || '')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await store.updateTrip(trip.id, {
        title: title.trim(),
        emoji,
        start_month: start || null,
        end_month: end || start || null,
      })
      refresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card form trip-edit" onSubmit={submit}>
      <label className="pick-label">
        여행 이모지 <span className="pick-current">{emoji}</span>
      </label>
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="여행 이름" maxLength={20} />
      <div className="row month-row">
        <label>
          후보 시기
          <input type="month" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <span>~</span>
        <label>
          <input type="month" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <div className="row">
        <button className="primary" disabled={!title.trim() || saving}>
          <Check size={15} weight="bold" />
          {saving ? '저장 중' : '저장'}
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          취소
        </button>
      </div>
    </form>
  )
}
