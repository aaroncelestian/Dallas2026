import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScaleBar, VideoHold, VideoMark, VideoMarkKind } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './SceneVideo.module.css'

type Box = { x: number; y: number; w: number; h: number }

const SLACK = 0.05
const NEAR = 0.12
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

function fmt(t: number) {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function cloneHolds(holds: VideoHold[]): VideoHold[] {
  return holds.map((h) => ({
    at: h.at,
    marks: h.marks?.map((m) => ({ ...m })),
  }))
}

function sortHolds(holds: VideoHold[]) {
  return [...holds].sort((a, b) => a.at - b.at)
}

function holdsJson(holds: VideoHold[]) {
  return JSON.stringify(holds, null, 2)
}

function SceneVideoOverlay({
  marks,
  plate,
  reduced,
  selectedId,
  onSelect,
}: {
  marks: VideoMark[]
  plate: Box
  reduced: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
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
          const selected = selectedId === mark.id
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
                r={mark.kind === 'onion' ? 4 : selected ? 7 : 5.5}
                fill={color}
                className={styles.orb}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0 : 0.4 }}
                style={selected ? { stroke: '#fff', strokeWidth: 2 } : undefined}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(mark.id)
                }}
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
          data-selected={selectedId === mark.id || undefined}
          style={{ top: tops[mark.id] ?? mark.y * plate.h }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.08 }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(mark.id)
          }}
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
  const seed = useMemo(
    () => (holds?.length ? cloneHolds(holds) : holdAt != null ? [{ at: holdAt }] : []),
    [holdAt, holds],
  )
  const [draft, setDraft] = useState<VideoHold[]>(seed)
  const stops = draft
  const last = Math.max(0, stops.length - 1)
  const [step, setStep] = useState(0)
  const [parked, setParked] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [dur, setDur] = useState(0)
  const [annotate, setAnnotate] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 })
  const [videoSize, setVideoSize] = useState({ w: VIDEO_W, h: VIDEO_H })
  const [kindDraft, setKindDraft] = useState<VideoMarkKind>('mineral')
  const resumeGateRef = useRef(0)
  const live = useRef({ step: 0, parked: false, annotate: false, last: 0 })
  live.current = { step, parked, annotate, last }

  useEffect(() => {
    setDraft(seed)
  }, [seed])

  const hold = parked ? stops[step] : undefined
  const marks = hold?.marks ?? []
  const selected = marks.find((m) => m.id === selectedId) ?? null

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
      setPlaying(false)
      if (reduced && active && stops.length) {
        const end = stops[last]
        el.currentTime = end.at
        setT(end.at)
        setStep(last)
        setParked(true)
      }
      if (!active) {
        el.currentTime = 0
        setT(0)
        setStep(0)
        setParked(false)
        setAnnotate(false)
        setSelectedId(null)
      }
      return
    }
    el.currentTime = 0
    setT(0)
    setStep(0)
    setParked(false)
    setSelectedId(null)
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [active, last, reduced, src, stops.length])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const onTime = () => {
      setT(el.currentTime)
      if (live.current.parked || !stops.length) return
      if (el.currentTime < resumeGateRef.current) return
      const target = stops[live.current.step]
      if (!target) return
      if (el.currentTime + SLACK < target.at) return
      el.pause()
      el.currentTime = target.at
      setT(target.at)
      setStep(live.current.step)
      setParked(true)
      setPlaying(false)
      resumeGateRef.current = 0
    }
    const onMeta = () => setDur(el.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    if (el.duration) setDur(el.duration)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [src, stops])

  /** Leave a hold and play forward to the next — do not seek (keyframe snap jumps holds). */
  const resumeFromHold = (i: number) => {
    const el = videoRef.current
    if (!el || i >= last) return false
    const gate = stops[i].at + 0.2
    resumeGateRef.current = gate
    live.current.parked = false
    live.current.step = i + 1
    setParked(false)
    setStep(i + 1)
    setSelectedId(null)
    setPlaying(true)
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    return true
  }

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (!el.paused) {
      el.pause()
      setPlaying(false)
      return
    }
    const { step: i, parked: atHold, last: end } = live.current
    if (atHold) {
      if (i >= end) {
        resumeGateRef.current = 0
        live.current.parked = false
        live.current.step = 0
        setParked(false)
        setStep(0)
        setSelectedId(null)
        el.currentTime = 0
        setT(0)
        void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
        return
      }
      resumeFromHold(i)
      return
    }
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  useEffect(() => {
    if (!active) return
    const el = videoRef.current

    const goNext = () => {
      const { step: i, parked: atHold } = live.current
      if (!atHold) {
        const target = stops[i]
        if (!target || !el) return false
        resumeGateRef.current = 0
        el.pause()
        el.currentTime = target.at
        setT(target.at)
        setParked(true)
        setPlaying(false)
        return true
      }
      return resumeFromHold(i)
    }

    const goPrev = () => {
      const { step: i, parked: atHold } = live.current
      const back = atHold ? i - 1 : i - 1
      if (back < 0) return false
      if (!el) return false
      resumeGateRef.current = 0
      el.pause()
      el.currentTime = stops[back].at
      setT(stops[back].at)
      setStep(back)
      setParked(true)
      setPlaying(false)
      setSelectedId(null)
      return true
    }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      if (document.documentElement.hasAttribute('data-resource')) return

      if (e.key === 'a' || e.key === 'A') {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        e.preventDefault()
        e.stopPropagation()
        setAnnotate((v) => !v)
        return
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        e.stopPropagation()
        togglePlay()
        return
      }

      if (
        live.current.annotate &&
        (e.key === 'Backspace' || e.key === 'Delete') &&
        live.current.parked
      ) {
        e.preventDefault()
        e.stopPropagation()
        removeHold()
        return
      }

      if (live.current.annotate) return

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

  const scrubTo = (next: number) => {
    const el = videoRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(dur || el.duration || next, next))
    el.pause()
    el.currentTime = clamped
    setT(clamped)
    setPlaying(false)

    const near = stops.findIndex((h) => Math.abs(h.at - clamped) <= NEAR)
    if (near >= 0) {
      el.currentTime = stops[near].at
      setT(stops[near].at)
      setStep(near)
      setParked(true)
      return
    }
    setParked(false)
    const upcoming = stops.findIndex((h) => h.at > clamped + SLACK)
    setStep(upcoming >= 0 ? upcoming : Math.max(0, stops.length - 1))
    setSelectedId(null)
  }

  const addHoldHere = () => {
    const at = Math.round(t * 100) / 100
    setDraft((prev) => {
      const existing = prev.findIndex((h) => Math.abs(h.at - at) <= NEAR)
      if (existing >= 0) return prev
      return sortHolds([...prev, { at, marks: [] }])
    })
    const el = videoRef.current
    if (el) {
      el.pause()
      el.currentTime = at
    }
    setPlaying(false)
    setParked(true)
    setSelectedId(null)
    // step will resolve on next render via effect below
  }

  useEffect(() => {
    if (!parked) return
    const i = stops.findIndex((h) => Math.abs(h.at - t) <= NEAR)
    if (i >= 0 && i !== step) setStep(i)
  }, [parked, stops, t, step])

  const removeHold = (index?: number) => {
    const i = index ?? (parked ? step : stops.findIndex((h) => Math.abs(h.at - t) <= NEAR))
    if (i < 0 || !stops[i]) return
    const remaining = stops.filter((_, j) => j !== i)
    setDraft(remaining)
    setSelectedId(null)
    const el = videoRef.current
    if (!remaining.length) {
      setParked(false)
      setStep(0)
      return
    }
    const next = Math.min(i, remaining.length - 1)
    const hold = remaining[next]
    if (el) {
      el.pause()
      el.currentTime = hold.at
      setT(hold.at)
      setPlaying(false)
    }
    setStep(next)
    setParked(true)
  }

  const placeMark = (clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (!stage || !box.w || !box.h) return
    const stageRect = stage.getBoundingClientRect()
    const x = Math.min(0.98, Math.max(0.02, (clientX - stageRect.left - box.x) / box.w))
    const y = Math.min(0.98, Math.max(0.02, (clientY - stageRect.top - box.y) / box.h))
    const at = Math.round(t * 100) / 100

    setDraft((prev) => {
      let next = cloneHolds(prev)
      let hi = next.findIndex((h) => Math.abs(h.at - at) <= NEAR)
      if (hi < 0) {
        next = sortHolds([...next, { at, marks: [] }])
        hi = next.findIndex((h) => Math.abs(h.at - at) <= NEAR)
      }
      const id = `mark-${Date.now().toString(36)}`
      const mark: VideoMark = {
        id,
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        kind: kindDraft,
        side: x < 0.5 ? 'left' : 'right',
        title:
          kindDraft === 'onion'
            ? 'Onion structure.'
            : kindDraft === 'mineral'
              ? 'Mineral.'
              : 'Biomass.',
        body: '',
        ...(kindDraft === 'onion' ? { rx: 0.07, ry: 0.08, rings: 3 } : {}),
      }
      const marks = [...(next[hi].marks ?? []), mark]
      next[hi] = { ...next[hi], marks }
      setSelectedId(id)
      setStep(hi)
      setParked(true)
      const el = videoRef.current
      if (el) {
        el.pause()
        el.currentTime = next[hi].at
        setT(next[hi].at)
        setPlaying(false)
      }
      return next
    })
  }

  const patchMark = (id: string, patch: Partial<VideoMark>) => {
    setDraft((prev) =>
      prev.map((h, i) => {
        if (i !== step) return h
        return {
          ...h,
          marks: (h.marks ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }
      }),
    )
  }

  const deleteMark = (id: string) => {
    setDraft((prev) =>
      prev.map((h, i) => {
        if (i !== step) return h
        return { ...h, marks: (h.marks ?? []).filter((m) => m.id !== id) }
      }),
    )
    setSelectedId(null)
  }

  const copyJson = async () => {
    const text = holdsJson(draft)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Copy holds JSON', text)
    }
  }

  const framed = Boolean(stops.length || scaleBar || annotate)
  const video = (
    <video
      ref={videoRef}
      className={framed ? styles.video : styles.bleed}
      data-fit={framed ? undefined : fit}
      src={src}
      poster={poster}
      muted
      loop={!stops.length && !annotate}
      playsInline
      preload="auto"
      aria-label={alt}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        if (v.videoWidth && v.videoHeight) setVideoSize({ w: v.videoWidth, h: v.videoHeight })
        setDur(v.duration || 0)
      }}
    />
  )

  if (!framed) return video

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-annotate={annotate || undefined}
      onClick={(e) => {
        if (!active) return
        if ((e.target as HTMLElement).closest(`.${styles.chrome}`)) return
        if ((e.target as HTMLElement).closest(`.${styles.panel}`)) return

        if (annotate) {
          placeMark(e.clientX, e.clientY)
          return
        }

        if (!stops.length) return
        const { step: i, parked: atHold } = live.current
        const el = videoRef.current
        if (!atHold) {
          const target = stops[i]
          if (!target || !el) return
          resumeGateRef.current = 0
          el.pause()
          el.currentTime = target.at
          setT(target.at)
          setParked(true)
          setPlaying(false)
          return
        }
        resumeFromHold(i)
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
              <SceneVideoOverlay
                marks={marks}
                plate={{ ...box, x: 0, y: 0 }}
                reduced={reduced}
                selectedId={annotate ? selectedId : null}
                onSelect={annotate ? setSelectedId : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {active &&
        createPortal(
          <>
            <div
              className={styles.chrome}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.transportBtn}
                onClick={togglePlay}
                aria-label={playing ? 'Pause' : 'Play'}
                title="Play / pause (K)"
              >
                {playing ? 'Pause' : 'Play'}
              </button>

              <div className={styles.scrubWrap}>
                <input
                  className={styles.scrub}
                  type="range"
                  min={0}
                  max={Math.max(dur, 0.01)}
                  step={0.01}
                  value={Math.min(t, dur || t)}
                  aria-label="Scrub timeline"
                  onChange={(e) => scrubTo(Number(e.target.value))}
                />
                <div className={styles.holdTicks} aria-hidden>
                  {stops.map((h, i) => (
                    <button
                      key={`${h.at}-${i}`}
                      type="button"
                      className={styles.holdTick}
                      data-active={(parked && step === i) || undefined}
                      style={{ left: `${dur ? (h.at / dur) * 100 : 0}%` }}
                      title={
                        annotate
                          ? `Hold ${i + 1} · ${fmt(h.at)} — click to jump, Shift+click to delete`
                          : `Hold ${i + 1} · ${fmt(h.at)}`
                      }
                      onClick={(e) => {
                        if (annotate && e.shiftKey) {
                          e.preventDefault()
                          removeHold(i)
                          return
                        }
                        scrubTo(h.at)
                      }}
                    />
                  ))}
                </div>
              </div>

              <span className={styles.time}>
                {fmt(t)} / {fmt(dur)}
              </span>

              <button
                type="button"
                className={styles.transportBtn}
                data-on={annotate || undefined}
                onClick={() => setAnnotate((v) => !v)}
                title="Annotate callouts (A)"
              >
                Annotate
              </button>

              {annotate && (
                <>
                  <label className={styles.kindPick}>
                    <span>Mark</span>
                    <select
                      value={kindDraft}
                      onChange={(e) => setKindDraft(e.target.value as VideoMarkKind)}
                    >
                      <option value="mineral">Mineral</option>
                      <option value="biomass">Biomass</option>
                      <option value="onion">Onion</option>
                    </select>
                  </label>
                  <button type="button" className={styles.transportBtn} onClick={addHoldHere}>
                    Hold here
                  </button>
                  <button
                    type="button"
                    className={styles.transportBtn}
                    disabled={!parked && stops.every((h) => Math.abs(h.at - t) > NEAR)}
                    onClick={() => removeHold()}
                    title="Delete current pause (Delete / Backspace, or Shift+click a tick)"
                  >
                    Remove hold
                  </button>
                  <button
                    type="button"
                    className={styles.transportBtn}
                    onClick={() => void copyJson()}
                  >
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </>
              )}
            </div>

            {annotate && (
              <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <p className={styles.panelHint}>
                  Click the CT frame to place a circle. Scrub, then <strong>Hold here</strong> for a
                  pause. Delete a pause with <strong>Remove hold</strong>, <strong>Delete</strong>,
                  or <strong>Shift+click</strong> an orange tick. Then <strong>Copy JSON</strong>{' '}
                  into the <code>holds</code> array in <code>slides.ts</code> (stones → ct layer) to
                  keep it.
                </p>
                {selected ? (
                  <div className={styles.form}>
                    <label>
                      Title
                      <input
                        value={selected.title}
                        onChange={(e) => patchMark(selected.id, { title: e.target.value })}
                      />
                    </label>
                    <label>
                      Body
                      <input
                        value={selected.body ?? ''}
                        onChange={(e) => patchMark(selected.id, { body: e.target.value })}
                      />
                    </label>
                    <div className={styles.formRow}>
                      <label>
                        Kind
                        <select
                          value={selected.kind}
                          onChange={(e) =>
                            patchMark(selected.id, { kind: e.target.value as VideoMarkKind })
                          }
                        >
                          <option value="mineral">Mineral</option>
                          <option value="biomass">Biomass</option>
                          <option value="onion">Onion</option>
                        </select>
                      </label>
                      <label>
                        Side
                        <select
                          value={selected.side ?? 'right'}
                          onChange={(e) =>
                            patchMark(selected.id, {
                              side: e.target.value as 'left' | 'right',
                            })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                    <button
                      type="button"
                      className={styles.transportBtn}
                      onClick={() => deleteMark(selected.id)}
                    >
                      Delete mark
                    </button>
                  </div>
                ) : (
                  <p className={styles.panelEmpty}>No mark selected.</p>
                )}
              </div>
            )}
          </>,
          document.body,
        )}
    </div>
  )
}
