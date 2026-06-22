import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { MapPin, TrendingUp, IndianRupee } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { Spinner } from '../components/ui.jsx'
import { getHotspots } from '../api.js'
import { useTheme } from '../theme.js'

export default function CrimeMap() {
  const [spots, setSpots] = useState(null)
  const [err, setErr] = useState(null)
  const theme = useTheme()

  useEffect(() => {
    getHotspots().then((d) => setSpots(d.hotspots)).catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  const max = spots ? Math.max(...spots.map((s) => s.complaints)) : 1
  const radius = (c) => 8 + (c / max) * 26
  const color = (scam) =>
    scam.includes('Digital Arrest') ? '#ff6b6b'
      : scam.includes('Counterfeit') ? '#ffa94d'
        : scam.includes('Parcel') ? '#ffd43b' : '#4dabf7'

  const sorted = spots ? [...spots].sort((a, b) => b.complaints - a.complaints) : []

  return (
    <>
      <PageHeader title="Geospatial" accent="Crime Map"
        subtitle="Fraud complaint & FICN-seizure hotspots for patrol prioritisation and inter-district sharing" />
      <div className="p-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/8 bg-ink-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
            <MapPin size={18} className="text-brand" />
            <h3 className="font-display font-600 text-white">India fraud hotspots</h3>
            <span className="text-xs text-gray-500 ml-auto">bubble size = complaint volume</span>
          </div>
          <div className="h-[520px]">
            {err && <div className="p-6 text-red-400 text-sm">{err}</div>}
            {!spots && !err && <div className="p-6"><Spinner label="Loading map…" /></div>}
            {spots && (
              <MapContainer center={[22.5, 79]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  key={theme}
                  attribution='&copy; OpenStreetMap, &copy; CARTO'
                  url={theme === 'light'
                    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'}
                />
                {spots.map((s) => (
                  <CircleMarker key={s.city} center={[s.lat, s.lng]} radius={radius(s.complaints)}
                    pathOptions={{ color: color(s.top_scam), fillColor: color(s.top_scam), fillOpacity: 0.45, weight: 1.5 }}>
                    <Tooltip>{s.city}</Tooltip>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-700">{s.city}</div>
                        <div>Complaints: {s.complaints.toLocaleString()}</div>
                        <div>Loss: ₹{s.loss_cr} cr</div>
                        <div>Top scam: {s.top_scam}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-display font-600 text-white text-lg">Top hotspots</h3>
          {sorted.map((s, i) => (
            <div key={s.city} className="rounded-xl border border-white/8 bg-ink-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-700 text-gray-600 w-6">{i + 1}</span>
                  <div>
                    <div className="text-white font-600">{s.city}</div>
                    <div className="text-xs" style={{ color: color(s.top_scam) }}>{s.top_scam}</div>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full" style={{ background: color(s.top_scam) }} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><TrendingUp size={12} className="text-brand" /> {s.complaints.toLocaleString()}</span>
                <span className="flex items-center gap-1"><IndianRupee size={12} className="text-brand" /> {s.loss_cr} cr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
