import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './ImpactHit.module.css'

type Phase = 'hold' | 'pull' | 'settled'

const HOLD_MS = 5000
const PULL_MS = 8000
const DETAIL_FADE_S = 2
const NONE: string[] = []
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

export function ImpactHit({
  src,
  alt,
  active,
  facts,
  focus,
  detailSrc,
}: {
  src: string
  alt: string
  active: boolean
  facts?: string[]
  focus?: Focus
  detailSrc?: string
}) {
  const lines = facts ?? NONE
  const reduced = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('hold')
  const [shown, setShown] = useState(0)
  const [pose, setPose] = useState<Pose | null>(null)

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
  const overlay = focus && detailSrc

  return (
    <div ref={rootRef} className={styles.root} data-phase={phase}>
      <div className={styles.slot}>
        {pose && (
          <motion.div
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
          </motion.div>
        )}
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
