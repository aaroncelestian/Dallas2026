import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './ImpactHit.module.css'

export function ImpactHit({
  src,
  alt,
  active,
}: {
  src: string
  alt: string
  active: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState<'black' | 'lines' | 'hit'>('black')

  useEffect(() => {
    if (!active) {
      setPhase('black')
      return
    }
    if (reduced) {
      setPhase('hit')
      return
    }
    setPhase('black')
    const lines = window.setTimeout(() => setPhase('lines'), 50)
    const hit = window.setTimeout(() => setPhase('hit'), 420)
    return () => {
      window.clearTimeout(lines)
      window.clearTimeout(hit)
    }
  }, [active, reduced])

  return (
    <div className={styles.root} data-phase={phase}>
      <div className={styles.frame}>
        <motion.img
          src={src}
          alt=""
          aria-hidden
          className={styles.lines}
          initial={false}
          animate={
            reduced
              ? { scale: 1, opacity: 0 }
              : phase === 'black'
                ? { scale: 3.35, opacity: 0 }
                : phase === 'lines'
                  ? { scale: 3.2, opacity: 1 }
                  : { scale: 1, opacity: 0 }
          }
          transition={
            phase === 'hit'
              ? { duration: 1.55, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.1, ease: 'linear' }
          }
        />
        <motion.img
          src={src}
          alt={alt}
          className={styles.photo}
          initial={false}
          animate={
            reduced
              ? { scale: 1, opacity: 1 }
              : phase === 'hit'
                ? { scale: 1, opacity: 1 }
                : { scale: 3.35, opacity: phase === 'black' ? 0 : 0.12 }
          }
          transition={
            phase === 'hit'
              ? { duration: 1.7, ease: [0.19, 1, 0.22, 1] }
              : { duration: 0.08 }
          }
        />
      </div>
      <div className={styles.flash} data-on={phase === 'hit' || undefined} aria-hidden />
    </div>
  )
}
