import { CalendarCheck, MapTrifold, Images, Check } from '@phosphor-icons/react'

// 여행 진행 단계 표시 + 이동. 현재 단계는 여행 상태로 자동 판정되지만 아무 단계나 눌러 볼 수 있다.
export const STAGES = [
  ['schedule', '일정 조율', CalendarCheck],
  ['plan', '세부 일정', MapTrifold],
  ['memory', '추억 정리', Images],
]

export default function StageStepper({ view, suggested, onGo }) {
  return (
    <ol className="stepper" aria-label="여행 진행 단계">
      {STAGES.map(([key, label, Icon], i) => {
        const n = i + 1
        const done = n < suggested
        const current = view === key
        return (
          <li key={key} className={'step' + (current ? ' current' : '') + (done ? ' done' : '')}>
            <button onClick={() => onGo(key)} aria-current={current ? 'step' : undefined}>
              <span className="step-mark">{done ? <Check size={15} weight="bold" /> : n}</span>
              <span className="step-label">
                <Icon size={15} weight={current ? 'fill' : 'regular'} />
                {label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
