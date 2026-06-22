import { useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Network, AlertOctagon, Users, CreditCard, Phone } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { getFraudGraph, getFraudPackages } from '../api.js'

const TYPE_COLOR = {
  victim: '#4dabf7',
  scammer_phone: '#ff8787',
  mule_account: '#ffa94d',
  device: '#b197fc',
  voip_gateway: '#ff6b6b',
  kingpin: '#ff0040',
}
const TYPE_LABEL = {
  victim: 'Victim', scammer_phone: 'Scammer number', mule_account: 'Mule account',
  device: 'Device', voip_gateway: 'VoIP gateway', kingpin: 'Kingpin / hub wallet',
}

export default function FraudGraph() {
  const [data, setData] = useState(null)
  const [packages, setPackages] = useState([])
  const [hover, setHover] = useState(null)
  const [err, setErr] = useState(null)
  const wrapRef = useRef(null)
  const fgRef = useRef(null)
  const [dims, setDims] = useState({ w: 600, h: 460 })

  useEffect(() => {
    Promise.all([getFraudGraph(), getFraudPackages()])
      .then(([g, p]) => {
        setData({
          nodes: g.nodes.map((n) => ({ ...n, val: n.type === 'kingpin' ? 12 : n.type === 'mule_account' ? 8 : 5 })),
          links: g.edges.map((e) => ({ ...e })),
        })
        setPackages(p.packages)
      })
      .catch(() => setErr('Backend not reachable on :8000'))
  }, [])

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setDims({ w: r.width, h: Math.max(440, r.height) })
    })
    if (wrapRef.current) obs.observe(wrapRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <PageHeader title="Fraud Network" accent="Graph Intelligence"
        subtitle="Clusters victims, mule accounts and spoofed numbers into coordinated rings" />
      <div className="p-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/8 bg-ink-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-600 text-white flex items-center gap-2">
              <Network size={18} className="text-brand" /> Entity graph
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <span key={k} className="text-[11px] text-gray-400 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLOR[k] }} /> {v}
                </span>
              ))}
            </div>
          </div>
          <div ref={wrapRef} className="h-[460px] relative">
            {err && <div className="p-6 text-red-400 text-sm">{err}</div>}
            {!data && !err && <div className="p-6"><Spinner label="Building graph…" /></div>}
            {data && (
              <ForceGraph2D
                ref={fgRef}
                graphData={data}
                width={dims.w}
                height={dims.h}
                backgroundColor="#16161a"
                nodeRelSize={5}
                linkColor={() => 'rgba(255,255,255,0.18)'}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1.6}
                linkDirectionalParticleColor={() => '#f7941e'}
                onNodeHover={(n) => setHover(n || null)}
                nodeCanvasObject={(node, ctx, scale) => {
                  const r = (node.val || 5) * 0.7
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
                  ctx.fillStyle = TYPE_COLOR[node.type] || '#888'
                  ctx.fill()
                  if (node.type === 'kingpin') {
                    ctx.strokeStyle = '#ff0040'; ctx.lineWidth = 1.5; ctx.stroke()
                  }
                  if (scale > 1.3 || node.type === 'kingpin' || node.type === 'mule_account') {
                    ctx.font = `${10 / scale + 3}px Inter`
                    ctx.fillStyle = '#cbd5e1'
                    ctx.textAlign = 'center'
                    ctx.fillText(node.label, node.x, node.y + r + 7)
                  }
                }}
              />
            )}
            {hover && (
              <div className="absolute top-3 left-3 bg-ink-900/95 border border-white/10 rounded-lg p-3 text-xs max-w-[220px]">
                <div className="font-600 text-white">{hover.label}</div>
                <div className="text-gray-400">{TYPE_LABEL[hover.type]} · {hover.location}</div>
                {hover.loss > 0 && <div className="text-red-400 mt-1">Loss ₹{(hover.loss / 100000).toFixed(1)}L</div>}
                <div className="text-gray-500 mt-1">risk {Math.round(hover.risk * 100)}%</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display font-600 text-white text-lg">Intelligence packages</h3>
          {packages.map((p) => (
            <div key={p.campaign_id} className="rounded-xl border border-white/8 bg-ink-700 p-5">
              <div className="flex items-center justify-between">
                <span className="font-display font-700 text-white">{p.campaign_id}</span>
                <RiskBadge level={p.priority} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Metric icon={Users} label="Victims" value={p.victim_count} />
                <Metric icon={CreditCard} label="Mule a/cs" value={p.mule_account_count} />
                <Metric icon={Phone} label="Numbers" value={p.scammer_number_count} />
                <Metric icon={AlertOctagon} label="Nodes" value={p.node_count} />
              </div>
              <div className="mt-3 text-sm">
                <span className="text-gray-400">Reported loss </span>
                <span className="text-red-400 font-700">₹{(p.total_reported_loss_inr / 100000).toFixed(1)} L</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Jurisdictions: {p.jurisdictions_spanned.join(', ')}
              </div>
              {p.shared_infrastructure && (
                <div className="mt-3 text-xs bg-red-500/10 text-red-300 border border-red-500/30 rounded px-2 py-1.5">
                  ⚠ Shared mule infrastructure detected — single coordinated network
                </div>
              )}
              <ul className="mt-3 space-y-1.5">
                {p.key_findings.map((f, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-2">
                    <span className="text-brand">▸</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-ink-900 rounded-lg px-3 py-2 border border-white/5">
      <Icon size={15} className="text-brand" />
      <div>
        <div className="text-white font-700 leading-none">{value}</div>
        <div className="text-[10px] text-gray-500">{label}</div>
      </div>
    </div>
  )
}
