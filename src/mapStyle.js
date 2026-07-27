// 스타일 행정구역 지도의 색/라벨 데이터와 헬퍼. MapTab에서만 쓴다.

// KOSTAT 시도 코드 → 이름. 지도는 이 17개 단위로 크게 묶어 보여준다.
// (시군구 251개로 쪼개면 대전 안에서도 유성구↔중구가 갈려 동선이 잘린다.)
export const SIDO_NAMES = {
  11: '서울', 21: '부산', 22: '대구', 23: '인천', 24: '광주', 25: '대전',
  26: '울산', 29: '세종', 31: '경기', 32: '강원', 33: '충북', 34: '충남',
  35: '전북', 36: '전남', 37: '경북', 38: '경남', 39: '제주',
}

// KOSTAT 시도 코드 → 색상(hue). 인접한 도끼리 색이 겹치지 않게 배치.
export const HUES = {
  11: 32, 21: 205, 22: 14, 23: 46, 24: 160, 25: 282, 26: 192,
  29: 52, 31: 36, 32: 128, 33: 268, 34: 350, 35: 96, 36: 172,
  37: 22, 38: 146, 39: 330,
}

// 시도 라벨 (짧은 이름, 위치, 도 단위 여부)
export const PROVINCE_LABELS = [
  ['경기', 37.22, 127.42, true],
  ['강원', 37.72, 128.35, true],
  ['충북', 36.83, 127.93, true],
  ['충남', 36.42, 126.78, true],
  ['전북', 35.72, 127.12, true],
  ['전남', 34.88, 126.92, true],
  ['경북', 36.38, 128.9, true],
  ['경남', 35.35, 128.2, true],
  ['제주', 33.38, 126.53, true],
  ['서울', 37.55, 126.98, false],
  ['인천', 37.44, 126.52, false],
  ['대전', 36.33, 127.4, false],
  ['세종', 36.6, 127.24, false],
  ['광주', 35.15, 126.84, false],
  ['대구', 35.83, 128.56, false],
  ['울산', 35.56, 129.28, false],
  ['부산', 35.16, 129.06, false],
]

const hashNum = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0)

// 앱 전체 파스텔 톤에 맞춘 부드러운 채도/밝기.
export const fillOf = (code, chosen) => {
  const hue = HUES[code.slice(0, 2)] ?? 200
  const light = 79 + (hashNum(code) % 5) * 2 // 79~87% 사이에서 구역마다 살짝 다르게
  return `hsl(${hue} ${chosen ? 52 : 34}% ${chosen ? light - 7 : light}%)`
}

// 구역 폴리곤 기본 스타일. chosenSet = 후보지로 담긴 구역 코드 모음.
export const geoStyle = (chosenSet) => (f) => ({
  fillColor: fillOf(f.properties.code, chosenSet.has(f.properties.code)),
  fillOpacity: 1,
  color: 'rgba(255,255,255,0.9)',
  weight: chosenSet.has(f.properties.code) ? 2 : 0.8,
})

// GeoJSON 좌표([lng,lat]) → Leaflet([lat,lng]) 뒤집어서 폴리곤 바깥 고리들만 모은다.
export function outerRings(feature) {
  const g = feature.geometry
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  return polys.map((rings) => rings[0].map(([lng, lat]) => [lat, lng]))
}
