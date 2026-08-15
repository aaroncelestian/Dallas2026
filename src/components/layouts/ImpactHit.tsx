import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './ImpactHit.module.css'

type Phase = 'hold' | 'pull' | 'settled'

const HOLD_MS = 5000
const PULL_MS = 8000
const NONE: string[] = []
const HOLD_PUSH = 1.06

type Focus = { x: number; y: number; w: number; h: number }

function measure(frame: DOMRect, imgW: number, imgH: number, focus?: Focus) {
  const drawH = frame.height
  const drawW = drawH * (imgW / imgH)
  const pad = frame.width * 0.045
  const region = focus ?? { x: 0.35, y: 0.35, w: 0.3, h: 0.22 }
  const focusW = Math.max(drawW * region.w, 1)
  const focusH = Math.max(drawH * region.h, 1)
  return {
    zoom: Math.max(frame.width / focusW, frame.height / focusH),
    endX: (frame.width - drawW) / 2 - pad,
    originX: (region.x + region.w / 2) * 100,
    originY: (region.y + region.h / 2) * 100,
  }
}

export function ImpactHit({
  src,
  alt,
  active,
  facts,
  focus,
}: {
  src: string
  alt: string
  active: boolean
  facts?: string[]
  focus?: Focus
}) {
  const lines = facts ?? NONE
  const reduced = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('hold')
  const [shown, setShown] = useState(0)
  const [pose, setPose] = useState({ zoom: 7.2, endX: 280, originX: 52, originY: 52 })

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
      return
    }
    if (reduced) {
      setPhase('settled')
      setShown(lines.length)
      return
    }
    setPhase('hold')
    setShown(0)
    const gap = lines.length ? PULL_MS / lines.length : PULL_MS
    const pull = window.setTimeout(() => setPhase('pull'), HOLD_MS)
    const factTimers = lines.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), HOLD_MS + i * gap),
    )
    const settled = window.setTimeout(() => setPhase('settled'), HOLD_MS + PULL_MS)
    return () => {
      window.clearTimeout(pull)
      window.clearTimeout(settled)
      factTimers.forEach((id) => window.clearTimeout(id))
    }
  }, [active, reduced, lines])

  const pulling = reduced || phase === 'pull' || phase === 'settled'

  return (
    <div ref={rootRef} className={styles.root} data-phase={phase}>
      <div className={styles.slot}>
        <motion.img
          src={src}
          alt={alt}
          className={styles.photo}
          style={{ transformOrigin: `${pose.originX}% ${pose.originY}%` }}
          initial={false}
          animate={{
            scale: pulling ? 1 : phase === 'hold' ? pose.zoom * HOLD_PUSH : pose.zoom,
            x: pulling ? pose.endX : 0,
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
        />
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
