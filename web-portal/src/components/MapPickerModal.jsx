import React, { useEffect, useRef, useState } from 'react'

// Lightweight Leaflet loader via CDN (no npm install required)
function useLeaflet() {
  const [ready, setReady] = useState(!!window.L)
  useEffect(() => {
    if (window.L) { setReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setReady(true)
    document.body.appendChild(script)

    return () => {
      // keep cached for future opens
    }
  }, [])
  return ready
}

export default function MapPickerModal({ open, onClose, onPick, initialLat, initialLng }) {
  const ready = useLeaflet()
  const mapRef = useRef(null)
  const mapElRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!open || !ready) return
    const L = window.L
    if (!mapRef.current) {
      mapRef.current = L.map(mapElRef.current).setView([initialLat || 33.5138, initialLng || 36.2765], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current)
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
          markerRef.current.on('dragend', () => {
            const p = markerRef.current.getLatLng()
            onPick?.({ latitude: p.lat, longitude: p.lng })
          })
        } else {
          markerRef.current.setLatLng([lat, lng])
        }
        onPick?.({ latitude: lat, longitude: lng })
      })
    } else {
      // resize when reopening
      setTimeout(() => mapRef.current.invalidateSize(), 0)
      if (initialLat && initialLng) {
        mapRef.current.setView([initialLat, initialLng], 10)
      }
    }
  }, [open, ready])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1200]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[min(95vw,900px)] h-[70vh] border" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Pick location on map</h3>
          <button className="px-2 py-1 rounded hover:bg-gray-100" onClick={onClose}>✕</button>
        </div>
        <div className="h-[calc(100%-48px)]">
          <div ref={mapElRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  )
}


