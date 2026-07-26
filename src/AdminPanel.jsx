import { useState } from 'react'
import { CaretLeft, Trash, Check, PencilSimple } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberName } from './utils.js'

// 관리자 전용 화면: 입장 코드/PIN 변경, 멤버·여행 정리.
export default function AdminPanel({ db, me, settings, refreshSettings, refresh, onClose }) {
  const confirmDlg = useConfirm()
  const [code, setCode] = useState(settings.access_code || '')
  const [pin, setPin] = useState(settings.admin_pin || '')
  const [saved, setSaved] = useState('')
  const [err, setErr] = useState('')

  const save = async (key, value, label) => {
    if (!value.trim()) return
    setErr('')
    try {
      await store.setSetting(key, value.trim())
      await refreshSettings()
      setSaved(label)
      setTimeout(() => setSaved(''), 1800)
    } catch (e) {
      console.error(e)
      setErr('저장하려면 Supabase에 settings 테이블이 필요해요. docs/SETUP.md 4단계를 따라 주세요.')
    }
  }

  const trips = [...db.trips].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  return (
    <main className="page">
      <button className="gate-back" onClick={onClose} style={{ alignSelf: 'flex-start' }}>
        <CaretLeft size={16} weight="bold" />
        앱으로 돌아가기
      </button>
      <div className="section-head">
        <h2>관리자</h2>
        <span className="count-note">{me.name}</span>
      </div>

      {err && <p className="inline-error">{err}</p>}

      <div className="card form">
        <p className="admin-sec-title" style={{ marginTop: 0 }}>입장 코드 (친구들과 공유)</p>
        <div className="row">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: 7264" maxLength={12} />
          <button className="primary small accent" onClick={() => save('access_code', code, '입장 코드')} disabled={!code.trim()}>
            저장
          </button>
        </div>
        <p className="admin-sec-title">관리자 PIN (나만 알기)</p>
        <div className="row">
          <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="예: 1004" maxLength={12} />
          <button className="primary small accent" onClick={() => save('admin_pin', pin, '관리자 PIN')} disabled={!pin.trim()}>
            저장
          </button>
        </div>
        {saved && (
          <p className="inline-error" style={{ color: 'var(--accent)' }}>
            <Check size={15} weight="bold" />
            {saved} 저장했어요.
          </p>
        )}
        <p className="sub-note">
          입장 코드·PIN은 낯선 사람을 막는 부드러운 잠금이에요. 친구들에게만 코드를 알려주세요.
        </p>
      </div>

      <div className="card">
        <p className="admin-sec-title" style={{ marginTop: 0, marginBottom: 8 }}>멤버 ({db.members.length})</p>
        <div className="admin-list">
          {db.members.map((m) => (
            <div key={m.id} className="admin-row" style={{ padding: '8px 2px' }}>
              <span className="nm">
                <i className="blob" style={{ display: 'inline-block', width: 16, height: 16, background: m.color }} />
                {m.name}
                {m.id === me.id ? ' (나)' : ''}
              </span>
              <button
                className="x"
                aria-label="이름 바꾸기"
                title="이름 바꾸기"
                onClick={async () => {
                  const next = prompt(`'${m.name}'의 새 이름을 적어주세요.`, m.name)
                  if (next && next.trim() && next.trim() !== m.name) {
                    await store.renameMember(m.id, next.trim().slice(0, 10))
                    refresh()
                  }
                }}
              >
                <PencilSimple size={16} />
              </button>
              {m.id !== me.id && (
                <button
                  className="x"
                  aria-label="멤버 삭제"
                  onClick={async () => {
                    if (
                      await confirmDlg(`'${m.name}' 멤버를 삭제할까요?\n이 사람의 '안 되는 날' 표시도 함께 사라져요.`, {
                        okLabel: '삭제',
                        danger: true,
                      })
                    ) {
                      await store.removeMember(m.id)
                      refresh()
                    }
                  }}
                >
                  <Trash size={17} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="admin-sec-title" style={{ marginTop: 0, marginBottom: 8 }}>여행 ({trips.length})</p>
        {trips.length === 0 ? (
          <p className="sub-note" style={{ margin: 0 }}>아직 여행이 없어요.</p>
        ) : (
          <div className="admin-list">
            {trips.map((t) => (
              <div key={t.id} className="admin-row" style={{ padding: '8px 2px' }}>
                <span className="nm">
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  {t.title}
                </span>
                <small>{memberName(db, t.created_by)}</small>
                <button
                  className="x"
                  aria-label="여행 삭제"
                  onClick={async () => {
                    if (
                      await confirmDlg(`'${t.title}' 여행을 삭제할까요?\n지도·공지·사진도 함께 삭제돼요.`, {
                        okLabel: '삭제',
                        danger: true,
                      })
                    ) {
                      await store.removeTrip(t.id)
                      refresh()
                    }
                  }}
                >
                  <Trash size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
