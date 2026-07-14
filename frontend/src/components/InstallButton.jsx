import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useLang, t } from '../i18n.js'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '')

/**
 * Floating "Install app" affordance. On Chrome/Android it fires the native PWA
 * install prompt; on iOS Safari (which has no prompt event) it shows the
 * Share → Add to Home Screen instruction.
 */
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useLang()

  useEffect(() => {
    if (isStandalone()) return
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setShow(true) }
    const onInstalled = () => { setShow(false); setDeferred(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    // iOS never fires beforeinstallprompt — offer the manual path.
    if (isIOS()) setShow(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!show || dismissed) return null

  const install = async () => {
    if (deferred) {
      deferred.prompt()
      try { await deferred.userChoice } catch { /* ignore */ }
      setDeferred(null); setShow(false)
    } else if (isIOS()) {
      setIosHint((v) => !v)
    }
  }

  return (
    <div className="fixed z-50 bottom-5 left-5 flex flex-col items-start gap-2">
      {iosHint && (
        <div className="max-w-[240px] rounded-2xl bg-ink-800 border border-white/10 shadow-xl px-4 py-3 text-xs text-gray-300 fade-in">
          {t('In Safari, tap', 'Safari में टैप करें')} <Share size={12} className="inline -mt-0.5 text-brand" />{' '}
          {t("then 'Add to Home Screen' to install Kavach.", "फिर 'Add to Home Screen' चुनें।")}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button onClick={install}
          className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-brand-600 text-black font-700 text-sm px-4 py-2.5 shadow-xl transition-colors">
          <Download size={16} /> {t('Install app', 'ऐप इंस्टॉल करें')}
        </button>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss"
          className="grid place-items-center w-7 h-7 rounded-full bg-ink-800 border border-white/10 text-gray-500 hover:text-white">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
