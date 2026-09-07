import { useMemo, useState } from 'react'
import { buildAiInterpretationPrompt } from '../features/ai/aiPrompt'
import type { AiPromptContext } from '../features/ai/aiPrompt'

const AI_SITES = [
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
] as const

export function LocalGeminiInterpretation({ context }: { context: AiPromptContext }) {
  const [focusQuestion, setFocusQuestion] = useState('')
  const [status, setStatus] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const prompt = useMemo(() => buildAiInterpretationPrompt(context, focusQuestion), [context, focusQuestion])

  const copyPrompt = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(prompt)
      setShowPrompt(false)
      setStatus('提示词已复制')
      return true
    } catch {
      setShowPrompt(true)
      setStatus('自动复制失败，请长按下方提示词手动复制')
      return false
    }
  }

  const openAiSite = async (url: string) => {
    const copied = await copyPrompt()
    window.open(url, '_blank', 'noopener,noreferrer')
    if (copied) setStatus('提示词已复制，请在AI中粘贴发送')
  }

  return <section className="ai-export" aria-labelledby="ai-export-title">
    <div className="ai-export-heading">
      <h3 id="ai-export-title">AI辅助解读</h3>
      {status && <span role="status">{status}</span>}
    </div>
    <label className="ai-export-question" htmlFor="ai-focus-question">
      <span>你想问什么 <small>（可选）</small></span>
      <input id="ai-focus-question" value={focusQuestion} onChange={(event) => setFocusQuestion(event.target.value)} placeholder="为空则综合解读" />
    </label>
    <div className="ai-export-actions">
      <button type="button" onClick={() => void copyPrompt()}>复制提示词</button>
      {AI_SITES.map((site) => <button type="button" key={site.name} onClick={() => void openAiSite(site.url)}>{site.name}</button>)}
    </div>
    {showPrompt && <textarea className="ai-export-prompt" aria-label="可手动复制的提示词" readOnly value={prompt} onFocus={(event) => event.currentTarget.select()} />}
  </section>
}
