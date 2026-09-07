import { useEffect, useMemo, useRef, useState } from 'react'
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

export const PALACE_SYMBOL_PATHS: Readonly<Record<string, string>> = Object.freeze({
  大安: `${import.meta.env.BASE_URL}images/palaces/da-an.svg`,
  留连: `${import.meta.env.BASE_URL}images/palaces/liu-lian.svg`,
  速喜: `${import.meta.env.BASE_URL}images/palaces/su-xi.svg`,
  赤口: `${import.meta.env.BASE_URL}images/palaces/chi-kou.svg`,
  小吉: `${import.meta.env.BASE_URL}images/palaces/xiao-ji.svg`,
  空亡: `${import.meta.env.BASE_URL}images/palaces/kong-wang.svg`,
  病符: `${import.meta.env.BASE_URL}images/palaces/bing-fu.svg`,
  桃花: `${import.meta.env.BASE_URL}images/palaces/tao-hua.svg`,
  天德: `${import.meta.env.BASE_URL}images/palaces/tian-de.svg`,
})

type HandPoints = typeof SIX_HAND_POINTS | typeof NINE_HAND_POINTS
type Point = HandPoints[keyof HandPoints]

const TARGET_ANIMATION_MS = 2_500
const INITIAL_DELAY_MS = 60
const PASS_PAUSE_MS = 180
const FINAL_SETTLE_MS = 240
const MIN_STEP_MS = 12
const MAX_STEP_MS = 320
const TRAIL_LIFETIME_MS = 220

export interface AnimationTiming {
  visualStepCount: number
  stepDurationMs: number
  passPauseMs: number
  totalDurationMs: number
}

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

export function getAnimationTiming(
  steps: readonly [CalculationStep, CalculationStep, CalculationStep],
  palaceCount: number,
): AnimationTiming {
  const visualStepCount = steps.reduce((total, step) => total + getAnimationPath(step, palaceCount).length, 0)
  const fixedDuration = INITIAL_DELAY_MS + (PASS_PAUSE_MS * 2) + FINAL_SETTLE_MS
  const availableStepDuration = Math.floor((TARGET_ANIMATION_MS - fixedDuration) / Math.max(visualStepCount, 1))
  const stepDurationMs = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, availableStepDuration))
  return {
    visualStepCount,
    stepDurationMs,
    passPauseMs: PASS_PAUSE_MS,
    totalDurationMs: fixedDuration + (visualStepCount * stepDurationMs),
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function PassResults({ passes, completed, onSelect }: { passes: readonly [Palace, Palace, Palace]; completed: number; onSelect: (index: number) => void }) {
  return <div className="pass-results" aria-live="polite">{passes.map((palace, index) => <button className={completed > index ? 'pass-result is-done' : 'pass-result'} type="button" onClick={() => onSelect(index)} disabled={completed <= index} key={palace.name + index}><strong>{['初传', '中传', '末传'][index]}</strong><span className={completed > index ? 'pass-result-symbol' : 'pass-result-symbol is-pending'} aria-hidden="true"><img src={PALACE_SYMBOL_PATHS[palace.name]} alt="" /></span><span className={completed > index ? 'pass-result-value' : 'pass-result-value is-pending'}>{completed > index ? palace.name : '待落宫'}</span></button>)}</div>
}

export function LeftHandAnimation({ steps, passes, palaceCount, onCompleteChange, hidePassResults = false, onCompletedChange, onPassSelectReady, runId = 0 }: { steps: readonly [CalculationStep, CalculationStep, CalculationStep]; passes: readonly [Palace, Palace, Palace]; palaceCount: number; onCompleteChange?: (complete: boolean) => void; hidePassResults?: boolean; onCompletedChange?: (completed: number) => void; onPassSelectReady?: (select: (index: number) => void) => void; runId?: number }) {
  const points = getHandPoints(palaceCount)
  const animationPlan = useMemo(() => {
    const paths = steps.map((step) => getAnimationPath(step, palaceCount)) as [number[], number[], number[]]
    return { paths, timing: getAnimationTiming(steps, palaceCount) }
  }, [
    palaceCount,
    steps[0].startIndex,
    steps[0].input,
    steps[0].rounds,
    steps[0].remainder,
    steps[0].endIndex,
    steps[1].startIndex,
    steps[1].input,
    steps[1].rounds,
    steps[1].remainder,
    steps[1].endIndex,
    steps[2].startIndex,
    steps[2].input,
    steps[2].rounds,
    steps[2].remainder,
    steps[2].endIndex,
  ])
  const timing = animationPlan.timing
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [trails, setTrails] = useState<Array<{ id: number; palaceIndex: number }>>([])
  const [completed, setCompleted] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [playbackRun, setPlaybackRun] = useState(0)
  const [reducedMotion] = useState(prefersReducedMotion)
  const trailId = useRef(0)
  const animationRunId = useRef(0)
  const timersRef = useRef<ReturnType<typeof globalThis.setTimeout>[]>([])
  const onCompleteRef = useRef(onCompleteChange)
  const onCompletedRef = useRef(onCompletedChange)
  onCompleteRef.current = onCompleteChange
  onCompletedRef.current = onCompletedChange

  const clearTimers = () => {
    timersRef.current.forEach((timer) => globalThis.clearTimeout(timer))
    timersRef.current = []
  }
  const invalidateRun = () => {
    animationRunId.current += 1
    clearTimers()
  }

  const finishImmediately = () => {
    invalidateRun()
    setPlaying(false)
    setTrails([])
    setActiveIndex(passes[2].index)
    setCompleted(3)
    onCompleteRef.current?.(true)
  }
  const play = () => {
    invalidateRun()
    setPlaybackRun((run) => run + 1)
    setPlaying(true)
    setTrails([])
    setActiveIndex(null)
    setCompleted(0)
    onCompleteRef.current?.(false)
  }
  const showPass = (index: number) => {
    invalidateRun()
    setPlaying(false)
    setTrails([])
    setActiveIndex(passes[index].index)
    setCompleted((current) => Math.max(current, index + 1))
  }
  const showPassRef = useRef(showPass)
  showPassRef.current = showPass
  const lastPassIndex = passes[2].index

  useEffect(() => { onPassSelectReady?.((index) => showPassRef.current(index)) }, [onPassSelectReady])
  useEffect(() => { onCompletedRef.current?.(completed) }, [completed])

  useEffect(() => {
    const activeRunId = animationRunId.current + 1
    animationRunId.current = activeRunId
    clearTimers()
    setPlaying(true)
    setTrails([])
    setActiveIndex(null)
    setCompleted(0)

    if (reducedMotion) {
      setPlaying(false)
      setTrails([])
      setActiveIndex(lastPassIndex)
      setCompleted(3)
      onCompleteRef.current?.(true)
      return () => {
        if (animationRunId.current === activeRunId) {
          animationRunId.current += 1
          clearTimers()
        }
      }
    }

    const schedule = (callback: () => void, delay: number) => {
      const timer = globalThis.setTimeout(() => {
        if (animationRunId.current === activeRunId) callback()
      }, delay)
      timersRef.current.push(timer)
    }
    let elapsed = INITIAL_DELAY_MS
    animationPlan.paths.forEach((path, index) => {
      path.forEach((palaceIndex) => {
        schedule(() => {
          setActiveIndex((previousIndex) => {
            if (previousIndex !== null && previousIndex !== palaceIndex) {
              const id = ++trailId.current
              setTrails((current) => [...current, { id, palaceIndex: previousIndex }].slice(-3))
              schedule(() => setTrails((current) => current.filter((trail) => trail.id !== id)), TRAIL_LIFETIME_MS)
            }
            return palaceIndex
          })
        }, elapsed)
        elapsed += animationPlan.timing.stepDurationMs
      })
      schedule(() => setCompleted(index + 1), elapsed)
      if (index < animationPlan.paths.length - 1) elapsed += animationPlan.timing.passPauseMs
    })
    elapsed += FINAL_SETTLE_MS
    schedule(() => {
      animationRunId.current += 1
      clearTimers()
      setPlaying(false)
      setTrails([])
      onCompleteRef.current?.(true)
    }, elapsed)
    return () => {
      if (animationRunId.current === activeRunId) {
        animationRunId.current += 1
        clearTimers()
      }
    }
  }, [animationPlan, lastPassIndex, playbackRun, reducedMotion, runId])

  const activeName = activeIndex === null ? undefined : HAND_PALACE_ORDER[activeIndex]
  const activePoint = activeName ? points[activeName as keyof HandPoints] : undefined
  const description = reducedMotion
    ? `掐诀动画已跳过。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`
    : `左手掐诀动画：${playing ? '正在依次计数' : '播放完成'}。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`

  return <section className="hand-animation" aria-labelledby="hand-animation-title">
    <div className="animation-heading"><div><p className="pass-label">掌诀演示</p><h3 id="hand-animation-title">三传落宫</h3></div><div className="animation-actions"><button className="text-button" type="button" onClick={finishImmediately}>跳过动画</button><button className="text-button" type="button" onClick={play}>重新播放</button></div></div>
    <div className="hand-stage-area">
      <div className="hand-stage" role="img" aria-label={description}>
        <img className="hand-image" src={LEFT_PALM_IMAGE} alt="左手掌心，拇指在左侧，食指、中指、无名指和小指向上" />
        <div className="palace-layer" aria-hidden="true">
          {HAND_PALACE_ORDER.slice(0, palaceCount).map((name) => {
            const point = points[name as keyof HandPoints]
            return <span className="palace-point" key={name} style={{ left: `${point.x}%`, top: `${point.y}%` }}>{name}</span>
          })}
          {trails.map((trail) => {
            const trailName = HAND_PALACE_ORDER[trail.palaceIndex]
            const trailPoint = points[trailName as keyof HandPoints]
            return <span className="active-marker-trail-position" key={trail.id} style={{ left: `${trailPoint.x}%`, top: `${trailPoint.y}%` }}><span className="active-marker-trail" /></span>
          })}
          {activePoint && <span className="active-marker-position" style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%`, transitionDuration: `${Math.min(timing.stepDurationMs, 120)}ms` }}><span className="active-marker" /></span>}
        </div>
      </div>
    </div>
    {!hidePassResults && <PassResults passes={passes} completed={completed} onSelect={showPass} />}
  </section>
}
