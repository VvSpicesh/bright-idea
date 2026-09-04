import { useEffect, useState } from 'react'
import type { CalculationStep, Palace } from '../rules'

export const PALACE_JOINTS = {
  大安: { x: 99, y: 138, finger: '食指', section: '中节' },
  留连: { x: 99, y: 91, finger: '食指', section: '上节' },
  速喜: { x: 151, y: 70, finger: '中指', section: '上节' },
  赤口: { x: 205, y: 114, finger: '无名指', section: '中节' },
  小吉: { x: 151, y: 160, finger: '中指', section: '下节' },
  空亡: { x: 151, y: 115, finger: '中指', section: '中节' },
  病符: { x: 205, y: 70, finger: '无名指', section: '上节' },
  桃花: { x: 99, y: 184, finger: '食指', section: '下节' },
  天德: { x: 205, y: 162, finger: '无名指', section: '下节' },
} as const

type PalaceName = keyof typeof PALACE_JOINTS
type Point = (typeof PALACE_JOINTS)[PalaceName]
export function getPalaceJoint(name: string): Point | undefined {
  return PALACE_JOINTS[name as PalaceName]
}

export function getCompressedPath(step: CalculationStep, palaceCount: number): number[] {
  const remainder = Number(step.remainder)
  return Array.from({ length: remainder + 1 }, (_, offset) => (step.startIndex + offset) % palaceCount)
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function LeftHandAnimation({ steps, passes, palaceCount }: { steps: readonly [CalculationStep, CalculationStep, CalculationStep]; passes: readonly [Palace, Palace, Palace]; palaceCount: number }) {
  const [passIndex, setPassIndex] = useState(-1)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [completed, setCompleted] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion] = useState(prefersReducedMotion)

  const finishImmediately = () => { setPlaying(false); setPassIndex(2); setActiveIndex(null); setCompleted(3) }
  const play = () => { setPlaying(true); setPassIndex(-1); setActiveIndex(null); setCompleted(0) }
  const showPass = (index: number) => { setPlaying(false); setPassIndex(index); setActiveIndex(passes[index].index); setCompleted(Math.max(completed, index + 1)) }

  useEffect(() => {
    if (reducedMotion || !playing) return
    let cancelled = false
    const timers: number[] = []
    let elapsed = 150
    steps.forEach((step, index) => {
      const path = getCompressedPath(step, passes.length)
      timers.push(window.setTimeout(() => { if (!cancelled) setPassIndex(index) }, elapsed))
      elapsed += Number(step.rounds) > 0 ? 350 : 0
      path.forEach((palaceIndex) => {
        timers.push(window.setTimeout(() => { if (!cancelled) setActiveIndex(palaceIndex) }, elapsed))
        elapsed += 105
      })
      timers.push(window.setTimeout(() => { if (!cancelled) { setActiveIndex(null); setCompleted(index + 1) } }, elapsed))
      elapsed += 1100
    })
    timers.push(window.setTimeout(() => { if (!cancelled) setPlaying(false) }, elapsed))
    return () => { cancelled = true; timers.forEach(window.clearTimeout) }
  }, [passes.length, playing, reducedMotion, steps])

  const currentName = activeIndex === null ? undefined : passes.find((palace) => palace.index === activeIndex)?.name
  const description = reducedMotion
    ? `掐诀动画已跳过。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`
    : `左手掐诀动画：${completed < 3 ? `正在播放${['初传', '中传', '末传'][Math.max(passIndex, 0)]}` : '播放完成'}。初传${passes[0].name}，中传${passes[1].name}，末传${passes[2].name}。`

  return <section className="hand-animation" aria-labelledby="hand-animation-title">
    <div className="animation-heading"><div><p className="pass-label">掌诀演示</p><h3 id="hand-animation-title">三传落宫</h3></div><div className="animation-actions"><button className="text-button" type="button" onClick={finishImmediately}>跳过动画</button><button className="text-button" type="button" onClick={play}>重新播放</button></div></div>
    <svg className="hand-svg" viewBox="0 0 300 250" role="img" aria-labelledby="hand-animation-title hand-animation-description">
      <desc id="hand-animation-description">{description}</desc>
      <path className="hand-palm" d="M72 214 C65 186 72 158 78 139 L80 74 C80 62 98 62 99 75 L101 126 L103 42 C103 29 121 29 122 43 L124 119 L126 24 C126 10 145 10 146 25 L149 119 L151 37 C151 23 170 23 171 38 L174 132 L179 70 C180 56 198 57 199 71 L203 142 C220 162 228 187 224 214 Z" />
      <path className="hand-thumb" d="M80 142 C61 137 42 145 35 160 C29 174 42 186 54 178 L83 159" />
      {[['大安', 99, 138], ['留连', 99, 91], ['速喜', 151, 70], ['赤口', 205, 114], ['小吉', 151, 160], ['空亡', 151, 115], ['病符', 205, 70], ['桃花', 99, 184], ['天德', 205, 162]].slice(0, palaceCount).map(([name, x, y]) => {
        const palaceName = String(name) as PalaceName
        const palace = passes.find((item) => item.name === palaceName)
        const isActive = currentName === palaceName
        const isComplete = completed > 0 && passes.slice(0, completed).some((item) => item.name === palaceName)
        return <g key={palaceName} className={isActive ? 'joint is-active' : isComplete ? 'joint is-complete' : 'joint'}><circle cx={Number(x)} cy={Number(y)} r="12" /><text x={Number(x)} y={Number(y) + 4} textAnchor="middle">{palace?.name ?? palaceName}</text></g>
      })}
      {activeIndex !== null && <><line className="pointer-line" x1="54" y1="160" x2={getPalaceJoint(currentName ?? '')?.x ?? 0} y2={getPalaceJoint(currentName ?? '')?.y ?? 0} /><circle className="pointer-light" cx={getPalaceJoint(currentName ?? '')?.x ?? 0} cy={getPalaceJoint(currentName ?? '')?.y ?? 0} r="18" /></>}
    </svg>
    <div className="pass-results" aria-live="polite">{passes.map((palace, index) => <button className={completed > index ? 'pass-result is-done' : 'pass-result'} type="button" onClick={() => showPass(index)} key={palace.name + index}><strong>{['初传', '中传', '末传'][index]}</strong>{completed > index || reducedMotion ? palace.name : '待落宫'}</button>)}</div>
    {passIndex >= 0 && Number(steps[passIndex].rounds) > 0 && playing && <p className="round-note">整圈 ×{steps[passIndex].rounds}圈，再走余数路径</p>}
  </section>
}