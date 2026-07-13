import { Routes, Route } from 'react-router-dom'
import BackendGate from './components/BackendGate.jsx'
import Landing from './pages/Landing.jsx'
import ConsoleLayout from './pages/ConsoleLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ScamDetector from './pages/ScamDetector.jsx'
import FraudGraph from './pages/FraudGraph.jsx'
import Counterfeit from './pages/Counterfeit.jsx'
import FraudShield from './pages/FraudShield.jsx'
import CrimeMap from './pages/CrimeMap.jsx'
import VoiceSpoof from './pages/VoiceSpoof.jsx'
import Metrics from './pages/Metrics.jsx'
import FusionOrchestrator from './pages/FusionOrchestrator.jsx'
import News from './pages/News.jsx'
import AwarenessReels from './pages/AwarenessReels.jsx'
import LinkScanner from './pages/LinkScanner.jsx'
import ReportLookup from './pages/ReportLookup.jsx'
import DeepfakeImage from './pages/DeepfakeImage.jsx'
import CounterIntel from './pages/CounterIntel.jsx'
import VideoShield from './pages/VideoShield.jsx'
import ComplaintFile from './pages/ComplaintFile.jsx'
import OutbreakAlerts from './pages/OutbreakAlerts.jsx'
import ApiDocs from './pages/ApiDocs.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/console" element={<BackendGate><ConsoleLayout /></BackendGate>}>
        <Route index element={<Dashboard />} />
        <Route path="fusion" element={<FusionOrchestrator />} />
        <Route path="scam-detector" element={<ScamDetector />} />
        <Route path="fraud-graph" element={<FraudGraph />} />
        <Route path="counterfeit" element={<Counterfeit />} />
        <Route path="fraud-shield" element={<FraudShield />} />
        <Route path="voice-spoof" element={<VoiceSpoof />} />
        <Route path="link-scanner" element={<LinkScanner />} />
        <Route path="deepfake-image" element={<DeepfakeImage />} />
        <Route path="video-shield" element={<VideoShield />} />
        <Route path="counter-intel" element={<CounterIntel />} />
        <Route path="reputation" element={<ReportLookup />} />
        <Route path="outbreak" element={<OutbreakAlerts />} />
        <Route path="complaint" element={<ComplaintFile />} />
        <Route path="crime-map" element={<CrimeMap />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="news" element={<News />} />
        <Route path="reels" element={<AwarenessReels />} />
        <Route path="api" element={<ApiDocs />} />
      </Route>
    </Routes>
  )
}
