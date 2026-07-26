import { useState } from 'react'

// 이름 로그인 — 소개 화면과 같은 포근한 언어(블롭 + 손글씨 + 파스텔).
export default function Login({ members, onLogin }) {
  const [name, setName] = useState('')
  return (
    <div className="login">
      <div className="login-hero">
        <span className="login-blobs" aria-hidden="true">
          <i className="blob face" style={{ background: '#F4A9B8' }} />
          <i className="blob" style={{ background: '#A9C8EE' }} />
          <i className="blob face" style={{ background: '#A9DCC8' }} />
        </span>
        <span className="login-kicker hand">반가워요</span>
        <h1 className="login-title">언제갈까?</h1>
        <p className="login-sub">이름만 알려주면 바로 시작해요. 친구들의 안 되는 날을 모아 다 되는 날을 찾아드려요.</p>
      </div>

      {members.length > 0 && (
        <>
          <p className="login-label">내 이름을 골라주세요</p>
          <div className="member-grid">
            {members.map((m) => (
              <button key={m.id} className="member-btn" style={{ '--c': m.color }} onClick={() => onLogin(m.name)}>
                <i className="blob" style={{ background: m.color }} />
                {m.name}
              </button>
            ))}
          </div>
          <p className="login-label">또는 새 이름으로 시작</p>
        </>
      )}

      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onLogin(name.trim())
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 입력 (예: 미주)"
          maxLength={10}
          aria-label="이름"
        />
        <button className="primary accent" disabled={!name.trim()}>
          시작하기
        </button>
      </form>
      <p className="login-note hand">비밀번호 없이 이름만으로 시작해요</p>
    </div>
  )
}
