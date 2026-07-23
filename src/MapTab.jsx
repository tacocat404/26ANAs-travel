import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, X } from '@phosphor-icons/react'
import { store } from './store.js'
import { memberById, memberName } from './utils.js'

// 핀은 추가한 사람의 색으로 칠해진다. (앱 전체 원칙: 색 = 사람)
const pinIcon = (color, draft = false) =>
  L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin-dot${draft ? ' draft' : ''}"${color ? ` style="--pc:${color}"` : ''}></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  })

export default function MapTab({ db, me, trip, refresh }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [draft, setDraft] = useState(null)
  const [name, setName] = useState('')

  const regions = db.regions.filter((r) => r.trip_id === trip.id)

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapEl.current).setView([36.4, 127.9], 6)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e) => setDraft({ lat: e.latlng.lat, lng: e.latlng.lng }))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    for (const r of regions) {
      const color = memberById(db, r.added_by)?.color
      L.marker([r.lat, r.lng], { icon: pinIcon(color) }).addTo(layer).bindPopup(r.name)
    }
    if (draft) L.marker([draft.lat, draft.lng], { icon: pinIcon(null, true) }).addTo(layer)
  }, [db.regions, db.members, draft, trip.id])

  const addDraft = async (e) => {
    e.preventDefault()
    if (!name.trim() || !draft) return
    await store.addRegion({ trip_id: trip.id, name: name.trim(), lat: draft.lat, lng: draft.lng, added_by: me.id })
    setDraft(null)
    setName('')
    refresh()
  }

  return (
    <div className="tab-body">
      <p className="hint">
        지도를 탭해서 가고 싶은 후보지를 추가해 보세요. 핀 색깔은 <b>추가한 사람의 색</b>이에요.
      </p>
      <div ref={mapEl} className="map card" />
      {draft && (
        <form className="card form" onSubmit={addDraft}>
          <p>선택한 위치를 후보지로 추가할까요?</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="지역 이름 (예: 제주 애월)"
            maxLength={20}
            autoFocus
          />
          <div className="row">
            <button className="primary" disabled={!name.trim()}>
              추가
            </button>
            <button type="button" className="ghost" onClick={() => setDraft(null)}>
              취소
            </button>
          </div>
        </form>
      )}
      {regions.length === 0 && !draft && (
        <div className="empty card">
          <MapPin size={30} weight="duotone" />
          <span>아직 후보지가 없어요. 지도를 탭해 보세요.</span>
        </div>
      )}
      <ul className="region-list">
        {regions.map((r) => (
          <li key={r.id} className="card region-item">
            <button className="region-name" onClick={() => mapRef.current?.flyTo([r.lat, r.lng], 10)}>
              <MapPin size={16} weight="fill" color={memberById(db, r.added_by)?.color} />
              {r.name}
            </button>
            <small>{memberName(db, r.added_by)} 추가</small>
            <button
              className="x"
              onClick={async () => {
                if (confirm(`'${r.name}' 후보지를 삭제할까요?`)) {
                  await store.removeRegion(r.id)
                  refresh()
                }
              }}
              aria-label="삭제"
            >
              <X size={16} weight="bold" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
