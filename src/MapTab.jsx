import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, MagnifyingGlass, MapPin, Plus, X } from '@phosphor-icons/react'
import { store } from './store.js'
import { useConfirm } from './confirm.jsx'
import { memberById, memberName } from './utils.js'
import { PROVINCE_LABELS, geoStyle, outerRings } from './mapStyle.js'
import { loadKakao, searchKakao, searchOsm } from './mapSearch.js'
import { KAKAO_JS_KEY } from './config.js'

/* ── 스타일 지도: 통계청(KOSTAT) 시군구 경계를 시도별 파스텔 색으로 칠한다.
     확대(포커스) 모드에서만 실제 거리 지도가 나타나 장소 핀을 찍을 수 있다.
     색/라벨 데이터는 mapStyle.js, 장소 검색(카카오/OSM)은 mapSearch.js 참고. ── */

export default function MapTab({ db, me, trip, refresh, active = true }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const geoRef = useRef(null) // 행정구역 레이어
  const labelsRef = useRef(null)
  const tilesRef = useRef(null)
  const focusDecorRef = useRef(null) // 포커스 모드의 마스크+외곽선
  const pinsRef = useRef(null)
  const featuresRef = useRef([]) // 전체 구역 feature 목록
  const focusRef = useRef(null) // 이벤트 핸들러에서 현재 모드를 읽기 위한 ref
  const chosenRef = useRef(new Set())

  const [ready, setReady] = useState(false)
  const [focus, setFocus] = useState(null) // { code, name, center, bounds }
  const [draft, setDraft] = useState(null)
  const [name, setName] = useState('')
  const confirmDlg = useConfirm()

  // 장소 검색 (포커스 모드: 카카오 키 있으면 카카오, 없으면 OSM)
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null) // null=대기, []=결과 없음
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState(false)
  // 구역 검색 (전국 지도, 로컬 데이터)
  const [dq, setDq] = useState('')

  // 탭이 숨겨졌다 다시 보이면 지도 크기를 다시 계산한다 (숨김 상태에선 크기가 0으로 잡힘).
  useEffect(() => {
    if (active) mapRef.current?.invalidateSize()
  }, [active])

  const regions = db.regions.filter((r) => r.trip_id === trip.id)
  const focusRegion = focus ? regions.find((r) => r.code === focus.code) : null
  const places = focusRegion
    ? db.places
        .filter((p) => p.trip_id === trip.id && p.region_id === focusRegion.id)
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    : []
  const placeCount = (regionId) => db.places.filter((p) => p.region_id === regionId).length

  const districtMatches = dq.trim()
    ? featuresRef.current.filter((f) => f.properties.name.includes(dq.trim())).slice(0, 8)
    : []

  /* ── 지도 초기화 ── */
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapEl.current, { zoomSnap: 0.25, attributionControl: false, zoomControl: false })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.setView([36.2, 127.9], 7)
    pinsRef.current = L.layerGroup().addTo(map)
    map.on('click', (e) => {
      // 포커스 모드에서만 빈 지도 탭 = 장소 핀 초안
      if (focusRef.current) setDraft({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    mapRef.current = map

    let dead = false
    ;(async () => {
      const [{ feature }, topo] = await Promise.all([
        import('topojson-client'),
        import('./assets/geo/municipalities.json'),
      ])
      if (dead) return
      const data = topo.default ?? topo
      const fc = feature(data, data.objects.skorea_municipalities_geo)
      featuresRef.current = fc.features
      const geo = L.geoJSON(fc, {
        style: (f) => geoStyle(chosenRef.current)(f),
        onEachFeature: (f, layer) => {
          layer.bindTooltip(f.properties.name, { sticky: true, direction: 'top', className: 'geo-tip' })
          layer.on('click', (e) => {
            L.DomEvent.stopPropagation(e)
            focusDistrict(f)
          })
          layer.on('mouseover', () => layer.setStyle({ weight: 2.5, color: '#ffffff' }))
          layer.on('mouseout', () => geoRef.current?.resetStyle(layer))
        },
      }).addTo(map)
      geoRef.current = geo
      map.fitBounds(geo.getBounds(), { padding: [8, 8] })
      labelsRef.current = L.layerGroup(
        PROVINCE_LABELS.map(([nm, lat, lng, big]) =>
          L.marker([lat, lng], {
            icon: L.divIcon({ className: 'geo-label' + (big ? '' : ' small'), html: nm, iconSize: null }),
            interactive: false,
          })
        )
      ).addTo(map)
      setReady(true)
    })()

    return () => {
      dead = true
      map.remove()
      mapRef.current = null
    }
  }, [])

  /* ── 담긴 후보지 스타일 갱신 ── */
  useEffect(() => {
    chosenRef.current = new Set(regions.map((r) => r.code).filter(Boolean))
    geoRef.current?.setStyle(geoStyle(chosenRef.current))
  }, [db.regions, trip.id, ready])

  // 지도를 직접 탭해 초안 핀이 생기면 검색 결과 목록은 접는다.
  useEffect(() => {
    if (draft) setResults(null)
  }, [draft])

  /* ── 포커스 진입/이탈 ── */
  const focusDistrict = (feat) => {
    const map = mapRef.current
    if (!map) return
    const code = feat.properties.code
    const bounds = L.geoJSON(feat).getBounds()
    focusRef.current = code
    setFocus({ code, name: feat.properties.name, center: bounds.getCenter(), bounds })
    setDraft(null)
    setQ('')
    setResults(null)
    setDq('')
    geoRef.current?.remove()
    labelsRef.current?.remove()
    if (!tilesRef.current)
      tilesRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 })
    tilesRef.current.addTo(map)
    focusDecorRef.current?.remove()
    // 선택 구역만 밝게: 전 세계를 덮는 폴리곤에 구역 모양대로 구멍을 낸다.
    const world = [
      [85, -180],
      [85, 180],
      [-85, 180],
      [-85, -180],
    ]
    const mask = L.polygon([world, ...outerRings(feat)], {
      stroke: false,
      fillColor: '#12294f',
      fillOpacity: 0.5,
      interactive: false,
    })
    const outline = L.geoJSON(feat, { style: { color: '#ffffff', weight: 2.5, fill: false, dashArray: '2 6' } })
    focusDecorRef.current = L.layerGroup([mask, outline]).addTo(map)
    map.fitBounds(bounds, { padding: [36, 36] })
  }

  const exitFocus = () => {
    const map = mapRef.current
    if (!map) return
    focusRef.current = null
    setFocus(null)
    setDraft(null)
    setName('')
    setQ('')
    setResults(null)
    tilesRef.current?.remove()
    focusDecorRef.current?.remove()
    geoRef.current?.addTo(map)
    labelsRef.current?.addTo(map)
    if (geoRef.current) map.fitBounds(geoRef.current.getBounds(), { padding: [8, 8] })
  }

  const openRegion = (r) => {
    const feat = featuresRef.current.find((f) => f.properties.code === r.code)
    if (feat) focusDistrict(feat)
    else mapRef.current?.flyTo([r.lat, r.lng], 10) // 예전 데이터(코드 없음) 호환
  }

  /* ── 장소 검색 실행 (카카오 우선, 없으면 OSM) ── */
  const runSearch = async (e) => {
    e?.preventDefault()
    const query = q.trim()
    if (!query || !focus || searching) return
    setSearching(true)
    setResults(null)
    setSearchErr(false)
    setDraft(null)
    try {
      const kakao = await loadKakao()
      const list = kakao ? await searchKakao(kakao, query, focus.bounds) : await searchOsm(query, focus.bounds)
      setResults(list)
    } catch (err) {
      console.error(err)
      setResults([])
      setSearchErr(true)
    } finally {
      setSearching(false)
    }
  }

  const pickResult = (r) => {
    const map = mapRef.current
    map?.flyTo([r.lat, r.lng], Math.max(map.getZoom(), 15))
    setResults(null)
    setQ('')
    setDraft({ lat: r.lat, lng: r.lng })
    setName(r.name.slice(0, 20))
  }

  /* ── 장소 핀 + 연결선 그리기 ── */
  useEffect(() => {
    const layer = pinsRef.current
    if (!layer) return
    layer.clearLayers()
    if (!focus) return
    const coords = places.map((p) => [p.lat, p.lng])
    if (coords.length > 1) {
      L.polyline(coords, { color: '#12294f', weight: 5, opacity: 0.5, interactive: false }).addTo(layer)
      L.polyline(coords, { color: '#ffffff', weight: 2.5, dashArray: '1 9', interactive: false }).addTo(layer)
    }
    places.forEach((p, i) => {
      const color = memberById(db, p.added_by)?.color || '#18181b'
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: 'pin-wrap',
          html: `<span class="place-pin" style="--pc:${color}">${i + 1}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      })
        .addTo(layer)
        .bindTooltip(p.name, { direction: 'top', offset: [0, -12] })
    })
    if (draft) {
      L.marker([draft.lat, draft.lng], {
        icon: L.divIcon({
          className: 'pin-wrap',
          html: '<span class="pin-dot draft"></span>',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
      }).addTo(layer)
    }
  }, [db.places, db.members, draft, focus, trip.id])

  /* ── 후보지 담기 / 장소 추가 ── */
  const ensureRegion = async () => {
    if (focusRegion) return focusRegion
    return await store.addRegion({
      trip_id: trip.id,
      name: focus.name,
      code: focus.code,
      lat: focus.center.lat,
      lng: focus.center.lng,
      added_by: me.id,
    })
  }

  const addPlace = async (e) => {
    e.preventDefault()
    if (!name.trim() || !draft || !focus) return
    const region = await ensureRegion()
    await store.addPlace({
      trip_id: trip.id,
      region_id: region.id,
      name: name.trim(),
      lat: draft.lat,
      lng: draft.lng,
      added_by: me.id,
    })
    setDraft(null)
    setName('')
    refresh()
  }

  return (
    <div className="tab-body wide">
      <div className="map-wrap">
        <div ref={mapEl} className={'map card' + (focus ? ' focused' : '')} />
        <div className="map-top">
          <div className="map-overlay">
            {focus ? (
              <>
                <button className="map-chip" onClick={exitFocus}>
                  <ArrowLeft size={16} weight="bold" />
                  전체 지도
                </button>
                <span className="map-chip title">{focus.name}</span>
                {!focusRegion && (
                  <button
                    className="map-chip add"
                    onClick={async () => {
                      await ensureRegion()
                      refresh()
                    }}
                  >
                    <Plus size={15} weight="bold" />
                    후보지로 담기
                  </button>
                )}
              </>
            ) : (
              ready && <span className="map-chip">가고 싶은 지역을 탭하거나 검색해 보세요</span>
            )}
          </div>

          {ready && (
            <div className="map-search-wrap">
              {focus ? (
                <>
                  <form className="map-search" onSubmit={runSearch}>
                    <MagnifyingGlass size={17} weight="bold" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={`${focus.name} 안에서 장소 검색`}
                      maxLength={30}
                      enterKeyHint="search"
                    />
                    <button className="search-go" disabled={!q.trim() || searching}>
                      {searching ? '찾는 중' : '검색'}
                    </button>
                  </form>
                  {results && results.length > 0 && (
                    <div className="search-results card">
                      {results.map((r, i) => (
                        <button key={r.id || i} className="search-result" onClick={() => pickResult(r)}>
                          <b>{r.name}</b>
                          <small>{r.addr}</small>
                        </button>
                      ))}
                    </div>
                  )}
                  {results && results.length === 0 && (
                    <div className="search-results card">
                      <p className="search-empty">
                        {searchErr
                          ? '검색이 잠시 안 돼요. 조금 뒤에 다시 해보세요.'
                          : '못 찾았어요. 다른 이름으로 검색하거나, 지도를 직접 탭해 핀을 찍어보세요.'}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="map-search">
                    <MagnifyingGlass size={17} weight="bold" />
                    <input
                      value={dq}
                      onChange={(e) => setDq(e.target.value)}
                      placeholder="지역 이름으로 찾기 (예: 속초)"
                      maxLength={20}
                    />
                    {dq && (
                      <button type="button" className="search-clear" onClick={() => setDq('')} aria-label="지우기">
                        <X size={15} weight="bold" />
                      </button>
                    )}
                  </div>
                  {dq.trim() && (
                    <div className="search-results card">
                      {districtMatches.length === 0 && <p className="search-empty">일치하는 지역이 없어요.</p>}
                      {districtMatches.map((f) => (
                        <button key={f.properties.code} className="search-result" onClick={() => focusDistrict(f)}>
                          <b>{f.properties.name}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {!ready && <div className="map-loading">지도를 준비하는 중…</div>}
      </div>
      <p className="map-credit">
        {KAKAO_JS_KEY
          ? '거리 지도 © OpenStreetMap, 장소 검색: 카카오, 행정구역 경계: 통계청(KOSTAT)'
          : '거리 지도·장소 검색 © OpenStreetMap, 행정구역 경계: 통계청(KOSTAT)'}
      </p>

      {focus ? (
        <>
          <p className="hint">
            장소를 <b>검색</b>하거나 지도를 <b>직접 탭</b>하면 번호 핀이 찍히고, 찍은 순서대로 선이 이어져요.
          </p>
          {draft && (
            <form className="card form" onSubmit={addPlace}>
              <p>이 자리에 어떤 곳을 추가할까요?</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="장소 이름 (예: 우진해장국)"
                maxLength={20}
                autoFocus
              />
              <div className="row">
                <button className="primary" disabled={!name.trim()}>
                  핀 찍기
                </button>
                <button type="button" className="ghost" onClick={() => setDraft(null)}>
                  취소
                </button>
              </div>
            </form>
          )}
          {places.length > 0 && (
            <ol className="place-list">
              {places.map((p, i) => (
                <li key={p.id} className="card region-item">
                  <span className="place-no" style={{ '--pc': memberById(db, p.added_by)?.color }}>
                    {i + 1}
                  </span>
                  <button className="region-name" onClick={() => mapRef.current?.flyTo([p.lat, p.lng], 15)}>
                    {p.name}
                  </button>
                  <small>{memberName(db, p.added_by)}</small>
                  <button
                    className="x"
                    aria-label="삭제"
                    onClick={async () => {
                      if (await confirmDlg(`'${p.name}' 핀을 삭제할까요?`, { okLabel: '삭제', danger: true })) {
                        await store.removePlace(p.id)
                        refresh()
                      }
                    }}
                  >
                    <X size={16} weight="bold" />
                  </button>
                </li>
              ))}
            </ol>
          )}
          {places.length === 0 && !draft && (
            <div className="empty card">
              <MapPin size={30} weight="duotone" />
              <span>아직 찍은 곳이 없어요. 위 검색창이나 지도 탭으로 첫 핀을 찍어보세요.</span>
            </div>
          )}
        </>
      ) : (
        <>
          {regions.length === 0 && (
            <div className="empty card">
              <MapPin size={30} weight="duotone" />
              <span>아직 담은 후보지가 없어요. 지도에서 지역을 탭해 보세요.</span>
            </div>
          )}
          {regions.length > 0 && (
            <ul className="region-list">
              {regions.map((r) => (
                <li key={r.id} className="card region-item">
                  <button className="region-name" onClick={() => openRegion(r)}>
                    <MapPin size={17} weight="fill" color={memberById(db, r.added_by)?.color} />
                    {r.name}
                  </button>
                  <small className="num">핀 {placeCount(r.id)}개</small>
                  <small>{memberName(db, r.added_by)} 담음</small>
                  <button
                    className="x"
                    aria-label="삭제"
                    onClick={async () => {
                      if (
                        await confirmDlg(`'${r.name}' 후보지를 삭제할까요?\n안에 찍은 핀도 함께 삭제돼요.`, {
                          okLabel: '삭제',
                          danger: true,
                        })
                      ) {
                        await store.removeRegion(r.id)
                        refresh()
                      }
                    }}
                  >
                    <X size={16} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
