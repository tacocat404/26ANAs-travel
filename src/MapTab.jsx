import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { store } from './store.js'
import { memberName } from './utils.js'

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
    const pin = (html, cls) => L.divIcon({ className: 'pin ' + cls, html, iconSize: [28, 28], iconAnchor: [14, 26] })
    for (const r of regions) {
      L.marker([r.lat, r.lng], { icon: pin('📍', '') }).addTo(layer).bindPopup(r.name)
    }
    if (draft) L.marker([draft.lat, draft.lng], { icon: pin('❓', 'draft') }).addTo(layer)
  }, [db.regions, draft, trip.id])

  const addDraft = async (e) => {
    e.preventDefault()
    if (!name.trim() || !draft) return
    await store.addRegion({ trip_id: trip.id, name: name.trim(), lat: draft.lat, lng: draft.lng, added_by: me.id })
    setDraft(null)
    setName('')
    refresh()
  }

  return (
    <div>
      <p className="hint">🗺️ 지도를 탭해서 가고 싶은 후보지를 추가해 보세요.</p>
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
      {regions.length === 0 && !draft && <div className="empty card">아직 후보지가 없어요. 지도를 탭해 보세요! 📍</div>}
      <ul className="region-list">
        {regions.map((r) => (
          <li key={r.id} className="card region-item">
            <button className="region-name" onClick={() => mapRef.current?.flyTo([r.lat, r.lng], 10)}>
              📍 {r.name}
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
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
