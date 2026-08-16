import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './Motifs.module.css'

export type PrepMode = {
  id: string
  title: string
  body: string
  src: string
  alt: string
  objectPosition?: string
  ghost?: boolean
}

export function PrepModes({
  active,
  modes,
}: {
  active: boolean
  modes: PrepMode[]
}) {
  const reduced = usePrefersReducedMotion()
  const [focus, setFocus] = useState(0)
  const current = modes[focus]

  useEffect(() => {
    if (!active) {
      setFocus(0)
      return
    }
    if (reduced) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ']' || e.key === '.') {
        e.preventDefault()
        e.stopPropagation()
        setFocus((f) => (f + 1) % modes.length)
      } else if (e.key === '[' || e.key === ',') {
        e.preventDefault()
        e.stopPropagation()
        setFocus((f) => (f - 1 + modes.length) % modes.length)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, reduced, modes.length])

  return (
    <div className={styles.prep} aria-label="Spectrum of preparation modes">
      <div className={styles.prepStrip}>
        {modes.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={styles.prepCell}
            data-focus={i === focus || undefined}
            onClick={() => setFocus(i)}
            aria-pressed={i === focus}
          >
            <img
              src={m.src}
              alt={m.alt}
              style={m.objectPosition ? { objectPosition: m.objectPosition } : undefined}
            />
            <span>{m.title}</span>
          </button>
        ))}
      </div>
      <div className={styles.prepStage}>
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              className={styles.prepFeature}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <img src={current.src} alt={current.alt} />
              {current.ghost && <div className={styles.prepGhost} aria-hidden />}
              <div className={styles.prepCaption}>
                <h3>{current.title}</h3>
                <p>{current.body}</p>
                <span className={styles.prepHint}>[ ] or , . to pull focus</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
