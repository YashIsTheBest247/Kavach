import { Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/console" element={<ConsoleLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="fusion" element={<FusionOrchestrator />} />
        <Route path="scam-detector" element={<ScamDetector />} />
        <Route path="fraud-graph" element={<FraudGraph />} />
        <Route path="counterfeit" element={<Counterfeit />} />
        <Route path="fraud-shield" element={<FraudShield />} />
        <Route path="voice-spoof" element={<VoiceSpoof />} />
        <Route path="crime-map" element={<CrimeMap />} />
        <Route path="metrics" element={<Metrics />} />
      </Route>
    </Routes>
  )
}
