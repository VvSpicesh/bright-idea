import { useEffect, useState } from 'react'
import type { CalculationStep, Palace } from '../rules'

export const LEFT_PALM_IMAGE = `${import.meta.env.BASE_URL}images/left-palm.png`

export const SIX_HAND_POINTS = {
  大安: { x: 36, y: 41, finger: 'index', segment: 'lower' },
  留连: { x: 36, y: 22, finger: 'index', segment: 'upper' },
  速喜: { x: 53, y: 14, finger: 'middle', segment: 'upper' },
  赤口: { x: 70, y: 22, finger: 'ring', segment: 'upper' },
  小吉: { x: 70, y: 43, finger: 'ring', segment: 'lower' },
  空亡: { x: 53, y: 40, finger: 'middle', segment: 'lower' },
} as const

export const NINE_HAND_POINTS = {
  留连: { x: 36, y: 22, finger: 'index', segment: 'upper' },
  大安: { x: 36, y: 31, finger: 'index', segment: 'middle' },
  桃花: { x: 36, y: 41, finger: 'index', segment: 'lower' },
  速喜: { x: 53, y: 14, finger: 'middle', segment: 'upper' },
  空亡: { x: 53, y: 27, finger: 'middle', segment: 'middle' },
  小吉: { x: 53, y: 40, finger: 'middle', segment: 'lower' },
  病符: { x: 70, y: 22, finger: 'ring', segment: 'upper' },
  赤口: { x: 70, y: 33, finger: 'ring', segment: 'middle' },
  天德: { x: 70, y: 43, finger: 'ring', segment: 'lower' },
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
    <div className="hand-stage" role="img" aria-label={description}>
      <img className="hand-image" src={LEFT_PALM_IMAGE} alt="左手掌心，拇指在左侧，食指、中指、无名指和小指向上" />
      <div className="palace-layer" aria-hidden="true">
        {HAND_PALACE_ORDER.slice(0, palaceCount).map((name) => {
          const point = points[name as keyof HandPoints]
          return <span className="palace-point" key={name} style={{ left: `${point.x}%`, top: `${point.y}%` }}>{name}</span>
        })}
        {activePoint && <span className="active-marker-position" style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%` }}><span className="active-marker" /></span>}
      </div>
    </div>
    <div className="pass-results" aria-live="polite">{passes.map((palace, index) => <button className={completed > index ? 'pass-result is-done' : 'pass-result'} type="button" onClick={() => showPass(index)} key={palace.name + index}><strong>{['初传', '中传', '末传'][index]}</strong>{completed > index || reducedMotion ? palace.name : '待落宫'}</button>)}</div>
    {playing && activePass !== null && Number(steps[activePass].rounds) > 0 && <p className="round-note">完整圈 ×{steps[activePass].rounds}圈，再走余数路径</p>}
  </section>
}
