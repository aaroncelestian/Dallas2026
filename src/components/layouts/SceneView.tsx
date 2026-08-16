import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { SceneLayer, SceneSlide, Slide } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { useScene } from '../../hooks/useSceneBeats'
import { CrystalViewer } from '../motifs/CrystalViewer'
import { LithiumCycle } from '../motifs/LithiumCycle'
import { VoidViewer } from '../motifs/VoidViewer'
import { DepthField } from './DepthField'
import styles from './Layouts.module.css'

function TitleLines({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={`${i}-${line}`}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </>
  )
}

function SceneVideo({
  src,
  poster,
  alt,
  active,
  fit = 'contain',
}: {
  src: string
  poster?: string
  alt?: string
  active: boolean
  fit?: 'cover' | 'contain'
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced || !active) {
      el.pause()
      return
    }
    el.currentTime = 0
    void el.play()
  }, [active, reduced, src])

  return (
    <video
      ref={ref}
      className={styles.sceneVideo}
      data-fit={fit}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="auto"
      aria-label={alt}
    />
  )
}

function SceneSlideshow({
  slides,
  active,
  fit = 'contain',
  dwellMs = [14000, 9000],
}: {
  slides: SceneSlide[]
  active: boolean
  fit?: 'cover' | 'contain'
  dwellMs?: [number, number]
}) {
  const [index, setIndex] = useState(0)
  const reduced = usePrefersReducedMotion()
  const plate = slides[index] ?? slides[0]

  useEffect(() => {
    if (!active) setIndex(0)
  }, [active])

  useEffect(() => {
    if (!active || reduced || slides.length < 2) return
    const wait = index === 0 ? dwellMs[0] : dwellMs[1]
    const id = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, wait)
    return () => window.clearTimeout(id)
  }, [active, dwellMs, index, reduced, slides.length])

  if (!plate) return null

  return (
    <div
      className={styles.sceneShow}
      onClick={() => {
        if (slides.length < 2) return
        setIndex((current) => (current + 1) % slides.length)
      }}
    >
      <AnimatePresence>
        <motion.div
          key={plate.src}
          className={styles.sceneShowPlate}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <DepthField
            src={plate.src}
            alt={plate.alt}
            active={active}
            fit={fit}
            yaw={1}
            camera="hold"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function LayerView({
  layer,
  active,
  showGuests,
}: {
  layer: SceneLayer
  active: boolean
  showGuests?: boolean
}) {
  if (layer.kind === 'motif' && layer.motif === 'crystal-viewer') {
    return (
      <div className={styles.sceneMotif}>
        <CrystalViewer active={active} />
      </div>
    )
  }

  if (layer.kind === 'motif' && layer.motif === 'void-viewer') {
    return (
      <div className={styles.sceneMotif}>
        <VoidViewer active={active} guests={showGuests} />
      </div>
    )
  }

  if (layer.kind === 'motif' && layer.motif === 'lithium-cycle') {
    return (
      <div className={styles.sceneMotif}>
        <LithiumCycle active={active} />
      </div>
    )
  }

  if (layer.kind === 'slideshow' && layer.slides?.length) {
    return (
      <SceneSlideshow
        slides={layer.slides}
        active={active}
        fit={layer.fit}
        dwellMs={layer.dwellMs}
      />
    )
  }

  if (layer.kind === 'video' && layer.src) {
    return (
      <SceneVideo
        src={layer.src}
        poster={layer.poster}
        alt={layer.alt}
        active={active}
        fit={layer.fit}
      />
    )
  }

  if (layer.src) {
    return (
      <DepthField
        src={layer.src}
        alt={layer.alt ?? ''}
        active={active}
        fit={layer.fit ?? 'contain'}
        yaw={1}
        camera={layer.camera ?? 'hold'}
      />
    )
  }

  return null
}

export function SceneView({ slide, active }: { slide: Slide; active: boolean }) {
  const scene = useScene()
  const reduced = usePrefersReducedMotion()
  const beat = scene.beat
  const visible = new Set(beat?.layers ?? [])
  const layers = (slide.layers ?? []).filter((layer) => visible.has(layer.id))
  const hasPlate = layers.length > 0
  const duration = reduced ? 0 : 0.7
  const camera = layers[0]?.camera

  return (
    <div
      className={styles.scene}
      data-empty={!hasPlate || undefined}
      data-camera={camera}
    >
      <div className={styles.sceneStage}>
        <AnimatePresence>
          {layers.map((layer) => (
            <motion.div
              key={layer.id}
              className={styles.sceneLayer}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            >
              <LayerView layer={layer} active={active} showGuests={beat?.guests} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {hasPlate && <div className={styles.stageScrim} aria-hidden />}
      <AnimatePresence mode="wait">
        {(beat?.kicker || beat?.title || beat?.subtitle) && (
          <motion.div
            key={beat?.id ?? 'copy'}
            className={hasPlate ? styles.stageCopy : styles.voidInner}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
          >
            {beat?.kicker && <div className="kicker">{beat.kicker}</div>}
            {beat?.title && (
              <h2 className={hasPlate ? undefined : styles.voidTitle}>
                <TitleLines text={beat.title} />
              </h2>
            )}
            {beat?.subtitle && <p className={`${styles.body} text-muted`}>{beat.subtitle}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
