// 멤버 색 범례. 여행 목록과 캘린더 탭에서 함께 쓴다.
export default function MemberLegend({ db, me }) {
  return (
    <div className="legend">
      {db.members.map((m) => (
        <span key={m.id} className="legend-item">
          <i style={{ background: m.color }} />
          {m.name}
          {m.id === me.id ? ' (나)' : ''}
        </span>
      ))}
    </div>
  )
}
