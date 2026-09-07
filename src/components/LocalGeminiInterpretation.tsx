import { useState } from 'react'
import {
  clearStoredGeminiKey,
  GeminiRequestError,
  hasStoredGeminiKey,
  requestGeminiInterpretation,
  storeEncryptedGeminiKey,
  unlockGeminiKey,
} from '../features/ai/localGemini'
import type { GeminiChatMessage, GeminiDivinationContext } from '../features/ai/localGemini'

type View = 'closed' | 'setup' | 'unlock' | 'chat'

export function LocalGeminiInterpretation({ context }: { context: GeminiDivinationContext }) {
  const [view, setView] = useState<View>('closed')
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [history, setHistory] = useState<GeminiChatMessage[]>([])
  const [usedModel, setUsedModel] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const open = () => {
    setError('')
    setView(apiKey ? 'chat' : hasStoredGeminiKey() ? 'unlock' : 'setup')
  }

  const setup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!keyInput.trim()) return setError('请输入 Gemini API Key')
    if (password.length < 8) return setError('本地解锁密码至少需要 8 位')
    if (password !== confirmation) return setError('两次输入的密码不一致')
    setBusy(true)
    try {
      const plaintextKey = keyInput.trim()
      await storeEncryptedGeminiKey(plaintextKey, password)
      setApiKey(plaintextKey)
      setKeyInput('')
      setPassword('')
      setConfirmation('')
      setView('chat')
    } catch {
      setError('无法保存本机 AI 配置，请确认浏览器支持安全存储')
    } finally {
      setBusy(false)
    }
  }

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const plaintextKey = await unlockGeminiKey(password)
      setApiKey(plaintextKey)
      setPassword('')
      setView('chat')
    } catch {
      setError('密码错误，无法解锁本机 AI 配置')
    } finally {
      setBusy(false)
    }
  }

  const ask = async (prompt: string) => {
    if (!apiKey || !prompt.trim() || busy) return
    const question = prompt.trim().slice(0, 2_000)
    const previousHistory = history
    setBusy(true)
    setError('')
    setFollowUp('')
    try {
      const result = await requestGeminiInterpretation(apiKey, context, previousHistory, question)
      const nextHistory: GeminiChatMessage[] = [...previousHistory, { role: 'user', text: question }, { role: 'model', text: result.text }]
      setHistory(nextHistory.slice(-10))
      setUsedModel(result.model)
    } catch (requestError) {
      setError(requestError instanceof GeminiRequestError
        ? requestError.message
        : 'AI 解读发生未知错误，请重试')
    } finally {
      setBusy(false)
    }
  }

  const clearConfiguration = () => {
    clearStoredGeminiKey()
    setApiKey(null)
    setHistory([])
    setUsedModel('')
    setPassword('')
    setError('本机 AI 配置已清除')
    setView('setup')
  }

  if (view === 'closed') {
    return <div className="ai-entry"><button className="secondary-button ai-entry-button" type="button" onClick={open}>AI解读</button></div>
  }

  return <section className="ai-panel" aria-labelledby="ai-panel-title">
    <div className="ai-panel-heading"><div><p className="pass-label">本机直连</p><h3 id="ai-panel-title">AI解读</h3></div><button className="text-button" type="button" onClick={() => setView('closed')}>收起</button></div>

    {view === 'setup' && <form className="ai-form" onSubmit={setup}>
      <label>Gemini API Key<input type="password" autoComplete="off" value={keyInput} onChange={(event) => setKeyInput(event.target.value)} /></label>
      <label>本地解锁密码<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label>确认密码<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={busy}>{busy ? '正在加密…' : '保存并解锁'}</button>
    </form>}

    {view === 'unlock' && <form className="ai-form" onSubmit={unlock}>
      <label>本地解锁密码<input autoFocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="primary-button" type="submit" disabled={busy}>{busy ? '正在解锁…' : '解锁AI解读'}</button>
    </form>}

    {view === 'chat' && <div className="ai-chat">
      {history.length === 0
        ? <button className="primary-button" type="button" disabled={busy} onClick={() => void ask('请解读这个排盘，并说明象义、现实判断和判断依据。')}>{busy ? '正在解读…' : '生成AI解读'}</button>
        : <div className="ai-messages" aria-live="polite">{history.map((message, index) => <article className={`ai-message is-${message.role}`} key={`${message.role}-${index}`}><strong>{message.role === 'user' ? '你' : 'Gemini'}</strong><p>{message.text}</p></article>)}</div>}
      {usedModel && <small className="pass-label">使用模型：{usedModel}</small>}
      {history.length > 0 && <form className="ai-follow-up" onSubmit={(event) => { event.preventDefault(); void ask(followUp) }}>
        <label htmlFor="ai-follow-up">继续追问</label>
        <div><input id="ai-follow-up" maxLength={2_000} value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="围绕同一排盘追问" /><button type="submit" disabled={busy || !followUp.trim()}>{busy ? '发送中…' : '发送'}</button></div>
      </form>}
    </div>}

    {error && <p className="error-text" role="alert">{error}</p>}
    {(apiKey || hasStoredGeminiKey()) && <button className="ai-clear-button" type="button" onClick={clearConfiguration}>清除本机AI配置</button>}
  </section>
}
