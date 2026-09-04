import { useEffect, useState } from 'react'
import type { CalculationStep, Palace } from '../rules'

export const HAND_PALACE_POINTS = {
  大安: { x: 119, y: 142, finger: '食指', section: '中节' },
  留连: { x: 119, y: 94, finger: '食指', section: '上节' },
  速喜: { x: 166, y: 79, finger: '中指', section: '上节' },
  赤口: { x: 215, y: 142, finger: '无名指', section: '中节' },
  小吉: { x: 166, y: 191, finger: '中指', section: '下节' },
  空亡: { x: 166, y: 139, finger: '中指', section: '中节' },
  病符: { x: 215, y: 94, finger: '无名指', section: '上节' },
  桃花: { x: 119, y: 190, finger: '食指', section: '下节' },
  天德: { x: 215, y: 190, finger: '无名指', section: '下节' },
} as const

export const HAND_PALACE_ORDER = ['大安', '留连', '速喜', '赤口', '小吉', '空亡', '病符', '桃花', '天德'] as const

type PalaceName = keyof typeof HAND_PALACE_POINTS
type Point = (typeof HAND_PALACE_POINTS)[PalaceName]

export function getPalaceJoint(name: string): Point | undefined {
  return HAND_PALACE_POINTS[name as PalaceName]
}

export function getCompressedPath(step: CalculationStep, palaceCount: number): number[] {
  const remainder = Number(step.remainder)
  return Array.from({ length: remainder + 1 }, (_, offset) => (step.startIndex + offset) % palaceCount)
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function LeftHandAnimation({ steps, passes, palaceCount }: { steps: readonly [CalculationStep, CalculationStep, CalculationStep]; passes: readonly [Palace, Palace, Palace]; palaceCount: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activePass, setActivePass] = useState<number | null>(null)
  const [completed, setCompleted] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion] = useState(prefersReducedMotion)

  const finishImmediately = () => {
    setPlaying(false)
    setActiveIndex(passes[2].index)
    setActivePass(2)
    setCompleted(3)
  }

  const play = () => {
    setPlaying(true)
    setActiveIndex(null)
    setActivePass(null)
    setCompleted(0)
  }

  const showPass = (index: number) => {
    setPlaying(false)
    setActiveIndex(passes[index].index)
    setActivePass(index)
    setCompleted(Math.max(completed, index + 1))
  }

  useEffect(() => {
    if (reducedMotion || !playing) return
    let cancelled = false
    const timers: number[] = []
    let elapsed = 120

    steps.forEach((step, index) => {
      const path = getCompressedPath(step, palaceCount)
      path.forEach((palaceIndex) => {
        timers.push(window.setTimeout(() => { if (!cancelled) { setActivePass(index); setActiveIndex(palaceIndex) } }, elapsed))
        elapsed += 400
      })
      timers.push(window.setTimeout(() => { if (!cancelled) setCompleted(index + 1) }, elapsed))
      elapsed += 500
    })
    timers.push(window.setTimeout(() => { if (!cancelled) setPlaying(false) }, elapsed))
    return () => { cancelled = true; timers.forEach(window.clearTimeout) }
  }, [palaceCount, playing, reducedMotion, steps])

  const activeName = activeIndex === null ? undefined : HAND_PALACE_ORDER[activeIndex]
  const activePoint = activeName ? HAND_PALACE_POINTS[activeName] : undefined
  const description = reducedMotion
    ? `掐诀动画已跳过。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`
    : `左手掐诀动画：${playing ? '正在依次计数' : '播放完成'}。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`

  return <section className="hand-animation" aria-labelledby="hand-animation-title">
    <div className="animation-heading"><div><p className="pass-label">掌诀演示</p><h3 id="hand-animation-title">三传落宫</h3></div><div className="animation-actions"><button className="text-button" type="button" onClick={finishImmediately}>跳过动画</button><button className="text-button" type="button" onClick={play}>重新播放</button></div></div>
    <svg className="hand-svg" viewBox="0 0 320 360" role="img" aria-labelledby="hand-animation-title hand-animation-description">
      <desc id="hand-animation-description">{description}</desc>
      <path className="hand-fill" d="M91 337 C87 307 90 270 98 231 L101 88 C101 75 110 67 120 70 C127 72 130 79 130 89 L130 174 L134 43 C134 29 143 20 154 22 C163 24 166 32 166 43 L166 170 L171 29 C171 14 181 6 192 9 C202 11 205 20 205 32 L205 171 L211 58 C212 44 221 36 232 39 C242 42 246 51 245 63 L239 190 C258 207 273 228 278 253 C286 290 270 321 247 337 Z" />
      <path className="thumb-fill" d="M106 223 C84 215 63 219 50 234 C39 247 42 263 55 267 C66 270 77 256 91 248 L112 241" />
      <path className="hand-line" d="M91 337 C87 307 90 270 98 231 L101 88 C101 75 110 67 120 70 C127 72 130 79 130 89 L130 174 L134 43 C134 29 143 20 154 22 C163 24 166 32 166 43 L166 170 L171 29 C171 14 181 6 192 9 C202 11 205 20 205 32 L205 171 L211 58 C212 44 221 36 232 39 C242 42 246 51 245 63 L239 190 C258 207 273 228 278 253 C286 290 270 321 247 337 Z" />
      <path className="hand-line" d="M106 223 C84 215 63 219 50 234 C39 247 42 263 55 267 C66 270 77 256 91 248 L112 241" />
      <path className="crease-line" d="M105 221 C126 211 145 211 165 220 M165 220 C185 211 207 212 231 224 M110 276 C143 260 188 260 237 276 M124 311 C154 300 190 300 224 311" />
      <path className="finger-line" d="M130 174 L130 203 M166 170 L166 207 M205 171 L205 207" />
      {HAND_PALACE_ORDER.slice(0, palaceCount).map((name) => {
        const point = HAND_PALACE_POINTS[name]
        return <g className="palace-point" key={name}><circle cx={point.x} cy={point.y} r="15" /><text x={point.x} y={point.y + 4} textAnchor="middle">{name}</text></g>
      })}
      {activePoint && <g className="active-marker" style={{ transform: `translate(${activePoint.x}px, ${activePoint.y}px)` }}><circle r="19" /><circle className="active-core" key={activeIndex} r="19" /></g>}
    </svg>
    <div className="pass-results" aria-live="polite">{passes.map((palace, index) => <button className={completed > index ? 'pass-result is-done' : 'pass-result'} type="button" onClick={() => showPass(index)} key={palace.name + index}><strong>{['初传', '中传', '末传'][index]}</strong>{completed > index || reducedMotion ? palace.name : '待落宫'}</button>)}</div>
    {playing && activePass !== null && Number(steps[activePass].rounds) > 0 && <p className="round-note">完整圈 ×{steps[activePass].rounds}圈，再走余数路径</p>}
  </section>
}
