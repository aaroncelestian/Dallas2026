import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScaleBar, VideoHold, VideoMark } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './SceneVideo.module.css'

type Box = { x: number; y: number; w: number; h: number }

const SLACK = 0.05
const VIDEO_W = 1482
const VIDEO_H = 834
const GAP = 14

function contain(cw: number, ch: number, vw: number, vh: number): Box {
  const s = Math.min(cw / vw, ch / vh)
  const w = vw * s
  const h = vh * s
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h }
}

function stackTops(items: Array<{ id: string; preferred: number; height: number }>) {
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

function markColor(kind: VideoMark['kind']) {
  if (kind === 'mineral') return 'var(--video-mineral)'
  if (kind === 'biomass') return 'var(--video-biomass)'
  return 'var(--color-accent-600)'
}

function SceneVideoOverlay({
  marks,
  plate,
  reduced,
}: {
  marks: VideoMark[]
  plate: Box
  reduced: boolean
}) {
  const labelRefs = useRef<Array<HTMLDivElement | null>>([])
  const [tops, setTops] = useState<Record<string, number>>({})
  const shownKey = marks.map((m) => m.id).join('|')

  useLayoutEffect(() => {
    if (!shownKey || !plate.w) {
      setTops({})
      return
    }
    const bySide: Record<'left' | 'right', Array<{ id: string; preferred: number; height: number }>> =
      { left: [], right: [] }
    marks.forEach((mark, i) => {
      const side = mark.side ?? 'right'
      const height = labelRefs.current[i]?.getBoundingClientRect().height ?? 52
      bySide[side].push({
        id: mark.id,
        preferred: mark.y * plate.h,
        height,
      })
    })
    setTops({ ...stackTops(bySide.left), ...stackTops(bySide.right) })
  }, [marks, plate.h, plate.w, shownKey])

  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${plate.w} ${plate.h}`} aria-hidden>
        {marks.map((mark) => {
          const cx = mark.x * plate.w
          const cy = mark.y * plate.h
          const side = mark.side ?? 'right'
          const labelY = (tops[mark.id] ?? cy) + 12
          const textX = side === 'left' ? 8 : plate.w - 8
          const midX = (cx + textX) / 2
          const color = markColor(mark.kind)
          const rings = mark.kind === 'onion' ? (mark.rings ?? 3) : 0
          const rx = (mark.rx ?? 0.05) * plate.w
          const ry = (mark.ry ?? 0.055) * plate.h
          return (
            <g key={mark.id}>
              {Array.from({ length: rings }, (_, i) => {
                const t = (i + 1) / rings
                return (
                  <motion.ellipse
                    key={`${mark.id}-r${i}`}
                    cx={cx}
                    cy={cy}
                    rx={rx * t}
                    ry={ry * t}
                    className={styles.onion}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{
                      pathLength: { duration: reduced ? 0 : 0.85, delay: reduced ? 0 : i * 0.12 },
                      opacity: { duration: reduced ? 0 : 0.4 },
                    }}
                  />
                )
              })}
              <motion.circle
                cx={cx}
                cy={cy}
                r={mark.kind === 'onion' ? 4 : 5.5}
                fill={color}
                className={styles.orb}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0 : 0.4 }}
              />
              <motion.path
                d={`M ${cx} ${cy} C ${midX} ${cy}, ${midX} ${labelY}, ${textX} ${labelY}`}
                className={styles.line}
                style={{ stroke: color }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{
                  pathLength: { duration: reduced ? 0 : 0.7, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: reduced ? 0 : 0.3 },
                }}
              />
            </g>
          )
        })}
      </svg>
      {marks.map((mark, i) => (
        <motion.div
          key={mark.id}
          ref={(el) => {
            labelRefs.current[i] = el
          }}
          className={styles.label}
          data-side={mark.side ?? 'right'}
          data-kind={mark.kind}
          style={{ top: tops[mark.id] ?? mark.y * plate.h }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.08 }}
        >
          <div className={styles.title}>{mark.title}</div>
          {mark.body && <div className={styles.body}>{mark.body}</div>}
        </motion.div>
      ))}
    </>
  )
}

export function SceneVideo({
  src,
  poster,
  alt,
  active,
  fit = 'contain',
  holdAt,
  holds,
  scaleBar,
}: {
  src: string
  poster?: string
  alt?: string
  active: boolean
  fit?: 'cover' | 'contain'
  holdAt?: number
  holds?: VideoHold[]
  scaleBar?: ScaleBar
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduced = usePrefersReducedMotion()
  const stops = useMemo(
    () => (holds?.length ? holds : holdAt != null ? [{ at: holdAt }] : []),
    [holdAt, holds],
  )
  const last = Math.max(0, stops.length - 1)
  const [step, setStep] = useState(0)
  const [parked, setParked] = useState(false)
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 })
  const [videoSize, setVideoSize] = useState({ w: VIDEO_W, h: VIDEO_H })
  const live = useRef({ step: 0, parked: false })
  live.current = { step, parked }

  const hold = parked ? stops[step] : undefined
  const marks = hold?.marks ?? []

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const r = stage.getBoundingClientRect()
      setBox(contain(r.width, r.height, videoSize.w, videoSize.h))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [videoSize.h, videoSize.w])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (reduced || !active) {
      el.pause()
      if (reduced && active && stops.length) {
        const end = stops[last]
        el.currentTime = end.at
        setStep(last)
        setParked(true)
      }
      if (!active) {
        el.currentTime = 0
        setStep(0)
        setParked(false)
      }
      return
    }
    el.currentTime = 0
    setStep(0)
    setParked(false)
    void el.play()
  }, [active, last, reduced, src, stops.length])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !stops.length) return

    const parkAt = (index: number) => {
      const next = stops[index]
      if (!next) return
      el.pause()
      el.currentTime = next.at
      setStep(index)
      setParked(true)
    }

    const onTime = () => {
      if (live.current.parked) return
      const target = stops[live.current.step]
      if (!target) return
      if (el.currentTime + SLACK < target.at) return
      parkAt(live.current.step)
    }

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onTime)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onTime)
    }
  }, [src, stops])

  useEffect(() => {
    if (!active || !stops.length) return
    const el = videoRef.current

    const goNext = () => {
      const { step: i, parked: atHold } = live.current
      if (!atHold) {
        const target = stops[i]
        if (!target || !el) return false
        el.pause()
        el.currentTime = target.at
        setParked(true)
        return true
      }
      if (i >= last) return false
      const following = i + 1
      setParked(false)
      setStep(following)
      if (el) {
        el.currentTime = stops[i].at + 0.05
        void el.play()
      }
      return true
    }

    const goPrev = () => {
      const { step: i, parked: atHold } = live.current
      const back = atHold ? i - 1 : i - 1
      if (back < 0) return false
      if (!el) return false
      el.pause()
      el.currentTime = stops[back].at
      setStep(back)
      setParked(true)
      return true
    }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      if (document.documentElement.hasAttribute('data-resource')) return
      const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)
      const prev = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)
      if (next && goNext()) {
        e.preventDefault()
        e.stopPropagation()
      } else if (prev && goPrev()) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, last, stops])

  const framed = Boolean(stops.length || scaleBar)
  const video = (
    <video
      ref={videoRef}
      className={framed ? styles.video : styles.bleed}
      data-fit={framed ? undefined : fit}
      src={src}
      poster={poster}
      muted
      loop={!stops.length}
      playsInline
      preload="auto"
      aria-label={alt}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        if (v.videoWidth && v.videoHeight) setVideoSize({ w: v.videoWidth, h: v.videoHeight })
      }}
    />
  )

  if (!framed) return video

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onClick={() => {
        if (!active || !stops.length) return
        const { step: i, parked: atHold } = live.current
        const el = videoRef.current
        if (!atHold) {
          const target = stops[i]
          if (!target || !el) return
          el.pause()
          el.currentTime = target.at
          setParked(true)
          return
        }
        if (i >= last) return
        setParked(false)
        setStep(i + 1)
        if (el) {
          el.currentTime = stops[i].at + 0.05
          void el.play()
        }
      }}
    >
      <div
        className={styles.plate}
        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        data-video-plate=""
      >
        {video}
        {scaleBar && box.w > 0 && (
          <div className={styles.scale} aria-hidden>
            <span className={styles.scaleBar} style={{ width: `${scaleBar.width * 100}%` }} />
            <span className={styles.scaleLabel}>{scaleBar.mm} mm</span>
          </div>
        )}
        <div className={styles.legend} aria-hidden>
          <span data-kind="mineral">Mineral</span>
          <span data-kind="biomass">Biomass</span>
        </div>
        <AnimatePresence>
          {parked && marks.length > 0 && box.w > 0 && (
            <motion.div
              key={hold?.at ?? 'hold'}
              className={styles.readout}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.35 }}
            >
              <SceneVideoOverlay marks={marks} plate={{ ...box, x: 0, y: 0 }} reduced={reduced} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
