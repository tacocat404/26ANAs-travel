import { useState } from 'react'

export default function Login({ members, onLogin }) {
  const [name, setName] = useState('')
  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-emoji">🏝️</div>
        <h1>언제갈까?</h1>
        <p>친구들과 여행 날짜 정하는 캘린더</p>
      </div>
      {members.length > 0 && (
        <>
          <p className="login-label">내 이름을 골라주세요</p>
          <div className="member-grid">
            {members.map((m) => (
              <button key={m.id} className="member-btn" style={{ '--c': m.color }} onClick={() => onLogin(m.name)}>
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
        />
        <button className="primary" disabled={!name.trim()}>
          시작하기
        </button>
      </form>
      <p className="login-note">비밀번호 없이 이름만으로 시작해요 ✌️</p>
    </div>
  )
}
