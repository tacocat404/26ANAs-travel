import { useState } from 'react'
import { Plus, X, Check } from '@phosphor-icons/react'

// 여행 이모지 고르기. 기본 세트가 넉넉하고, 없으면 직접 추가할 수 있다.
// 직접 추가한 이모지는 이 기기에 저장돼 다음에도 목록에 남는다.
const DEFAULTS = [
  '🏝️', '🏖️', '⛰️', '🏔️', '🏕️', '🏞️', '🌊', '🌅', '🏙️', '🌃',
  '🎿', '🏂', '♨️', '🎡', '🎢', '🎠', '🏟️', '🎪', '🎇', '🎆',
  '🍜', '🍣', '🍖', '🍕', '🍤', '🧁', '☕', '🍺', '🍹', '🍦',
  '✈️', '🚆', '🚗', '🚌', '🚢', '🚲', '🛵', '🗺️', '🧭', '🎒',
  '📸', '🎤', '🎣', '🏄', '🧗', '⛺', '🔥', '🌸', '🍁', '❄️',
  '🐶', '🐱', '🦌', '🐬', '🌻', '🌙', '⭐', '🎉', '🎂', '🎁',
]

const LS_KEY = 'trip-cal-emojis'

const readCustom = () => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY))
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []
  } catch {
    return []
  }
}

export default function EmojiPicker({ value, onChange }) {
  const [custom, setCustom] = useState(readCustom)
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')

  const save = (list) => {
    setCustom(list)
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list))
    } catch {
      /* 저장 공간이 없어도 고르는 건 계속 되게 둔다 */
    }
  }

  // 붙여넣은 글자에서 이모지 한 글자만 남긴다 (여러 개 붙여넣어도 첫 글자).
  const firstGlyph = (s) => [...s.trim()][0] || ''

  const addCustom = (e) => {
    e.preventDefault()
    const g = firstGlyph(input)
    if (!g) return
    if (![...DEFAULTS, ...custom].includes(g)) save([...custom, g])
    onChange(g)
    setInput('')
    setAdding(false)
  }

  const removeCustom = (g) => {
    save(custom.filter((x) => x !== g))
    if (value === g) onChange(DEFAULTS[0])
  }

  return (
    <div className="emoji-pick">
      <div className="emoji-row">
        {DEFAULTS.map((e2) => (
          <button
            type="button"
            key={e2}
            className={'emoji-btn' + (value === e2 ? ' on' : '')}
            onClick={() => onChange(e2)}
            aria-label={`이모지 ${e2}`}
            aria-pressed={value === e2}
          >
            {e2}
          </button>
        ))}
        {custom.map((e2) => (
          <span key={e2} className="emoji-mine">
            <button
              type="button"
              className={'emoji-btn' + (value === e2 ? ' on' : '')}
              onClick={() => onChange(e2)}
              aria-label={`내가 추가한 이모지 ${e2}`}
              aria-pressed={value === e2}
            >
              {e2}
            </button>
            <button
              type="button"
              className="emoji-del"
              onClick={() => removeCustom(e2)}
              aria-label={`${e2} 목록에서 지우기`}
            >
              <X size={9} weight="bold" />
            </button>
          </span>
        ))}
        {!adding && (
          <button type="button" className="emoji-btn emoji-add" onClick={() => setAdding(true)} aria-label="이모지 직접 추가">
            <Plus size={17} weight="bold" />
          </button>
        )}
      </div>

      {adding && (
        <div className="emoji-add-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCustom(e)
              if (e.key === 'Escape') {
                setAdding(false)
                setInput('')
              }
            }}
            placeholder="원하는 이모지를 붙여넣거나 입력"
            maxLength={8}
            autoFocus
            aria-label="추가할 이모지"
          />
          <button type="button" className="primary small" onClick={addCustom} disabled={!firstGlyph(input)}>
            <Check size={14} weight="bold" />
            추가
          </button>
          <button
            type="button"
            className="ghost small"
            onClick={() => {
              setAdding(false)
              setInput('')
            }}
          >
            취소
          </button>
        </div>
      )}
      {adding && (
        <p className="emoji-tip">
          휴대폰은 키보드의 이모지 버튼, 컴퓨터는 <b>윈도우키 + .</b> 로 이모지를 넣을 수 있어요.
        </p>
      )}
    </div>
  )
}
