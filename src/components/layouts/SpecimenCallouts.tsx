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

function isFree(mark: SpecimenCallout) {
  return mark.lx != null && mark.ly != null
}

function attach(
  orbX: number,
  orbY: number,
  lb: DOMRect,
  rr: DOMRect,
  side?: 'left' | 'right',
) {
  const left = lb.left - rr.left
  const right = lb.right - rr.left
  const top = lb.top - rr.top
  const cy = top + lb.height / 2
  if (side === 'left') return { textX: right, textY: cy }
  if (side === 'right') return { textX: left, textY: cy }
  const cx = left + lb.width / 2
  const bottom = top + lb.height
  const dx = orbX - cx
  const dy = orbY - cy
  if (Math.abs(dx) > Math.abs(dy)) {
    return { textX: dx > 0 ? right : left, textY: cy }
  }
  return { textX: cx, textY: dy > 0 ? bottom : top }
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
        if (isFree(mark)) return
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
        const orbX = next.left + mark.x * next.width
        const orbY = next.top + mark.y * next.height
        const edge = lb
          ? attach(orbX, orbY, lb, rr, isFree(mark) ? undefined : (mark.side ?? 'right'))
          : { textX: 0, textY: 0 }
        return {
          id: mark.id,
          orbX,
          orbY,
          textX: edge.textX,
          textY: edge.textY,
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

  let dump = 0

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-clutter={shown.some(isFree) || undefined}
      aria-hidden={!active}
    >
      <svg className={styles.svg} aria-hidden>
        {pairs.map((p) => {
          const mark = shown.find((item) => item.id === p.id)
          const free = mark ? isFree(mark) : false
          const order = mark ? shown.filter(isFree).findIndex((item) => item.id === p.id) : 0
          const delay = reduced ? 0 : free ? 0.06 + Math.max(0, order) * 0.11 : 0
          return (
            <g key={p.id}>
              <motion.circle
                cx={p.orbX}
                cy={p.orbY}
                r={3.5}
                className={styles.tick}
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.35, delay }}
              />
              <motion.path
                d={curve(p)}
                className={styles.line}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: active ? 0.9 : 0 }}
                transition={{
                  pathLength: { duration: reduced ? 0 : 0.7, delay, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: reduced ? 0 : 0.3, delay },
                }}
              />
            </g>
          )
        })}
      </svg>

      {shown.map((mark, i) => {
        const free = isFree(mark)
        const delay = reduced ? 0 : free ? 0.06 + dump++ * 0.11 : 0.08
        return (
          <motion.div
            key={mark.id}
            ref={(el) => {
              labelRefs.current[i] = el
            }}
            className={styles.label}
            data-side={free ? undefined : (mark.side ?? 'right')}
            data-free={free || undefined}
            style={
              free && plate && mark.lx != null && mark.ly != null
                ? {
                    left: plate.left + mark.lx * plate.width,
                    top: plate.top + mark.ly * plate.height,
                    ['--tilt' as string]: `${mark.tilt ?? 0}deg`,
                  }
                : {
                    top:
                      tops[mark.id] ??
                      (plate ? plate.top + mark.y * plate.height : `${mark.y * 100}%`),
                  }
            }
            initial={free ? { opacity: 0 } : false}
            animate={{ opacity: active && (!free || plate) ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.4, delay }}
          >
            <div className={styles.title}>{mark.title}</div>
            {mark.formula && <div className={styles.formula}>{mark.formula}</div>}
            {mark.body && <div className={styles.body}>{mark.body}</div>}
            {mark.es && <div className={styles.es}>{mark.es}</div>}
          </motion.div>
        )
      })}
    </div>
  )
}
