import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// 브라우저 기본 confirm() 대신 쓰는, 앱 디자인과 같은 확인 대화상자.
// 사용법: const confirmDlg = useConfirm(); if (await confirmDlg('지울까요?', { danger: true })) ...
const ConfirmCtx = createContext(null)

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null) // { message, okLabel, danger, resolve }
  const okRef = useRef(null)

  const confirm = useCallback(
    (message, opts = {}) => new Promise((resolve) => setReq({ message, ...opts, resolve })),
    []
  )

  const close = (answer) => {
    req?.resolve(answer)
    setReq(null)
  }

  useEffect(() => {
    if (!req) return
    okRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [req])

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <div className="modal-back" onClick={() => close(false)}>
          <div className="modal card" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className="modal-msg">{req.message}</p>
            <div className="row modal-btns">
              <button className="ghost" onClick={() => close(false)}>
                취소
              </button>
              <button
                ref={okRef}
                className={'primary' + (req.danger ? ' danger' : '')}
                onClick={() => close(true)}
              >
                {req.okLabel || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmCtx)
}
