import { useRef, useState } from 'react'
import { CaretLeft, LockSimple } from '@phosphor-icons/react'

// 입장 코드 / 관리자 PIN 입력 화면 (공용).
// props: title, desc, expect(맞아야 하는 값), okLabel, onOk, onBack
export default function Gate({ title, desc, expect, okLabel = '들어가기', onOk, onBack }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  const inRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    if (!val.trim()) return
    if (val.trim() === String(expect)) {
      onOk()
    } else {
      setErr(true)
      setVal('')
      inRef.current?.focus()
    }
  }

  return (
    <div className="gate">
      {onBack && (
        <button className="gate-back" onClick={onBack}>
          <CaretLeft size={16} weight="bold" />
          뒤로
        </button>
      )}
      <span className="gate-blob blob">
        <LockSimple
          size={26}
          weight="bold"
          color="var(--accent)"
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
        />
      </span>
      <h1 className="hand" style={{ fontSize: 30 }}>
        {title}
      </h1>
      <p>{desc}</p>
      <form className="login-form" onSubmit={submit}>
        <input
          ref={inRef}
          className="pin-input"
          value={val}
          onChange={(e) => {
            setVal(e.target.value)
            setErr(false)
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="••••"
          maxLength={12}
          autoFocus
          aria-label={title}
        />
        {err && (
          <p className="inline-error" role="alert">
            맞지 않아요. 다시 확인해 주세요.
          </p>
        )}
        <button className="primary accent" disabled={!val.trim()}>
          {okLabel}
        </button>
      </form>
    </div>
  )
}
