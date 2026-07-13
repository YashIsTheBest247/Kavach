import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play, ShieldCheck, Network, ScanLine, MessageSquareWarning, MapPin,
  PhoneCall, ArrowRight, Mic, Target, Workflow, Film, Wand2, Subtitles, TrendingUp, Volume2,
} from 'lucide-react'
import { Logo, RiskBadge, ThemeToggle, LangToggle } from '../components/ui.jsx'
import NewsTicker from '../components/NewsTicker.jsx'
import { analyzeScam } from '../api.js'
import { useLang, t } from '../i18n.js'
import { useReveal } from '../useReveal.js'

const NAV = [
  { en: 'HOME', hi: 'होम', href: '#home' },
  { en: 'FEATURES', hi: 'विशेषताएँ', href: '#features' },
  { en: 'LIVE DEMO', hi: 'लाइव डेमो', href: '#demo' },
  { en: 'REELS', hi: 'रील्स', href: '#reels' },
  { en: 'NEWS', hi: 'समाचार', to: '/console/news' },
]

const FEATURES = [
  { icon: Workflow, to: '/console/fusion', en: 'Agentic Threat Fusion', hi: 'एजेंटिक थ्रेट फ्यूज़न',
    den: 'Cooperating agents correlate the scam, fraud ring and geo context, then auto-draft citizen, telecom and MHA-NCRP responses — one coordinated brain.',
    dhi: 'सहयोगी एजेंट घोटाले, फ्रॉड रिंग और भू-संदर्भ को जोड़ते हैं, फिर नागरिक, टेलीकॉम और MHA-NCRP प्रतिक्रियाएँ स्वतः तैयार करते हैं — एक समन्वित मस्तिष्क।' },
  { icon: MessageSquareWarning, to: '/console/scam-detector', en: 'Digital Arrest Detector', hi: 'डिजिटल अरेस्ट डिटेक्टर',
    den: 'Real-time classifier that flags fake-CBI / digital-arrest scripts before money moves — with an explainable evidence trail.',
    dhi: 'रियल-टाइम क्लासिफायर जो पैसे जाने से पहले नकली-CBI / डिजिटल-अरेस्ट स्क्रिप्ट को पकड़ता है — व्याख्यायोग्य साक्ष्य के साथ।' },
  { icon: Mic, to: '/console/voice-spoof', en: 'Voice-Spoof Detection', hi: 'वॉइस-स्पूफ़ डिटेक्शन',
    den: 'Explainable audio forensics that flags AI-cloned / synthetic voices used in scam calls — try it with built-in demo clips.',
    dhi: 'व्याख्यायोग्य ऑडियो फोरेंसिक जो घोटाला कॉल में इस्तेमाल AI-क्लोन / सिंथेटिक आवाज़ों को पकड़ता है — बिल्ट-इन डेमो क्लिप के साथ आज़माएँ।' },
  { icon: Network, to: '/console/fraud-graph', en: 'Fraud Network Graph', hi: 'फ्रॉड नेटवर्क ग्राफ़',
    den: 'Clusters victims, mule accounts and spoofed numbers into coordinated rings and emits court-auditable intelligence packages.',
    dhi: 'पीड़ितों, म्यूल खातों और स्पूफ़ नंबरों को समन्वित रिंग में जोड़ता है और कोर्ट-योग्य इंटेलिजेंस पैकेज बनाता है।' },
  { icon: ScanLine, to: '/console/counterfeit', en: 'Counterfeit Currency Screen', hi: 'नकली नोट स्क्रीनिंग',
    den: 'On-device image forensics + security-feature checklist to screen FICN at the point of contact.',
    dhi: 'संपर्क बिंदु पर नकली नोट जाँचने के लिए डिवाइस पर इमेज फोरेंसिक + सुरक्षा-फ़ीचर चेकलिस्ट।' },
  { icon: PhoneCall, to: '/console/fraud-shield', en: 'Citizen Fraud Shield', hi: 'नागरिक फ्रॉड शील्ड',
    den: 'Multi-channel assistant giving instant scam verdicts and guided reporting in 6 Indian languages.',
    dhi: 'मल्टी-चैनल सहायक जो 6 भारतीय भाषाओं में तुरंत घोटाला निर्णय और मार्गदर्शित रिपोर्टिंग देता है।' },
  { icon: MapPin, to: '/console/crime-map', en: 'Geospatial Crime Map', hi: 'भू-स्थानिक क्राइम मैप',
    den: 'Live hotspot map of fraud complaints and FICN seizures for patrol prioritisation and inter-district sharing.',
    dhi: 'गश्त प्राथमिकता और अंतर-ज़िला साझाकरण के लिए फ्रॉड शिकायतों और नकली नोट ज़ब्ती का लाइव हॉटस्पॉट मैप।' },
  { icon: Target, to: '/console/metrics', en: 'Measured Metrics', hi: 'मापे गए मेट्रिक्स',
    den: 'Precision, recall and false-positive/negative rates on labelled hold-out sets — the numbers that actually save lives.',
    dhi: 'लेबल किए गए डेटासेट पर प्रिसिज़न, रिकॉल और फ़ॉल्स-पॉज़िटिव/नेगेटिव दरें — वे आँकड़े जो वास्तव में जान बचाते हैं।' },
  { icon: ShieldCheck, to: '/console', en: 'Command Dashboard', hi: 'कमांड डैशबोर्ड',
    den: 'Unified situational picture: detection volumes, rings tracked, rupees protected and response latency.',
    dhi: 'एकीकृत स्थिति चित्र: डिटेक्शन मात्रा, ट्रैक की गई रिंग, बचाए गए रुपये और प्रतिक्रिया विलंब।' },
]

export default function Landing() {
  useLang()
  return (
    <div id="home" className="min-h-screen bg-ink-900 text-gray-200 fade-in">
      <NewsTicker />
      <TopNav />
      <Hero />
      <LiveDemo />
      <Features />
      <ReelsShowcase />
      <Footer />
    </div>
  )
}

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-900/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            n.to ? (
              <Link key={n.en} to={n.to}
                className="text-xs font-600 tracking-widest text-brand hover:text-brand-400 transition-colors">
                {t(n.en, n.hi)}
              </Link>
            ) : (
              <a key={n.en} href={n.href}
                className="text-xs font-600 tracking-widest text-gray-300 hover:text-brand transition-colors">
                {t(n.en, n.hi)}
              </a>
            )
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <LangToggle />
          <ThemeToggle />
          <Link to="/console"
            className="bg-brand hover:bg-brand-600 text-black font-700 text-xs md:text-sm px-3 md:px-5 py-2.5 rounded transition-colors shadow-glow">
            {t('LAUNCH CONSOLE', 'कंसोल खोलें')}
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative hero-bokeh overflow-hidden">
      <div className="absolute inset-0 diag-stripes" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900" />
      <div className="relative mx-auto max-w-6xl px-5 py-10 md:py-12 text-center">
        <div className="text-gray-400 text-xs md:text-sm tracking-[0.2em] uppercase mb-3">
          {t('₹1,776 crore stolen in 9 months. The data existed. The defence did not.',
             '9 महीनों में ₹1,776 करोड़ की चोरी। डेटा मौजूद था। बचाव नहीं।')}
        </div>
        <h1 className="font-display font-700 uppercase leading-[0.92] text-white text-4xl md:text-5xl">
          {t('Can you spot a scam', 'क्या आप घोटाला पहचान सकते हैं')}<br />
          <span className="text-brand">{t('before it steals everything?', 'इससे पहले कि वह सब कुछ लूट ले?')}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-400 text-sm md:text-[15px] leading-relaxed">
          {t('Kavach AI is a Digital Public Safety Intelligence platform that detects digital-arrest scams, maps fraud networks, screens counterfeit currency and shields citizens — shifting law enforcement from reactive investigation to predictive threat neutralisation.',
             'कवच AI एक डिजिटल पब्लिक सेफ्टी इंटेलिजेंस प्लेटफ़ॉर्म है जो डिजिटल-अरेस्ट घोटालों का पता लगाता है, फ्रॉड नेटवर्क मैप करता है, नकली नोट जाँचता है और नागरिकों की रक्षा करता है — कानून प्रवर्तन को प्रतिक्रियात्मक जाँच से पूर्वानुमानित खतरा-निष्प्रभावन की ओर ले जाता है।')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/console"
            className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-black font-700 px-7 py-3.5 rounded transition-colors shadow-glow">
            {t('ENTER COMMAND CENTRE', 'कमांड सेंटर में प्रवेश करें')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#demo"
            className="inline-flex items-center gap-3 text-gray-200 hover:text-brand transition-colors">
            <span className="relative grid place-items-center w-12 h-12 rounded-full border border-brand/60 pulse-ring">
              <Play size={18} className="text-brand fill-brand ml-0.5" />
            </span>
            <span className="text-sm font-600 tracking-wide">{t('Try live detection', 'लाइव डिटेक्शन आज़माएँ')}</span>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
          {[
            ['1.14M', t('Cybercrime complaints, 2023', 'साइबर अपराध शिकायतें, 2023')],
            ['+60%', t('YoY growth in complaints', 'शिकायतों में वार्षिक वृद्धि')],
            ['₹1,776 Cr', t('Digital-arrest loss (9m 2024)', 'डिजिटल-अरेस्ट हानि (9 माह 2024)')],
            ['38 ms', t('Avg. detection latency', 'औसत डिटेक्शन विलंब')],
          ].map(([v, l]) => (
            <div key={v} className="bg-ink-800 px-4 py-5">
              <div className="font-display text-3xl font-700 text-brand">{v}</div>
              <div className="text-[11px] text-gray-400 mt-1 leading-tight">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PRESET = "Sir I am Inspector from CBI. Your Aadhaar is linked to a money laundering case and there is an arrest warrant. You are under digital arrest — do not disconnect this video call and do not tell anyone. Transfer all your funds to this RBI verification account immediately to prove innocence, it is refundable."

function LiveDemo() {
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      setRes(await analyzeScam(text, 'Demo', 'en'))
    } catch (e) {
      setRes({ error: t('Backend not reachable. Start the FastAPI server on :8000.', 'बैकएंड उपलब्ध नहीं। :8000 पर FastAPI सर्वर शुरू करें।') })
    } finally {
      setLoading(false)
    }
  }

  const headRef = useReveal()
  return (
    <section id="demo" className="bg-ink-900">
      <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
        <div ref={headRef} className="reveal text-center mb-10">
          <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3">{t('Try it now', 'अभी आज़माएँ')}</div>
          <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white">
            {t('Paste a suspicious', 'कोई संदिग्ध')} <span className="text-brand">{t('message or call', 'संदेश या कॉल पेस्ट करें')}</span>
          </h2>
          <p className="text-gray-400 text-sm mt-3">{t('Real engine. Real verdict. No sign-up.', 'असली इंजन। असली निर्णय। कोई साइन-अप नहीं।')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-700 p-6 md:p-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full bg-ink-900 border border-ink-500 rounded-lg p-4 text-sm text-gray-200 focus:outline-none focus:border-brand resize-none"
            placeholder={t('Paste the message or call transcript here…', 'संदेश या कॉल ट्रांसक्रिप्ट यहाँ पेस्ट करें…')}
          />
          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <button onClick={() => { setText(PRESET); setRes(null) }}
              className="inline-flex items-center gap-2 border border-white/15 hover:border-brand/50 text-gray-300 hover:text-white text-sm px-4 py-2.5 rounded transition-colors">
              {t('Load test phrase', 'टेस्ट वाक्य लोड करें')}
            </button>
            <button onClick={run} disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 disabled:opacity-50 text-black font-700 px-6 py-2.5 rounded transition-colors">
              {loading ? t('Analysing…', 'विश्लेषण हो रहा है…') : t('Analyse threat', 'खतरे का विश्लेषण करें')}
            </button>
          </div>

          {res && !res.error && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <RiskBadge level={res.risk_level} />
                  <span className="text-gray-300 text-sm">
                    {t('Risk score', 'जोखिम स्कोर')} <span className="font-display text-2xl text-white font-700">{res.risk_score}</span>/100
                  </span>
                </div>
                <span className="text-xs text-gray-500">{t('confidence', 'विश्वास')} {Math.round(res.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-gray-300 mt-4">{res.summary}</p>
              {res.tactics_detected?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {res.tactics_detected.map((tac) => (
                    <span key={tac} className="text-xs bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full">{tac}</span>
                  ))}
                </div>
              )}
              <Link to="/console/scam-detector"
                className="inline-flex items-center gap-1.5 text-brand text-sm font-600 mt-5 hover:gap-2.5 transition-all">
                {t('Open full detector with evidence trail', 'साक्ष्य ट्रेल के साथ पूरा डिटेक्टर खोलें')} <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {res?.error && <p className="mt-5 text-sm text-red-400">{res.error}</p>}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const headRef = useReveal()
  const gridRef = useReveal({ threshold: 0.1 })
  return (
    <section id="features" className="bg-ink-800 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div ref={headRef} className="reveal text-center mb-14">
          <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3">{t('Capabilities', 'क्षमताएँ')}</div>
          <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white">{t('Main Features', 'मुख्य विशेषताएँ')}</h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-brand rounded-full" />
        </div>
        <div ref={gridRef} className="reveal-stagger grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link key={f.to + f.en} to={f.to}
              className="group rounded-xl border border-white/8 bg-ink-700 p-7 hover:border-brand/50 hover:-translate-y-1 transition-all">
              <div className="grid place-items-center w-12 h-12 rounded-lg bg-brand/15 text-brand mb-5 group-hover:bg-brand group-hover:text-black transition-colors">
                <f.icon size={22} />
              </div>
              <h3 className="font-display font-600 text-white text-xl">{t(f.en, f.hi)}</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{t(f.den, f.dhi)}</p>
              <div className="inline-flex items-center gap-1.5 text-brand text-sm font-600 mt-4 group-hover:gap-2.5 transition-all">
                {t('Open tool', 'टूल खोलें')} <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReelsShowcase() {
  const steps = [
    { icon: TrendingUp, en: 'Ranks trending fraud news', hi: 'ट्रेंडिंग फ्रॉड समाचार रैंक करता है' },
    { icon: Wand2, en: 'AI writes the script', hi: 'AI स्क्रिप्ट लिखता है' },
    { icon: Volume2, en: 'Neural voice narration', hi: 'न्यूरल आवाज़ नैरेशन' },
    { icon: Subtitles, en: 'Burned-in subtitles', hi: 'सबटाइटल जोड़े जाते हैं' },
  ]
  const copyRef = useReveal()
  const phoneRef = useReveal({ threshold: 0.2 })
  return (
    <section id="reels" className="relative bg-ink-900 overflow-hidden">
      <div className="absolute inset-0 diag-stripes opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* copy */}
        <div ref={copyRef} className="reveal">
          <div className="text-brand text-xs font-700 tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
            <Film size={14} /> {t('Awareness Automation Agent', 'जागरूकता ऑटोमेशन एजेंट')}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-700 uppercase text-white leading-tight">
            {t('Turn fraud news into', 'फ्रॉड समाचार को बदलें')}{' '}
            <span className="text-brand">{t('scroll-stopping reels', 'ध्यान खींचने वाली रील्स में')}</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-[15px] mt-4 leading-relaxed max-w-xl">
            {t('An autonomous agent ranks the top Economic Times cyber-fraud stories, writes a punchy script, narrates it in a neural voice (English or Hindi, male or female) and renders a fully-subtitled awareness reel — ready to publish. Prevention that scales at the speed of social media.',
               'एक स्वायत्त एजेंट शीर्ष इकोनॉमिक टाइम्स साइबर-फ्रॉड कहानियों को रैंक करता है, दमदार स्क्रिप्ट लिखता है, उसे न्यूरल आवाज़ (अंग्रेज़ी या हिन्दी, पुरुष या महिला) में सुनाता है और पूरी तरह सबटाइटल जागरूकता रील बनाता है — प्रकाशन के लिए तैयार। सोशल मीडिया की गति से बढ़ता बचाव।')}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 max-w-md">
            {steps.map((s) => (
              <div key={s.en} className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-ink-700 px-3 py-2.5">
                <span className="grid place-items-center w-8 h-8 shrink-0 rounded-lg bg-brand/15 text-brand"><s.icon size={16} /></span>
                <span className="text-xs text-gray-300 font-600 leading-tight">{t(s.en, s.hi)}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link to="/console/reels"
              className="group inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-black font-700 px-7 py-3.5 rounded transition-colors shadow-glow">
              {t('Generate a reel', 'रील बनाएँ')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/console/api" className="text-sm font-600 text-gray-300 hover:text-brand transition-colors">
              {t('See the automation API →', 'ऑटोमेशन API देखें →')}
            </Link>
          </div>
        </div>

        {/* phone mockup */}
        <div ref={phoneRef} className="reveal flex justify-center lg:justify-end">
          <ReelPhone />
        </div>
      </div>
    </section>
  )
}

function ReelPhone() {
  return (
    <div className="relative w-[260px] sm:w-[300px]">
      {/* glow */}
      <div className="absolute -inset-6 bg-brand/20 blur-3xl rounded-full" />
      <div className="relative aspect-[9/16] rounded-[2.2rem] border-[6px] border-ink-500 bg-black overflow-hidden shadow-2xl">
        {/* faux reel background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-700 via-ink-800 to-black" />
        <div className="absolute inset-0 diag-stripes opacity-30" />
        {/* notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded-full bg-white/20 z-20" />
        {/* brand watermark */}
        <div className="absolute top-6 left-4 z-10">
          <div className="font-display font-700 text-brand text-lg leading-none">KAVACH AI</div>
          <div className="text-[8px] tracking-[0.25em] text-white/70 mt-0.5">SCAM AWARENESS</div>
        </div>
        {/* centre play pulse */}
        <div className="absolute inset-0 grid place-items-center z-10">
          <span className="relative grid place-items-center w-16 h-16 rounded-full border border-brand/60 pulse-ring bg-black/30 backdrop-blur-sm">
            <Play size={26} className="text-brand fill-brand ml-1" />
          </span>
        </div>
        {/* bottom gradient + subtitle */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-10 px-4 z-20 text-center">
          <p className="font-display font-700 text-white text-[15px] leading-snug drop-shadow-lg">
            {t('“You are under digital arrest” — it’s a SCAM.', '“आप डिजिटल अरेस्ट में हैं” — यह घोटाला है।')}
          </p>
        </div>
        {/* progress bar */}
        <div className="absolute bottom-4 inset-x-4 h-1 rounded-full bg-white/20 z-20 overflow-hidden">
          <div className="h-full w-2/3 bg-brand" />
        </div>
        {/* live caption chip */}
        <div className="absolute top-6 right-4 z-20 inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-700 text-white">
          <Volume2 size={10} /> {t('LIVE', 'लाइव')}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-800">
      <div className="mx-auto max-w-7xl px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-xs text-gray-500 text-center">
          {t('Helpline', 'हेल्पलाइन')}{' '}
          <a href="tel:1930" className="text-brand font-600 hover:underline">1930</a> ·{' '}
          <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="hover:text-brand hover:underline">cybercrime.gov.in</a>
        </p>
      </div>
    </footer>
  )
}
