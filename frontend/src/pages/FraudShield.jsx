import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ShieldCheck, Phone, Globe, MessageCircle, PhoneCall, Smartphone, ChevronDown } from 'lucide-react'
import { PageHeader } from './ConsoleLayout.jsx'
import { RiskBadge, Select } from '../components/ui.jsx'
import { analyzeScam, getChannels } from '../api.js'
import { useLang, t, getLang } from '../i18n.js'

const CHANNEL_META = [
  { key: 'web', icon: Globe, label: 'Web / App' },
  { key: 'telegram', icon: Send, label: 'Telegram' },
  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { key: 'ivr', icon: PhoneCall, label: 'IVR call' },
]

function ChannelsBar() {
  const [ch, setCh] = useState(null)
  useLang()
  useEffect(() => { getChannels().then(setCh).catch(() => {}) }, [])
  return (
    <div className="max-w-3xl mx-auto mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">{t('Available on', 'उपलब्ध')}:</span>
      {CHANNEL_META.map(({ key, icon: Icon, label }) => {
        const live = ch?.[key]?.status === 'live'
        return (
          <span key={key}
            title={ch?.[key]?.note || ''}
            className={`inline-flex items-center gap-1.5 text-xs rounded-md border px-2.5 py-1 ${
              live ? 'border-white/10 bg-ink-900 text-gray-200'
                   : 'border-dashed border-white/10 bg-transparent text-gray-500'}`}>
            <Icon size={13} className={live ? 'text-brand' : 'text-gray-600'} /> {label}
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-amber-500/70'}`} />
            <span className={live ? 'text-emerald-400 font-600' : 'text-amber-500/80'}>
              {live ? t('live', 'लाइव') : t('ready', 'तैयार')}
            </span>
          </span>
        )
      })}
      {ch && <span className="text-[11px] text-gray-500 ml-auto flex items-center gap-1"><Smartphone size={12} /> {ch.languages?.length || 12} {t('languages', 'भाषाएँ')}</span>}
    </div>
  )
}

const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['ta', 'தமிழ்'],
  ['te', 'తెలుగు'], ['kn', 'ಕನ್ನಡ'], ['mr', 'मराठी'], ['gu', 'ગુજરાતી'],
  ['ml', 'മലയാളം'], ['pa', 'ਪੰਜਾਬੀ'], ['or', 'ଓଡ଼ିଆ'], ['ur', 'اردو'],
]

// Canonical English messages sent to the (English-pattern) detector…
const QUICK_EN = [
  'Caller says he is from CBI and I am under digital arrest, must transfer money to verify.',
  'Got SMS: your KYC expired, click link and share OTP to keep account active.',
  'FedEx says my parcel has drugs, police will arrest me unless I pay now.',
]
// …with localized labels shown on the chips.
const QUICK_LABELS = {
  en: ["Fake CBI 'digital arrest' call", 'KYC-expired OTP phishing SMS', 'FedEx parcel-has-drugs scam'],
  hi: ["नकली CBI 'डिजिटल अरेस्ट' कॉल", 'KYC समाप्ति OTP फ़िशिंग SMS', 'FedEx पार्सल-में-ड्रग्स घोटाला'],
  ta: ["போலி CBI 'டிஜிட்டல் கைது' அழைப்பு", 'KYC காலாவधि OTP ஃபிஷிங் SMS', 'FedEx பார்சல்-போதை மோசடி'],
  kn: ["ನಕಲಿ CBI 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್' ಕರೆ", 'KYC ಅವಧಿ OTP ಫಿಶಿಂಗ್ SMS', 'FedEx ಪಾರ್ಸೆಲ್-ಡ್ರಗ್ಸ್ ವಂಚನೆ'],
  te: ["నకిలీ CBI 'డిజిటల్ అరెస్ట్' కాల్", 'KYC గడువు OTP ఫిషింగ్ SMS', 'FedEx పార్సెల్-డ్రగ్స్ మోసం'],
  bn: ["নকল CBI 'ডিজিটাল অ্যারেস্ট' কল", 'KYC মেয়াদ OTP ফিশিং SMS', 'FedEx পার্সেল-ড্রাগস প্রতারণা'],
  mr: ["बनावट CBI 'डिजिटल अटक' कॉल", 'KYC-कालबाह्य OTP फिशिंग SMS', 'FedEx पार्सल-मध्ये-ड्रग्ज घोटाळा'],
  gu: ["બનાવટી CBI 'ડિજિટલ અરેસ્ટ' કૉલ", 'KYC-સમાપ્ત OTP ફિશિંગ SMS', 'FedEx પાર્સલ-માં-ડ્રગ્સ છેતરપિંડી'],
  ml: ["വ്യാജ CBI 'ഡിജിറ്റൽ അറസ്റ്റ്' കോൾ", 'KYC-കാലഹരണ OTP ഫിഷിംഗ് SMS', 'FedEx പാഴ്‌സൽ-മയക്കുമരുന്ന് തട്ടിപ്പ്'],
  pa: ["ਜਾਅਲੀ CBI 'ਡਿਜੀਟਲ ਅਰੈਸਟ' ਕਾਲ", 'KYC-ਮਿਆਦ OTP ਫਿਸ਼ਿੰਗ SMS', 'FedEx ਪਾਰਸਲ-ਵਿੱਚ-ਡਰੱਗਸ ਧੋਖਾ'],
  or: ["ନକଲି CBI 'ଡିଜିଟାଲ ଆରେଷ୍ଟ' କଲ", 'KYC-ମିଆଦ OTP ଫିଶିଂ SMS', 'FedEx ପାର୍ସଲ-ଡ୍ରଗ୍ସ ଠକେଇ'],
  ur: ["جعلی CBI 'ڈیجیٹل اریسٹ' کال", 'KYC-میعاد OTP فشنگ SMS', 'FedEx پارسل-میں-منشیات فراڈ'],
}

const GREETING = {
  en: 'Namaste 🙏 I am Kavach Shield. Paste any suspicious call, SMS or WhatsApp message and I will tell you in seconds whether it is a scam — and what to do.',
  hi: 'नमस्ते 🙏 मैं कवच शील्ड हूँ। कोई भी संदिग्ध कॉल, SMS या WhatsApp संदेश यहाँ पेस्ट करें और मैं कुछ ही सेकंड में बता दूँगा कि यह घोटाला है या नहीं — और आपको क्या करना चाहिए।',
  ta: 'வணக்கம் 🙏 நான் கவச் ஷீல்டு. சந்தேகமான அழைப்பு, SMS அல்லது WhatsApp செய்தியை இங்கே ஒட்டவும் — அது மோசடியா என்பதை வினாடிகளில் சொல்கிறேன்.',
  kn: 'ನಮಸ್ಕಾರ 🙏 ನಾನು ಕವಚ್ ಶೀಲ್ಡ್. ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ಕರೆ, SMS ಅಥವಾ WhatsApp ಸಂದೇಶವನ್ನು ಅಂಟಿಸಿ — ಅದು ವಂಚನೆಯೇ ಎಂದು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಹೇಳುತ್ತೇನೆ.',
  te: 'నమస్తే 🙏 నేను కవచ్ షీల్డ్. అనుమానాస్పద కాల్, SMS లేదా WhatsApp సందేశాన్ని పేస్ట్ చేయండి — అది మోసమా అని సెకన్లలో చెబుతాను.',
  bn: 'নমস্কার 🙏 আমি কবচ শিল্ড। যেকোনো সন্দেহজনক কল, SMS বা WhatsApp বার্তা পেস্ট করুন — এটি প্রতারণা কিনা কয়েক সেকেন্ডে বলে দেব।',
  mr: 'नमस्कार 🙏 मी कवच शील्ड आहे. कोणताही संशयास्पद कॉल, SMS किंवा WhatsApp संदेश येथे पेस्ट करा — तो घोटाळा आहे का हे मी काही सेकंदात सांगेन आणि काय करावे तेही.',
  gu: 'નમસ્તે 🙏 હું કવચ શીલ્ડ છું. કોઈપણ શંકાસ્પદ કૉલ, SMS કે WhatsApp સંદેશ અહીં પેસ્ટ કરો — તે છેતરપિંડી છે કે નહીં તે હું સેકન્ડોમાં કહીશ અને શું કરવું તે પણ.',
  ml: 'നമസ്തേ 🙏 ഞാൻ കവച് ഷീൽഡ് ആണ്. സംശയാസ്പദമായ കോൾ, SMS അല്ലെങ്കിൽ WhatsApp സന്ദേശം ഇവിടെ പേസ്റ്റ് ചെയ്യൂ — അത് തട്ടിപ്പാണോ എന്ന് സെക്കൻഡുകൾക്കുള്ളിൽ ഞാൻ പറയും, എന്തുചെയ്യണമെന്നും.',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ 🙏 ਮੈਂ ਕਵਚ ਸ਼ੀਲਡ ਹਾਂ। ਕੋਈ ਵੀ ਸ਼ੱਕੀ ਕਾਲ, SMS ਜਾਂ WhatsApp ਸੁਨੇਹਾ ਇੱਥੇ ਪੇਸਟ ਕਰੋ — ਮੈਂ ਸਕਿੰਟਾਂ ਵਿੱਚ ਦੱਸਾਂਗਾ ਕਿ ਇਹ ਧੋਖਾ ਹੈ ਜਾਂ ਨਹੀਂ, ਅਤੇ ਕੀ ਕਰਨਾ ਹੈ।',
  or: 'ନମସ୍କାର 🙏 ମୁଁ କବଚ ଶିଲ୍ଡ। କୌଣସି ସନ୍ଦେହଜନକ କଲ, SMS କିମ୍ବା WhatsApp ବାର୍ତ୍ତା ଏଠାରେ ପେଷ୍ଟ କରନ୍ତୁ — ଏହା ଠକେଇ କି ନାହିଁ ମୁଁ ସେକେଣ୍ଡ ମଧ୍ୟରେ କହିବି, ଏବଂ କଣ କରିବେ ମଧ୍ୟ।',
  ur: 'السلام علیکم 🙏 میں کوچ شیلڈ ہوں۔ کوئی بھی مشکوک کال، SMS یا WhatsApp پیغام یہاں پیسٹ کریں — میں چند سیکنڈ میں بتا دوں گا کہ یہ فراڈ ہے یا نہیں، اور آپ کو کیا کرنا چاہیے۔',
}
const PLACEHOLDER = {
  en: 'Paste a suspicious message…', hi: 'संदिग्ध संदेश पेस्ट करें…', ta: 'சந்தேக செய்தியை ஒட்டவும்…',
  kn: 'ಅನುಮಾನಾಸ್ಪದ ಸಂದೇಶ ಅಂಟಿಸಿ…', te: 'అనుమానాస్పద సందేశం పేస్ట్ చేయండి…', bn: 'সন্দেহজনক বার্তা পেস্ট করুন…',
  mr: 'संशयास्पद संदेश पेस्ट करा…', gu: 'શંકાસ્પદ સંદેશ પેસ્ટ કરો…', ml: 'സംശയാസ്പദമായ സന്ദേശം പേസ്റ്റ് ചെയ്യൂ…',
  pa: 'ਸ਼ੱਕੀ ਸੁਨੇਹਾ ਪੇਸਟ ਕਰੋ…', or: 'ସନ୍ଦେହଜନକ ବାର୍ତ୍ତା ପେଷ୍ଟ କରନ୍ତୁ…', ur: 'مشکوک پیغام پیسٹ کریں…',
}

export default function FraudShield() {
  const [lang, setLang] = useState(getLang())   // default chat language to the site language
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([{ who: 'bot', kind: 'text', text: GREETING[getLang()] || GREETING.en }])
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)
  const siteLang = useLang()

  // Follow the site language when it is toggled.
  useEffect(() => { setLang(siteLang) }, [siteLang])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  // When language changes, refresh the greeting so the change is immediately visible.
  useEffect(() => {
    setMsgs((m) => (m.length === 1 && m[0].who === 'bot'
      ? [{ who: 'bot', kind: 'text', text: GREETING[lang] || GREETING.en }]
      : m))
  }, [lang])

  const send = async (textArg) => {
    const text = (textArg ?? input).trim()
    if (!text || busy) return
    setMsgs((m) => [...m, { who: 'user', kind: 'text', text }])
    setInput('')
    setBusy(true)
    try {
      const r = await analyzeScam(text, 'Citizen', lang)
      setMsgs((m) => [...m, { who: 'bot', kind: 'verdict', data: r }])
    } catch {
      setMsgs((m) => [...m, { who: 'bot', kind: 'text', text: '⚠️ Could not reach the analysis server (start FastAPI on :8000).' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('Citizen', 'नागरिक')} accent={t('Fraud Shield', 'फ्रॉड शील्ड')}
        subtitle={t('Web · WhatsApp · Telegram · IVR call — instant scam verdicts + guided 1930/NCRP reporting in 12 Indian languages', 'वेब · WhatsApp · Telegram · IVR कॉल — 12 भारतीय भाषाओं में तुरंत घोटाला निर्णय + मार्गदर्शित 1930/NCRP रिपोर्टिंग')} />
      <div className="p-4 md:p-8">
        <ChannelsBar />
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/8 bg-ink-700 overflow-hidden flex flex-col h-[72vh] min-h-[420px]">
          {/* header */}
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between bg-ink-800">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-brand/20 text-brand"><ShieldCheck size={18} /></div>
              <div>
                <div className="text-sm font-600 text-white">{t('Kavach Shield', 'कवच शील्ड')}</div>
                <div className="text-[11px] text-emerald-400">● {t('online · helpline 1930', 'ऑनलाइन · हेल्पलाइन 1930')}</div>
              </div>
            </div>
            <Select value={lang} onChange={setLang} className="w-36"
              options={LANGS.map(([c, n]) => ({ value: c, label: n }))} />
          </div>

          {/* messages */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {msgs.map((m, i) => <Bubble key={i} m={m} />)}
            {busy && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Bot size={16} /> <span className="animate-pulse">{t('Analysing…', 'विश्लेषण हो रहा है…')}</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* quick chips */}
          <div className="px-4 pt-2 flex flex-wrap gap-2 border-t border-white/8">
            {(QUICK_LABELS[lang] || QUICK_LABELS.en).map((label, i) => (
              <button key={i} onClick={() => send(QUICK_EN[i])}
                className="text-[11px] text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:border-brand/40 hover:text-gray-200">
                {label}
              </button>
            ))}
          </div>

          {/* input */}
          <div className="p-4 flex items-center gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={PLACEHOLDER[lang] || PLACEHOLDER.en}
              className="flex-1 bg-ink-900 border border-ink-500 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            <button onClick={() => send()} disabled={busy}
              className="grid place-items-center w-11 h-11 rounded-full bg-brand hover:bg-brand-600 disabled:opacity-60 text-black transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
        <MoreChannels />
      </div>
      <ScrollHint />
    </>
  )
}

function ScrollHint() {
  const [hidden, setHidden] = useState(false)
  useLang()
  useEffect(() => {
    // hide once the user scrolls, or after the nudge has played out
    const onScroll = () => { if (window.scrollY > 60) setHidden(true) }
    window.addEventListener('scroll', onScroll, { passive: true })
    const tid = setTimeout(() => setHidden(true), 4500)
    // don't show at all if the page isn't actually scrollable
    if (document.documentElement.scrollHeight <= window.innerHeight + 40) setHidden(true)
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(tid) }
  }, [])
  if (hidden) return null
  return (
    <button
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.55, behavior: 'smooth' })}
      className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 inline-flex items-center gap-1.5
                 rounded-full border border-white/10 bg-ink-800/90 backdrop-blur px-3.5 py-1.5
                 text-xs text-gray-300 hover:text-brand hover:border-brand/40 shadow-lg transition-colors">
      {t('More channels', 'और चैनल')}
      <ChevronDown size={15} className="scroll-nudge text-brand" />
    </button>
  )
}

function MoreChannels() {
  const [ch, setCh] = useState(null)
  useLang()
  useEffect(() => { getChannels().then(setCh).catch(() => {}) }, [])
  if (!ch) return null
  const wa = ch.whatsapp || {}
  const ivr = ch.ivr || {}
  return (
    <div className="max-w-3xl mx-auto mt-4 grid sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-600 text-emerald-300">
          <MessageCircle size={16} /> {t('Check a scam on WhatsApp', 'WhatsApp पर घोटाला जाँचें')}
        </div>
        <ol className="mt-2 space-y-1 text-xs text-gray-400 list-decimal pl-4">
          <li>{t('Send', 'भेजें')} <code className="text-emerald-300">join {wa.join_code || '<code>'}</code> {t('to', 'को')} <span className="text-gray-200 font-mono">{wa.number}</span> {t('on WhatsApp', 'WhatsApp पर')}</li>
          <li>{t('Then forward any suspicious call, SMS or message — you get an instant verdict.', 'फिर कोई संदिग्ध कॉल, SMS या संदेश भेजें — तुरंत निर्णय मिलेगा।')}</li>
        </ol>
        <p className="mt-2 text-[10px] text-gray-500">{t('Free · auto-replies in your language', 'मुफ़्त · आपकी भाषा में स्वतः जवाब')}{!wa.join_code && ' · ' + t('(activate a Twilio sandbox)', '(Twilio सैंडबॉक्स सक्रिय करें)')}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-ink-800 p-4">
        <div className="flex items-center gap-2 text-sm font-600 text-gray-200">
          <PhoneCall size={16} className="text-brand" /> {t('Or just call (IVR)', 'या कॉल करें (IVR)')}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {ivr.number
            ? <>{t('Call', 'कॉल करें')} <span className="text-gray-200 font-mono">{ivr.number}</span> {t('and describe the message — hear a verdict in your language.', 'और संदेश बताएं — अपनी भाषा में निर्णय सुनें।')}</>
            : t('Connect a phone number and citizens can call, describe a suspicious message, and hear a scam verdict in their language — no app needed.', 'एक फ़ोन नंबर जोड़ें और नागरिक कॉल करके संदिग्ध संदेश बता सकते हैं और अपनी भाषा में निर्णय सुन सकते हैं — बिना ऐप के।')}
        </p>
        <p className="mt-2 text-[10px] text-gray-500">{t('Reaches feature-phone & elderly users', 'फ़ीचर-फ़ोन व बुज़ुर्ग उपयोगकर्ताओं तक')}</p>
      </div>
    </div>
  )
}

function Bubble({ m }) {
  if (m.who === 'user') {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] bg-brand/20 border border-brand/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-200">{m.text}</div>
        <div className="grid place-items-center w-8 h-8 rounded-full bg-ink-900 text-gray-400 shrink-0"><User size={15} /></div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <div className="grid place-items-center w-8 h-8 rounded-full bg-brand/20 text-brand shrink-0"><Bot size={15} /></div>
      <div className="max-w-[85%]">
        {m.kind === 'text' && (
          <div className="bg-ink-900 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-200">{m.text}</div>
        )}
        {m.kind === 'verdict' && <VerdictCard r={m.data} />}
      </div>
    </div>
  )
}

function VerdictCard({ r }) {
  const accent = r.risk_level === 'CRITICAL' ? 'border-red-500/40' : r.risk_level === 'HIGH' ? 'border-orange-500/40' : r.risk_level === 'MEDIUM' ? 'border-yellow-500/40' : 'border-emerald-500/40'
  return (
    <div className={`bg-ink-900 border ${accent} rounded-2xl rounded-tl-sm p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <RiskBadge level={r.risk_level} />
        <span className="text-sm text-gray-400">score <span className="text-white font-700">{r.risk_score}</span>/100</span>
      </div>
      <div className="text-sm text-gray-100 font-600">{r.advisory}</div>
      {r.tactics_detected?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.tactics_detected.map((t) => (
            <span key={t} className="text-[10px] bg-red-500/10 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <div className="border-t border-white/8 pt-2 space-y-1">
        {r.recommended_actions.slice(0, 3).map((a, i) => (
          <div key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-brand">{i + 1}.</span>{a}</div>
        ))}
      </div>
      {r.risk_level !== 'LOW' && (
        <a href="tel:1930" className="inline-flex items-center gap-1.5 text-xs bg-red-500/15 text-red-300 border border-red-500/30 rounded-full px-3 py-1.5">
          <Phone size={12} /> Call 1930 now
        </a>
      )}
    </div>
  )
}
