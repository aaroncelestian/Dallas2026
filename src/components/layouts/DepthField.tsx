import { useEffect, useRef, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { isPresentMode } from '../../lib/asset'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import type { CameraKind } from '../../data/slides'
import styles from './DepthField.module.css'

export type PlateMode = 'live' | 'ghost'

export type DepthFieldProps = {
  src: string
  alt: string
  active: boolean
  fit?: 'cover' | 'contain'
  yaw?: 1 | -1
  camera?: CameraKind
  mode?: PlateMode
  className?: string
  children?: React.ReactNode
}

export function DepthField({
  src,
  alt,
  active,
  fit = 'cover',
  yaw = 1,
  camera = 'push',
  mode = 'live',
  className,
  children,
}: DepthFieldProps) {
  const reduced = usePrefersReducedMotion()
  const present = isPresentMode()
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  const px = useSpring(0, { stiffness: 28, damping: 24, mass: 0.8 })
  const py = useSpring(0, { stiffness: 28, damping: 24, mass: 0.8 })

  useEffect(() => {
    if (!active) {
      setReady(false)
      return
    }
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [active, src])

  useEffect(() => {
    if (!active || reduced || present || mode === 'ghost') {
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
      px.set(nx * 10)
      py.set(ny * 6)
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
  }, [active, reduced, present, mode, px, py])

  const enterRotateY = reduced ? 0 : yaw * 7
  const enterRotateX = reduced ? 0 : -2.4
  const enterScale = reduced ? 1 : 1.1

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      data-fit={fit}
      data-active={active || undefined}
      data-ready={ready || undefined}
      data-camera={reduced ? 'hold' : camera}
      data-mode={mode}
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
                  opacity: reduced ? 1 : 0.88,
                }
          }
          transition={{ duration: reduced ? 0 : 1.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.backPlate} aria-hidden>
            <img src={src} alt="" />
          </div>
          <div className={styles.midGlow} aria-hidden />
          <div className={styles.fore}>
            <img src={src} alt={alt} />
          </div>
          <div className={styles.sheen} aria-hidden />
          <div className={styles.vignette} aria-hidden />
        </motion.div>
      </div>
      {children}
    </div>
  )
}
