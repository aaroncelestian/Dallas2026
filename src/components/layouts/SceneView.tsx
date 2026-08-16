import { AnimatePresence, motion } from 'framer-motion'
import type { SceneLayer, Slide } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { useScene } from '../../hooks/useSceneBeats'
import { CrystalViewer } from '../motifs/CrystalViewer'
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

function LayerView({ layer, active }: { layer: SceneLayer; active: boolean }) {
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
        <VoidViewer active={active} />
      </div>
    )
  }

  if (layer.kind === 'video' && layer.src) {
    return (
      <video
        className={styles.sceneVideo}
        src={layer.src}
        autoPlay
        muted
        loop
        playsInline
        aria-label={layer.alt}
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
        camera="hold"
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

  return (
    <div className={styles.scene} data-empty={!hasPlate || undefined}>
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
              <LayerView layer={layer} active={active} />
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
