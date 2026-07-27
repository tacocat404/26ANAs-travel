// 동선(루트) 계산. 지도가 두 단계라 동선도 두 단계로 보여준다.
//  · 전체 지도(큰 지도): 시도 단위로 묶은 "큰 동선" — 대전 → 경북
//  · 확대 지도(작은 지도): 핀 하나하나를 잇는 "세부 동선" — 충남대 → 성심당 → 영덕대게거리
import { SIDO_NAMES } from './mapStyle.js'

// 두 좌표 사이 직선 거리(km). 하버사인 공식.
export function distKm(a, b) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// 거리를 사람이 읽기 좋게. 1km 미만은 m 단위.
export function fmtDist(km) {
  if (!Number.isFinite(km) || km <= 0) return ''
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)}km`
  return `${Math.round(km)}km`
}

// 핀이 속한 시도(광역). 후보지(region)의 코드 앞 2자리로 판정하고,
// 코드가 없는 옛 데이터는 후보지 이름을 그대로 쓴다.
export function sidoOf(place, regions) {
  const r = regions.find((x) => x.id === place.region_id)
  const code = r?.code ? String(r.code).slice(0, 2) : null
  if (code && SIDO_NAMES[code]) return { key: code, name: SIDO_NAMES[code] }
  return { key: r?.name || 'etc', name: r?.name || '기타' }
}

// 큰 동선: 연속으로 같은 시도에 찍힌 핀들을 한 덩어리로 묶는다.
// 예) 충남대(대전) → 성심당(대전) → 영덕대게거리(경북)  ⇒  1 대전(2곳) → 2 경북(1곳)
// 대전 → 경북 → 대전처럼 되돌아오는 여행은 세 덩어리로 남아 왕복이 그대로 보인다.
export function coarseRoute(places, regions) {
  const nodes = []
  for (const p of places) {
    const { key, name } = sidoOf(p, regions)
    const last = nodes[nodes.length - 1]
    if (last && last.key === key) last.places.push(p)
    else nodes.push({ key, name, places: [p] })
  }
  return nodes.map((n, i) => ({
    ...n,
    no: i + 1,
    center: {
      lat: n.places.reduce((s, p) => s + p.lat, 0) / n.places.length,
      lng: n.places.reduce((s, p) => s + p.lng, 0) / n.places.length,
    },
  }))
}

// 이어지는 좌표들의 구간 거리와 합계.
export function legsOf(points) {
  const legs = []
  for (let i = 1; i < points.length; i++) {
    legs.push({ from: points[i - 1], to: points[i], km: distKm(points[i - 1], points[i]) })
  }
  return { legs, total: legs.reduce((s, l) => s + l.km, 0) }
}
