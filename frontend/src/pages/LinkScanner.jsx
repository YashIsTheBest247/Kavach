import { useState } from 'react'
import { Link2, ShieldAlert, ListChecks, Search, AlertTriangle, ArrowDownRight } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Spinner } from '../components/ui.jsx'
import { scanLink } from '../api.js'
import { useLang, t } from '../i18n.js'

const SAMPLES = [
  ['http://sbi-kyc-verify.xyz/login@secure-update', 'Fake SBI KYC (phishing)'],
  ['https://bit.ly/3xR2fake', 'Shortened link'],
  ['http://192.168.4.11/paytm/wallet/verify', 'Raw IP + brand bait'],
  ['https://www.onlinesbi.sbi', 'Genuine SBI'],
]

export default function LinkScanner() {
  const [url, setUrl] = useState(SAMPLES[0][0])
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  useLang()

  const run = async () => {
    if (!url.trim()) return
    setLoading(true)
    try { setRes(await scanLink(url)) }
    catch { setRes({ error: 'Backend not reachable on :8000' }) }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title={t('Link / QR', 'लिंक / QR')} accent={t('Phishing Scanner', 'फ़िशिंग स्कैनर')}
        subtitle={t('Check a suspicious link before you tap — every risk factor is explained and weighted',
          'टैप करने से पहले संदिग्ध लिंक जाँचें — हर जोखिम कारक समझाया व भारित किया गया है')} />
      <div className="p-4 md:p-8 grid lg:grid-cols-2 gap-6">
        {/* input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <label className="text-sm font-600 text-gray-300 flex items-center gap-2 mb-3">
              <Link2 size={16} className="text-brand" /> {t('URL or QR-decoded link', 'URL या QR-डिकोडेड लिंक')}
            </label>
            <div className="flex gap-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run()}
                className="flex-1 bg-ink-900 border border-ink-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
                placeholder="https://..." />
              <button onClick={run} disabled={loading}
                className="shrink-0 inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-60 text-black font-700 px-4 rounded transition-colors">
                <Search size={16} /> {t('Scan', 'स्कैन')}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {t('Decode a QR with your phone camera, then paste the link it reveals here before opening it.',
                'अपने फ़ोन कैमरे से QR डिकोड करें, फिर खोलने से पहले उससे मिला लिंक यहाँ पेस्ट करें।')}
            </p>
          </div>

          <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
            <div className="text-xs font-600 text-gray-400 uppercase tracking-wider mb-3">{t('Try a sample', 'नमूना आज़माएँ')}</div>
            <div className="space-y-2">
              {SAMPLES.map(([u, label]) => (
                <button key={u} onClick={() => { setUrl(u); setRes(null) }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-ink-900 border border-white/8 hover:border-brand/40 transition-colors">
                  <div className="text-sm text-gray-200 font-600">{label}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">{u}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* output */}
        <div className="space-y-4">
          {loading && <div className="rounded-xl border border-white/8 bg-ink-700 p-6"><Spinner label={t('Scanning…', 'स्कैन हो रहा है…')} /></div>}
          {res?.error && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400 text-sm">{res.error}</div>}
          {res && !res.error && !loading && (
            <>
              <div className={`rounded-xl border p-6 ${res.risk_level === 'HIGH' ? 'border-red-500/40 bg-red-500/5' : res.risk_level === 'MEDIUM' ? 'border-orange-500/40 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-xs text-gray-500 font-mono truncate max-w-[55%]">{res.host}</span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-700 text-white leading-none">{res.risk_score}</span>
                  <span className="text-gray-500 mb-1">/ 100 {t('risk', 'जोखिम')}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ink-900 overflow-hidden">
                  <div className={`h-full ${res.risk_score >= 60 ? 'bg-red-500' : res.risk_score >= 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.risk_score}%` }} />
                </div>
                <p className={`text-sm font-600 mt-4 ${res.risk_level === 'HIGH' ? 'text-red-300' : res.risk_level === 'MEDIUM' ? 'text-orange-300' : 'text-emerald-300'}`}>{res.verdict}</p>
              </div>

              <div className="rounded-xl border border-white/8 bg-ink-700 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-brand" /> {t('Risk factors', 'जोखिम कारक')}
                </h3>
                {res.factors?.length ? (
                  <div className="space-y-2">
                    {res.factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-mono bg-red-500/10 text-red-300 px-2 py-0.5 rounded">
                          <ArrowDownRight size={12} /> +{f.impact}
                        </span>
                        <div className="min-w-0">
                          <div className="text-gray-200 font-600">{f.factor}</div>
                          <div className="text-gray-500 text-xs">{f.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-300">{t('No phishing indicators detected in this link.', 'इस लिंक में कोई फ़िशिंग संकेत नहीं मिला।')}</p>
                )}
              </div>

              <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
                <h3 className="font-display font-600 text-white flex items-center gap-2 mb-3">
                  <ListChecks size={18} className="text-brand" /> {t('Recommended actions', 'अनुशंसित कार्रवाई')}
                </h3>
                <ol className="space-y-2">
                  {res.recommended_actions.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-200">
                      <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-brand text-black text-xs font-700">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
          {!res && !loading && (
            <div className="rounded-xl border border-dashed border-white/10 bg-ink-700/50 p-10 text-center text-gray-500">
              <ShieldAlert size={40} className="mx-auto mb-3 text-gray-600" />
              {t('Paste a link or pick a sample, then hit', 'लिंक पेस्ट करें या नमूना चुनें, फिर दबाएँ')} <span className="text-brand">{t('Scan', 'स्कैन')}</span>.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
