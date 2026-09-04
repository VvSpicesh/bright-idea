import { useEffect, useState } from 'react'
import type { CalculationStep, Palace } from '../rules'

export const SIX_HAND_POINTS = {
  大安: { x: 128, y: 270, finger: 'index', segment: 'lower' },
  留连: { x: 128, y: 135, finger: 'index', segment: 'upper' },
  速喜: { x: 182, y: 100, finger: 'middle', segment: 'upper' },
  赤口: { x: 232, y: 130, finger: 'ring', segment: 'upper' },
  小吉: { x: 232, y: 270, finger: 'ring', segment: 'lower' },
  空亡: { x: 182, y: 265, finger: 'middle', segment: 'lower' },
} as const

export const NINE_HAND_POINTS = {
  大安: { x: 128, y: 205, finger: 'index', segment: 'middle' },
  留连: { x: 128, y: 135, finger: 'index', segment: 'upper' },
  速喜: { x: 182, y: 100, finger: 'middle', segment: 'upper' },
  赤口: { x: 232, y: 200, finger: 'ring', segment: 'middle' },
  小吉: { x: 182, y: 265, finger: 'middle', segment: 'lower' },
  空亡: { x: 182, y: 180, finger: 'middle', segment: 'middle' },
  病符: { x: 232, y: 130, finger: 'ring', segment: 'upper' },
  桃花: { x: 128, y: 270, finger: 'index', segment: 'lower' },
  天德: { x: 232, y: 270, finger: 'ring', segment: 'lower' },
} as const

export const HAND_PALACE_ORDER = ['大安', '留连', '速喜', '赤口', '小吉', '空亡', '病符', '桃花', '天德'] as const

type HandPoints = typeof SIX_HAND_POINTS | typeof NINE_HAND_POINTS
type Point = HandPoints[keyof HandPoints]

export function getHandPoints(palaceCount: number): HandPoints {
  return palaceCount === 6 ? SIX_HAND_POINTS : NINE_HAND_POINTS
}

export function getPalaceJoint(name: string, palaceCount = 9): Point | undefined {
  return getHandPoints(palaceCount)[name as keyof HandPoints]
}

export function getAnimationPath(step: CalculationStep, palaceCount: number): number[] {
  const count = BigInt(step.input)
  const maximumFullPlayback = 36n
  if (count <= maximumFullPlayback) {
    return Array.from({ length: Number(count) }, (_, offset) => (step.startIndex + offset) % palaceCount)
  }

  const fullCircle = Array.from({ length: palaceCount }, (_, offset) => (step.startIndex + offset) % palaceCount)
  const remainderCount = Number(BigInt(step.remainder) + 1n)
  const remainderPath = Array.from({ length: remainderCount }, (_, offset) => (step.startIndex + offset) % palaceCount)
  return [...fullCircle, ...remainderPath]
}

export function getCompressedPath(step: CalculationStep, palaceCount: number): number[] {
  return getAnimationPath(step, palaceCount)
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function LeftHandAnimation({ steps, passes, palaceCount }: { steps: readonly [CalculationStep, CalculationStep, CalculationStep]; passes: readonly [Palace, Palace, Palace]; palaceCount: number }) {
  const points = getHandPoints(palaceCount)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [activePass, setActivePass] = useState<number | null>(null)
  const [completed, setCompleted] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion] = useState(prefersReducedMotion)

  const finishImmediately = () => { setPlaying(false); setActiveIndex(passes[2].index); setActivePass(2); setCompleted(3) }
  const play = () => { setPlaying(true); setActiveIndex(null); setActivePass(null); setCompleted(0) }
  const showPass = (index: number) => { setPlaying(false); setActiveIndex(passes[index].index); setActivePass(index); setCompleted(Math.max(completed, index + 1)) }

  useEffect(() => {
    if (reducedMotion || !playing) return
    let cancelled = false
    const timers: ReturnType<typeof globalThis.setTimeout>[] = []
    let elapsed = 120
    steps.forEach((step, index) => {
      getAnimationPath(step, palaceCount).forEach((palaceIndex) => {
        timers.push(globalThis.setTimeout(() => { if (!cancelled) { setActivePass(index); setActiveIndex(palaceIndex) } }, elapsed))
        elapsed += 400
      })
      timers.push(globalThis.setTimeout(() => { if (!cancelled) setCompleted(index + 1) }, elapsed))
      elapsed += 500
    })
    timers.push(globalThis.setTimeout(() => { if (!cancelled) setPlaying(false) }, elapsed))
    return () => { cancelled = true; timers.forEach(globalThis.clearTimeout) }
  }, [palaceCount, playing, reducedMotion, steps])

  const activeName = activeIndex === null ? undefined : HAND_PALACE_ORDER[activeIndex]
  const activePoint = activeName ? points[activeName as keyof HandPoints] : undefined
  const description = reducedMotion
    ? `掐诀动画已跳过。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`
    : `左手掐诀动画：${playing ? '正在依次计数' : '播放完成'}。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`

  return <section className="hand-animation" aria-labelledby="hand-animation-title">
    <div className="animation-heading"><div><p className="pass-label">掌诀演示</p><h3 id="hand-animation-title">三传落宫</h3></div><div className="animation-actions"><button className="text-button" type="button" onClick={finishImmediately}>跳过动画</button><button className="text-button" type="button" onClick={play}>重新播放</button></div></div>
    <svg className="hand-svg" viewBox="0 0 360 480" role="img" aria-labelledby="hand-animation-title hand-animation-description">
      <desc id="hand-animation-description">{description}</desc>
      <path className="hand-fill" d="M100 470 C92 430 94 380 100 330 C75 320 45 300 38 270 C32 245 52 228 75 238 L105 255 L105 145 C105 130 115 120 128 122 C140 124 145 134 145 147 L145 245 L145 78 C145 60 158 49 172 52 C184 55 190 65 190 80 L190 245 L190 105 C190 88 202 78 215 81 C227 84 234 94 234 108 L234 245 L234 150 C234 135 246 126 258 129 C269 132 275 141 274 155 L270 280 C285 300 292 330 288 360 C285 400 270 440 250 470 Z" />
      <path className="thumb-fill" d="M108 235 C84 220 59 220 45 238 C34 252 39 270 54 275 C67 279 79 260 96 253 L118 248 Z" />
      <path className="hand-line" d="M100 470 C92 430 94 380 100 330 C75 320 45 300 38 270 C32 245 52 228 75 238 L105 255 L105 145 C105 130 115 120 128 122 C140 124 145 134 145 147 L145 245 L145 78 C145 60 158 49 172 52 C184 55 190 65 190 80 L190 245 L190 105 C190 88 202 78 215 81 C227 84 234 94 234 108 L234 245 L234 150 C234 135 246 126 258 129 C269 132 275 141 274 155 L270 280 C285 300 292 330 288 360 C285 400 270 440 250 470 Z" />
      <path className="hand-line" d="M108 235 C84 220 59 220 45 238 C34 252 39 270 54 275 C67 279 79 260 96 253 L118 248" />
      <path className="crease-line" d="M101 330 C135 310 174 310 213 326 M105 388 C145 370 193 370 248 389 M111 433 C151 420 199 421 241 435" />
      <path className="finger-line" d="M105 145 L145 145 M105 205 L145 205 M105 270 L145 270 M145 100 L190 100 M145 180 L190 180 M145 265 L190 265 M190 130 L234 130 M190 200 L234 200 M190 270 L234 270" />
      <g className="finger index-finger" aria-label="index finger" /><g className="finger middle-finger" aria-label="middle finger" /><g className="finger ring-finger" aria-label="ring finger" /><g className="finger little-finger" aria-label="little finger" />
      {HAND_PALACE_ORDER.slice(0, palaceCount).map((name) => {
        const point = points[name as keyof HandPoints]
        return <g className="palace-point" key={name}><circle cx={point.x} cy={point.y} r="15" /><text x={point.x} y={point.y + 4} textAnchor="middle">{name}</text></g>
      })}
      {activePoint && <g className="active-marker" style={{ transform: `translate(${activePoint.x}px, ${activePoint.y}px)` }}><circle r="19" /><circle className="active-core" key={`${activePass}-${activeIndex}`} r="19" /></g>}
    </svg>
    <div className="pass-results" aria-live="polite">{passes.map((palace, index) => <button className={completed > index ? 'pass-result is-done' : 'pass-result'} type="button" onClick={() => showPass(index)} key={palace.name + index}><strong>{['初传', '中传', '末传'][index]}</strong>{completed > index || reducedMotion ? palace.name : '待落宫'}</button>)}</div>
    {playing && activePass !== null && Number(steps[activePass].rounds) > 0 && <p className="round-note">完整圈 ×{steps[activePass].rounds}圈，再走余数路径</p>}
  </section>
}
