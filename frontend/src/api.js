import axios from 'axios'

// Dev: Vite proxies /api -> http://localhost:8000 (see vite.config.js).
// Prod: set VITE_API_URL to the deployed backend, e.g. https://kavach-api.onrender.com/api
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export const analyzeScam = (text, channel, language, useAi = false) =>
  api.post('/scam/analyze', { text, channel, language, use_ai: useAi }).then((r) => r.data)

export const getLlmStatus = () => api.get('/llm/status').then((r) => r.data)

export const getScamSamples = () => api.get('/scam/samples').then((r) => r.data)
export const getStats = () => api.get('/stats').then((r) => r.data)
export const getNews = () => api.get('/news').then((r) => r.data)
export const getFraudGraph = () => api.get('/fraud/graph').then((r) => r.data)
export const getFraudPackages = () => api.get('/fraud/packages').then((r) => r.data)
export const getCounterfeitFeatures = () =>
  api.get('/counterfeit/features').then((r) => r.data)
export const screenNote = (file, denomination, confirmedFeatures) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('denomination', denomination)
  fd.append('confirmed_features', confirmedFeatures.join(','))
  return api.post('/counterfeit/screen', fd).then((r) => r.data)
}
export const getHotspots = () => api.get('/geo/hotspots').then((r) => r.data)

export const voiceDemo = (kind) =>
  api.get('/voice/demo', { params: { kind } }).then((r) => r.data)
export const analyzeVoice = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/voice/analyze', fd).then((r) => r.data)
}
export const getMetrics = () => api.get('/metrics').then((r) => r.data)

export const orchestrateFusion = (payload) =>
  api.post('/fusion/orchestrate', payload).then((r) => r.data)

export default api
