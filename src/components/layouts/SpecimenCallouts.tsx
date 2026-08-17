import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { SpecimenCallout } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './SpecimenCallouts.module.css'

type Box = { left: number; top: number; width: number; height: number }

type Pair = {
  id: string
  orbX: number
  orbY: number
  textX: number
  textY: number
}

const GAP = 16

function curve(p: Pair) {
  const mx = (p.orbX + p.textX) / 2
  return `M ${p.orbX} ${p.orbY} C ${mx} ${p.orbY}, ${mx} ${p.textY}, ${p.textX} ${p.textY}`
}

function stackTops(
  items: Array<{ id: string; preferred: number; height: number }>,
): Record<string, number> {
  const tops: Record<string, number> = {}
  const ordered = [...items].sort((a, b) => a.preferred - b.preferred)
  let bottom = -Infinity
  for (const item of ordered) {
    const top = Math.max(item.preferred - item.height / 2, bottom + GAP)
    tops[item.id] = top
    bottom = top + item.height
  }
  return tops
}

export function SpecimenCallouts({
  marks,
  visible,
  active,
}: {
  marks: SpecimenCallout[]
  visible: string[]
  active: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<Array<HTMLDivElement | null>>([])
  const marksRef = useRef(marks)
  marksRef.current = marks
  const [plate, setPlate] = useState<Box | null>(null)
  const [tops, setTops] = useState<Record<string, number>>({})
  const [pairs, setPairs] = useState<Pair[]>([])
  const shown = marks.filter((mark) => visible.includes(mark.id))
  const shownKey = shown.map((mark) => mark.id).join('|')

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !active || !shownKey) {
      setPlate(null)
      setPairs([])
      setTops({})
      return
    }

    const measure = () => {
      const img = root.closest('[data-scene]')?.querySelector<HTMLElement>('[data-plate]')
      if (!img) return
      const rr = root.getBoundingClientRect()
      const pr = img.getBoundingClientRect()
      const next: Box = {
        left: pr.left - rr.left,
        top: pr.top - rr.top,
        width: pr.width,
        height: pr.height,
      }
      setPlate(next)

      const current = shownKey
        .split('|')
        .map((id) => marksRef.current.find((m) => m.id === id))
        .filter((mark): mark is SpecimenCallout => Boolean(mark))

      const bySide: Record<'left' | 'right', Array<{ id: string; preferred: number; height: number }>> = {
        left: [],
        right: [],
      }
      current.forEach((mark, i) => {
        const side = mark.side ?? 'right'
        const height = labelRefs.current[i]?.getBoundingClientRect().height ?? 64
        bySide[side].push({
          id: mark.id,
          preferred: next.top + mark.y * next.height,
          height,
        })
      })
      const nextTops = { ...stackTops(bySide.left), ...stackTops(bySide.right) }
      setTops(nextTops)

      const nextPairs = current.map((mark, i) => {
        const label = labelRefs.current[i]
        const lb = label?.getBoundingClientRect()
        const side = mark.side ?? 'right'
        return {
          id: mark.id,
          orbX: next.left + mark.x * next.width,
          orbY: next.top + mark.y * next.height,
          textX: lb ? (side === 'left' ? lb.right : lb.left) - rr.left : 0,
          textY: lb ? lb.top - rr.top + lb.height / 2 : 0,
        }
      })
      setPairs(nextPairs)
    }

    measure()
    const id = window.requestAnimationFrame(measure)
    const img = root.closest('[data-scene]')?.querySelector('[data-plate]')
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    if (img) ro.observe(img)
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(id)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [active, shownKey])

  if (!shown.length) return null

  return (
    <div ref={rootRef} className={styles.root} aria-hidden={!active}>
      {shown.map((mark, i) => (
        <motion.div
          key={mark.id}
          ref={(el) => {
            labelRefs.current[i] = el
          }}
          className={styles.label}
          data-side={mark.side ?? 'right'}
          style={{
            top:
              tops[mark.id] ??
              (plate ? plate.top + mark.y * plate.height : `${mark.y * 100}%`),
          }}
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.08 }}
        >
          <div className={styles.title}>{mark.title}</div>
          {mark.formula && <div className={styles.formula}>{mark.formula}</div>}
          {mark.body && <div className={styles.body}>{mark.body}</div>}
          {mark.es && <div className={styles.es}>{mark.es}</div>}
        </motion.div>
      ))}

      <svg className={styles.svg} aria-hidden>
        {pairs.map((p) => (
          <g key={p.id}>
            <motion.circle
              cx={p.orbX}
              cy={p.orbY}
              r={3.5}
              className={styles.tick}
              initial={false}
              animate={{ opacity: active ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.35 }}
            />
            <motion.path
              d={curve(p)}
              className={styles.line}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: active ? 0.9 : 0 }}
              transition={{
                pathLength: { duration: reduced ? 0 : 0.75, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: reduced ? 0 : 0.35 },
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
