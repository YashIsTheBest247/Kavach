import axios from 'axios'

// In dev, Vite proxies /api -> http://localhost:8000
const api = axios.create({ baseURL: '/api' })

export const analyzeScam = (text, channel, language, useAi = false) =>
  api.post('/scam/analyze', { text, channel, language, use_ai: useAi }).then((r) => r.data)

export const getLlmStatus = () => api.get('/llm/status').then((r) => r.data)

export const getScamSamples = () => api.get('/scam/samples').then((r) => r.data)
export const getStats = () => api.get('/stats').then((r) => r.data)
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

export default api
