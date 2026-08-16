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
  extra?: {
    src: string
    alt: string
    body: string
  }
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
      <div className={styles.prepGrid}>
        {modes.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={styles.prepCell}
            data-focus={i === focus || undefined}
            onClick={() => setFocus(i)}
            aria-pressed={i === focus}
          >
            <div className={m.extra ? styles.prepCellPair : undefined}>
              <motion.img
                src={m.src}
                alt={m.alt}
                animate={{
                  filter:
                    i === focus || !active
                      ? 'blur(0px) brightness(1)'
                      : 'blur(3px) brightness(0.92)',
                  scale: i === focus && active && !m.extra ? 1.02 : 1,
                }}
                transition={{ duration: reduced ? 0 : 0.45 }}
              />
              {m.extra && (
                <motion.img
                  src={m.extra.src}
                  alt={m.extra.alt}
                  animate={{
                    filter:
                      i === focus || !active
                        ? 'blur(0px) brightness(1)'
                        : 'blur(3px) brightness(0.92)',
                  }}
                  transition={{ duration: reduced ? 0 : 0.45 }}
                />
              )}
            </div>
            <span>{m.title}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={modes[focus]?.id}
          className={styles.prepCaption}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
        >
          <h3>{modes[focus]?.title}</h3>
          <p>{modes[focus]?.body}</p>
          {modes[focus]?.extra && <p>{modes[focus].extra.body}</p>}
          <span className={styles.prepHint}>[ ] or , . to pull focus</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
