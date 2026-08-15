import { useEffect, useRef, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { isPresentMode } from '../../lib/asset'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './DepthField.module.css'

export type DepthFieldProps = {
  src: string
  alt: string
  active: boolean
  fit?: 'cover' | 'contain'
  /** Sign of enter yaw; alternates per beat for variety. */
  yaw?: 1 | -1
  className?: string
  children?: React.ReactNode
}

export function DepthField({
  src,
  alt,
  active,
  fit = 'cover',
  yaw = 1,
  className,
  children,
}: DepthFieldProps) {
  const reduced = usePrefersReducedMotion()
  const present = isPresentMode()
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  const px = useSpring(0, { stiffness: 40, damping: 22, mass: 0.6 })
  const py = useSpring(0, { stiffness: 40, damping: 22, mass: 0.6 })

  useEffect(() => {
    if (!active) {
      setReady(false)
      return
    }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [active])

  useEffect(() => {
    if (!active || reduced || present) {
      px.set(0)
      py.set(0)
      return
    }

    const el = rootRef.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      px.set(nx * 8)
      py.set(ny * 5)
    }

    const onLeave = () => {
      px.set(0)
      py.set(0)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [active, reduced, present, px, py])

  const enterRotateY = reduced ? 0 : yaw * 2.6
  const enterRotateX = reduced ? 0 : -1.4
  const enterScale = reduced ? 1 : 1.045

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      data-fit={fit}
      data-active={active || undefined}
    >
      <div className={styles.perspective}>
        <motion.div
          className={styles.stage}
          style={{
            x: present || reduced ? 0 : px,
            y: present || reduced ? 0 : py,
          }}
          initial={false}
          animate={
            ready
              ? { rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }
              : {
                  rotateY: enterRotateY,
                  rotateX: enterRotateX,
                  scale: enterScale,
                  opacity: reduced ? 1 : 0.92,
                }
          }
          transition={{ duration: reduced ? 0 : 0.85, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className={styles.backPlate} aria-hidden>
            <img src={src} alt="" />
          </div>
          <div className={styles.midGlow} aria-hidden />
          <div className={styles.fore}>
            <img src={src} alt={alt} />
          </div>
          <div className={styles.vignette} aria-hidden />
        </motion.div>
      </div>
      {children}
    </div>
  )
}
