// 장소 검색 2단 구조: config.js에 카카오 JavaScript 키가 있으면 카카오,
// 없으면 OpenStreetMap(Nominatim). 두 결과 모두 {id, lat, lng, name, addr}로 통일.
import { KAKAO_JS_KEY } from './config.js'

let kakaoLoader = null
export function loadKakao() {
  if (!KAKAO_JS_KEY) return Promise.resolve(null)
  if (!kakaoLoader) {
    kakaoLoader = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`
      s.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
      s.onerror = () => resolve(null) // 키가 틀리거나 차단되면 OSM으로 폴백
      document.head.appendChild(s)
    })
  }
  return kakaoLoader
}

export async function searchKakao(kakao, query, b) {
  const ps = new kakao.maps.services.Places()
  const rect = `${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}`
  const list = await new Promise((resolve) => {
    ps.keywordSearch(
      query,
      (result, status) => resolve(status === kakao.maps.services.Status.OK ? result : []),
      { rect, size: 8 }
    )
  })
  return list.map((p) => ({
    id: 'k' + p.id,
    lat: +p.y,
    lng: +p.x,
    name: p.place_name,
    addr: p.road_address_name || p.address_name || '',
  }))
}

export async function searchOsm(query, b) {
  // 검색 범위를 포커스한 구역 근처로 유도한다 (구역 밖 결과도 후순위로 허용).
  const viewbox = `${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}`
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=ko&countrycodes=kr&limit=8' +
    `&viewbox=${viewbox}&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  const norm = data.map((r) => ({
    id: 'o' + r.place_id,
    lat: +r.lat,
    lng: +r.lon,
    name: (r.name || r.display_name.split(',')[0]).trim(),
    addr: r.display_name
      .split(',')
      .slice(1, 4)
      .map((s) => s.trim())
      .reverse()
      .join(' '),
  }))
  const inBox = norm.filter((r) => b.contains([r.lat, r.lng]))
  return (inBox.length ? inBox : norm).slice(0, 6)
}
