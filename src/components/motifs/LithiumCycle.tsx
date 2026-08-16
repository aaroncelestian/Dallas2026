import { useEffect, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { useScene } from '../../hooks/useSceneBeats'
import styles from './Motifs.module.css'

type CycleBeat = 'brine' | 'absorb' | 'air' | 'product' | 'award' | 'recycle'
type StationId = (typeof STATIONS)[number]['id']

const RING = 118
const REPLAY_LOOPS = 5
const REPLAY_DELAY_MS = 3000
const REPLAY_LOOP_S = 0.62
const ORDER: CycleBeat[] = ['brine', 'absorb', 'air', 'product', 'award', 'recycle']
const ANGLE: Record<CycleBeat, number> = {
  brine: 180,
  absorb: 270,
  air: 270,
  product: 450,
  award: 450,
  recycle: 450,
}
const PROGRESS: Record<CycleBeat, number> = {
  brine: 0.08,
  absorb: 0.28,
  air: 0.52,
  product: 0.78,
  award: 1,
  recycle: 1,
}

const STATIONS = [
  { id: 'brine', label: 'brine', angle: 180, from: 0 },
  { id: 'spinel', label: 'H₂MnO₄', angle: 270, from: 1 },
  { id: 'air', label: 'CO₂', angle: 0, from: 2 },
  { id: 'product', label: 'Li₂CO₃', angle: 90, from: 3 },
] as const

function asBeat(id?: string): CycleBeat {
  if (id && ORDER.includes(id as CycleBeat)) return id as CycleBeat
  return 'brine'
}

function polar(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

function labelPos(deg: number) {
  const p = polar(deg, RING + 36)
  if (deg === 180) return { x: p.x - 8, y: p.y, anchor: 'end' as const }
  if (deg === 270) return { x: p.x, y: p.y - 4, anchor: 'middle' as const }
  if (deg === 0) return { x: p.x + 8, y: p.y, anchor: 'start' as const }
  return { x: p.x, y: p.y + 10, anchor: 'middle' as const }
}

function wrapAngle(deg: number) {
  return ((deg % 360) + 360) % 360
}

function nearestStation(deg: number): StationId {
  const a = wrapAngle(deg)
  let best: StationId = 'brine'
  let bestDist = 180
  for (const station of STATIONS) {
    let dist = Math.abs(a - station.angle)
    if (dist > 180) dist = 360 - dist
    if (dist < bestDist) {
      bestDist = dist
      best = station.id
    }
  }
  return best
}

const CO2 = polar(0, RING)
const BRINE = polar(180, RING)

export function LithiumCycle({ active }: { active: boolean }) {
  const scene = useScene()
  const reduced = usePrefersReducedMotion()
  const beat = asBeat(scene.beat?.id)
  const reached = ORDER.indexOf(beat)
  const recycled = beat === 'recycle'
  const [glow, setGlow] = useState<StationId | null>(null)
  const angle = useMotionValue(ANGLE[beat])
  const progress = useMotionValue(PROGRESS[beat])
  const liX = useTransform(angle, (value) => Math.cos((value * Math.PI) / 180) * RING)
  const liY = useTransform(angle, (value) => Math.sin((value * Math.PI) / 180) * RING)
  const duration = reduced || !active ? 0 : 1.05

  useMotionValueEvent(angle, 'change', (value) => {
    if (!recycled) {
      setGlow(null)
      return
    }
    setGlow(nearestStation(value))
  })

  useEffect(() => {
    if (recycled) return
    const controls = [
      animate(angle, ANGLE[beat], { duration, ease: [0.16, 1, 0.3, 1] }),
      animate(progress, PROGRESS[beat], { duration, ease: [0.16, 1, 0.3, 1] }),
    ]
    return () => {
      for (const control of controls) control.stop()
    }
  }, [angle, beat, duration, progress, recycled])

  useEffect(() => {
    if (!recycled || !active) {
      setGlow(null)
      return
    }
    angle.set(ANGLE.recycle)
    progress.set(1)
    if (reduced) {
      setGlow('brine')
      return
    }

    let replay: ReturnType<typeof animate> | undefined
    const start = window.setTimeout(() => {
      const from = angle.get()
      replay = animate(angle, from + 360 * REPLAY_LOOPS, {
        duration: REPLAY_LOOP_S * REPLAY_LOOPS,
        ease: 'linear',
      })
    }, REPLAY_DELAY_MS)

    return () => {
      window.clearTimeout(start)
      replay?.stop()
    }
  }, [active, angle, progress, recycled, reduced])

  return (
    <div className={styles.cycle} aria-label="Lithium extraction loop">
      <svg className={styles.cycleSvg} viewBox="-220 -220 440 440" role="img">
        <title>brine to H₂MnO₄ to CO₂ to Li₂CO₃, spinel returns</title>
        <circle className={styles.cycleRing} r={RING} fill="none" />
        <g transform="rotate(180)">
          <motion.circle
            className={styles.cycleArc}
            r={RING}
            fill="none"
            style={{ pathLength: progress }}
          />
        </g>
        <motion.line
          className={styles.cycleReturn}
          x1={CO2.x}
          y1={CO2.y}
          x2={BRINE.x}
          y2={BRINE.y}
          initial={false}
          animate={{ opacity: recycled ? 1 : 0 }}
          transition={{ duration }}
        />
        {STATIONS.map((station) => {
          const node = polar(station.angle, RING)
          const label = labelPos(station.angle)
          const live = reached >= station.from
          const airFall = station.id === 'air'
          const lit = glow === station.id
          return (
            <g key={station.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={lit ? 6 : live ? 4.5 : 3}
                className={styles.cycleNode}
                animate={{ opacity: live ? 1 : 0.28 }}
                transition={{ duration: 0.2 }}
              />
              <motion.text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                dominantBaseline="middle"
                className={styles.cycleLabel}
                data-glow={lit || undefined}
                initial={false}
                animate={{
                  opacity: airFall ? (live ? 1 : 0) : live ? 1 : 0.22,
                  y: airFall && !live ? label.y - 72 : label.y,
                }}
                transition={{ duration: airFall ? duration : 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {station.label}
              </motion.text>
            </g>
          )
        })}
        <motion.g style={{ x: liX, y: liY }} className={styles.cycleLi}>
          <circle r="11" />
          <text textAnchor="middle" dominantBaseline="central">
            Li
          </text>
        </motion.g>
      </svg>
    </div>
  )
}
