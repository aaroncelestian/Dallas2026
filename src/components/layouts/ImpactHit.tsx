import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { StoneMark } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './ImpactHit.module.css'

type Phase = 'hold' | 'pull' | 'settled'

const HOLD_MS = 5000
const PULL_MS = 8000
const DETAIL_FADE_S = 2
const MARK_START_MS = 5000
const MARK_STAGGER_MS = 550
const NONE: string[] = []
const NO_MARKS: StoneMark[] = []
const HOLD_PUSH = 1.06

type Focus = { x: number; y: number; w: number; h: number }

type Pose = {
  holdScale: number
  holdX: number
  holdY: number
  endScale: number
  endX: number
  endY: number
  originX: number
  originY: number
  imgW: number
  imgH: number
}

type Anchor = { label: string; cx: number; cy: number; left: number }

function measure(frame: DOMRect, imgW: number, imgH: number, focus?: Focus): Pose {
  const region = focus ?? { x: 0.35, y: 0.35, w: 0.3, h: 0.22 }
  const focusW = Math.max(imgW * region.w, 1)
  const focusH = Math.max(imgH * region.h, 1)
  const originX = (region.x + region.w / 2) * imgW
  const originY = (region.y + region.h / 2) * imgH
  const pad = frame.width * 0.045
  const endScale = frame.height / imgH
  return {
    holdScale: Math.max(frame.width / focusW, frame.height / focusH),
    holdX: frame.width / 2 - originX,
    holdY: frame.height / 2 - originY,
    endScale,
    endX: frame.width - pad - originX - (imgW - originX) * endScale,
    endY: originY * (endScale - 1),
    originX,
    originY,
    imgW,
    imgH,
  }
}

function readAnchors(
  plane: HTMLElement,
  slot: HTMLElement,
  marks: StoneMark[],
): Anchor[] {
  const pr = plane.getBoundingClientRect()
  const sr = slot.getBoundingClientRect()
  return marks.map((m) => ({
    label: m.label,
    cx: pr.left - sr.left + (m.x + m.w / 2) * pr.width,
    cy: pr.top - sr.top + (m.y + m.h / 2) * pr.height,
    left: pr.left - sr.left + m.x * pr.width,
  }))
}

function useMarkAnchors(
  planeRef: React.RefObject<HTMLDivElement | null>,
  slotRef: React.RefObject<HTMLDivElement | null>,
  marks: StoneMark[],
  visible: boolean,
  live: boolean,
) {
  const [anchors, setAnchors] = useState<Anchor[]>([])

  useEffect(() => {
    if (!visible || marks.length === 0) {
      setAnchors([])
      return
    }

    const write = () => {
      const plane = planeRef.current
      const slot = slotRef.current
      if (!plane || !slot) return
      setAnchors(readAnchors(plane, slot, marks))
    }

    write()
    if (!live) {
      const slot = slotRef.current
      if (!slot) return
      const ro = new ResizeObserver(write)
      ro.observe(slot)
      return () => ro.disconnect()
    }

    let id = 0
    const tick = () => {
      write()
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [visible, live, marks, planeRef, slotRef])

  return anchors
}

export function ImpactHit({
  src,
  alt,
  active,
  facts,
  focus,
  detailSrc,
  marks,
}: {
  src: string
  alt: string
  active: boolean
  facts?: string[]
  focus?: Focus
  detailSrc?: string
  marks?: StoneMark[]
}) {
  const lines = facts ?? NONE
  const stones = marks ?? NO_MARKS
  const reduced = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('hold')
  const [shown, setShown] = useState(0)
  const [marked, setMarked] = useState(0)
  const [pose, setPose] = useState<Pose | null>(null)
  const pulling = reduced || phase === 'pull' || phase === 'settled'
  const anchors = useMarkAnchors(
    planeRef,
    slotRef,
    stones,
    active && pulling,
    phase === 'pull' && !reduced,
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const img = new Image()
    img.src = src

    const update = () => {
      const frame = root.getBoundingClientRect()
      if (!img.naturalWidth || !frame.width) return
      setPose(measure(frame, img.naturalWidth, img.naturalHeight, focus))
    }

    img.onload = update
    if (img.complete) update()

    const ro = new ResizeObserver(update)
    ro.observe(root)
    return () => ro.disconnect()
  }, [src, focus])

  useEffect(() => {
    if (!active) {
      setPhase('hold')
      setShown(0)
      setMarked(0)
      return
    }
    if (reduced) {
      setPhase('settled')
      setShown(lines.length)
      setMarked(stones.length)
      return
    }
    setPhase('hold')
    setShown(0)
    setMarked(0)
    const gap = lines.length ? PULL_MS / lines.length : PULL_MS
    const pull = window.setTimeout(() => setPhase('pull'), HOLD_MS)
    const factTimers = lines.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), HOLD_MS + i * gap),
    )
    const markTimers = stones.map((_, i) =>
      window.setTimeout(() => setMarked(i + 1), HOLD_MS + MARK_START_MS + i * MARK_STAGGER_MS),
    )
    const settled = window.setTimeout(() => setPhase('settled'), HOLD_MS + PULL_MS)
    return () => {
      window.clearTimeout(pull)
      window.clearTimeout(settled)
      factTimers.forEach((id) => window.clearTimeout(id))
      markTimers.forEach((id) => window.clearTimeout(id))
    }
  }, [active, reduced, lines, stones])

  const overlay = focus && detailSrc
  const columnX =
    anchors.length > 0 ? Math.min(...anchors.map((a) => a.left)) - 28 : 0

  return (
    <div ref={rootRef} className={styles.root} data-phase={phase}>
      <div ref={slotRef} className={styles.slot}>
        {pose && (
          <motion.div
            ref={planeRef}
            className={styles.plane}
            style={{
              width: pose.imgW,
              height: pose.imgH,
              transformOrigin: `${pose.originX}px ${pose.originY}px`,
            }}
            initial={false}
            animate={{
              scale: pulling
                ? pose.endScale
                : phase === 'hold'
                  ? pose.holdScale * HOLD_PUSH
                  : pose.holdScale,
              x: pulling ? pose.endX : pose.holdX,
              y: pulling ? pose.endY : pose.holdY,
            }}
            transition={
              reduced
                ? { duration: 0 }
                : phase === 'pull'
                  ? { duration: PULL_MS / 1000, ease: [0.4, 0, 0.6, 1] }
                  : phase === 'hold'
                    ? { duration: HOLD_MS / 1000, ease: 'linear' }
                    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <img src={src} alt={alt} className={styles.photo} draggable={false} />
            {overlay && (
              <motion.img
                src={detailSrc}
                alt=""
                className={styles.detail}
                style={{
                  left: `${focus.x * 100}%`,
                  top: `${focus.y * 100}%`,
                  width: `${focus.w * 100}%`,
                  height: `${focus.h * 100}%`,
                }}
                initial={false}
                animate={{ opacity: pulling ? 0 : 1 }}
                transition={{
                  duration: reduced ? 0 : pulling ? DETAIL_FADE_S : 0,
                  ease: 'linear',
                }}
                draggable={false}
              />
            )}
            {stones.length > 0 && (
              <svg
                className={styles.markSvg}
                viewBox={`0 0 ${pose.imgW} ${pose.imgH}`}
                aria-hidden
              >
                {stones.map((m, i) => {
                  const x = m.x * pose.imgW
                  const y = m.y * pose.imgH
                  const w = m.w * pose.imgW
                  const h = m.h * pose.imgH
                  const visible = i < marked
                  return m.shape === 'rect' ? (
                    <motion.rect
                      key={m.label}
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={3}
                      className={styles.markShape}
                      initial={false}
                      animate={{ opacity: visible ? 1 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ) : (
                    <motion.ellipse
                      key={m.label}
                      cx={x + w / 2}
                      cy={y + h / 2}
                      rx={w / 2}
                      ry={h / 2}
                      className={styles.markShape}
                      initial={false}
                      animate={{ opacity: visible ? 1 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )
                })}
              </svg>
            )}
          </motion.div>
        )}
        {stones.length > 0 && (
          <svg className={styles.calloutSvg} aria-hidden>
            {stones.map((m, i) => {
              const a = anchors.find((n) => n.label === m.label)
              if (!a || i >= marked) return null
              return (
                <motion.line
                  key={m.label}
                  x1={columnX}
                  y1={a.cy}
                  x2={a.left}
                  y2={a.cy}
                  className={styles.calloutLine}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              )
            })}
          </svg>
        )}
        {stones.map((m, i) => {
          const a = anchors.find((n) => n.label === m.label)
          if (!a) return null
          return (
            <motion.div
              key={m.label}
              className={styles.markLabel}
              style={{ left: columnX, top: a.cy }}
              initial={false}
              animate={{ opacity: i < marked ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {m.label}
            </motion.div>
          )
        })}
      </div>
      {lines.length > 0 && (
        <ul className={styles.facts} aria-label="Cabinet facts">
          {lines.map((line, i) => (
            <motion.li
              key={line}
              className={styles.fact}
              initial={false}
              animate={{ opacity: i < shown ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
