import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slides, CHAPTERS, type Slide } from '../data/slides'
import { useActiveSlide, usePrefersReducedMotion } from '../hooks/useActiveSlide'
import { useViewportHeight } from '../hooks/useViewportHeight'
import { NavContext } from '../hooks/useSlideNav'
import { exitPresent, fillAvailableScreen, isPresentMode, openPresentWindow } from '../lib/asset'
import { DepthField, type PlateMode } from './layouts/DepthField'
import { SlideView } from './layouts/SlideView'
import styles from './Shell.module.css'

function plateState(slide: Slide, last: Slide['image']) {
  const hide = slide.motif === 'color-reveal' || slide.motif === 'prep-modes' || slide.clearPlate
  if (hide) return { image: last, mode: 'hidden' as const }
  if (slide.image) return { image: slide.image, mode: 'live' as PlateMode }
  if (last) return { image: last, mode: 'ghost' as PlateMode }
  return { image: undefined, mode: 'hidden' as const }
}

function getFullscreenElement() {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null
  }
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function enterFullscreen(el: HTMLElement) {
  const node = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
  }
  if (node.requestFullscreen) await node.requestFullscreen()
  else if (node.webkitRequestFullscreen) await node.webkitRequestFullscreen()
}

async function exitFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void
  }
  if (document.exitFullscreen) await document.exitFullscreen()
  else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
}

export function Shell() {
  const { containerRef, activeIndex, goTo } = useActiveSlide(slides.length)
  const slide = slides[activeIndex]
  const activeChapter = slide?.chapter
  const [fullscreen, setFullscreen] = useState(false)
  const lastImage = useRef<Slide['image']>(slide?.image)
  const reduced = usePrefersReducedMotion()

  if (slide?.image && slide.motif !== 'color-reveal' && slide.motif !== 'prep-modes') {
    lastImage.current = slide.image
  }
  if (slide?.clearPlate) lastImage.current = undefined

  const plate = plateState(slide, lastImage.current)

  useViewportHeight()

  const presenting = isPresentMode()

  useEffect(() => {
    if (!presenting) return
    document.documentElement.setAttribute('data-present', '')
    fillAvailableScreen()
    return () => document.documentElement.removeAttribute('data-present')
  }, [presenting])

  useEffect(() => {
    let timer = 0
    const show = () => {
      document.documentElement.style.cursor = ''
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (getFullscreenElement() || presenting) {
          document.documentElement.style.cursor = 'none'
        }
      }, 2200)
    }
    window.addEventListener('pointermove', show)
    return () => {
      window.removeEventListener('pointermove', show)
      window.clearTimeout(timer)
      document.documentElement.style.cursor = ''
    }
  }, [presenting])

  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex
  const goToRef = useRef(goTo)
  goToRef.current = goTo

  const chapterStarts = CHAPTERS.map((ch) => ({
    ...ch,
    index: slides.findIndex((s) => s.chapter === ch.id && s.layout === 'divider'),
  }))

  useEffect(() => {
    const sync = () => {
      const active = Boolean(getFullscreenElement())
      setFullscreen(active)
      document.documentElement.toggleAttribute('data-fullscreen', active)
      window.dispatchEvent(new Event('resize'))
      requestAnimationFrame(() => {
        goToRef.current(activeIndexRef.current, 'auto')
      })
    }
    setFullscreen(Boolean(getFullscreenElement()))
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
      document.documentElement.removeAttribute('data-fullscreen')
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (getFullscreenElement()) {
        await exitFullscreen()
        return
      }
      await enterFullscreen(document.documentElement)
    } catch {
      // User gesture / browser policy can reject — leave UI unchanged.
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      const editable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable
      if (editable) return

      if (e.key === 'Escape') {
        e.preventDefault()
        if (presenting) exitPresent()
        return
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        if (presenting) exitPresent()
        else openPresentWindow()
        return
      }

      if (e.key !== 'f' && e.key !== 'F') return
      e.preventDefault()
      // Native fullscreen breaks Zoom window-share. Shift+F only, if you
      // are projecting the laptop itself and not sharing a window.
      if (e.shiftKey) void toggleFullscreen()
      else if (!presenting) openPresentWindow()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, toggleFullscreen])

  useEffect(() => {
    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        goToRef.current(activeIndexRef.current, 'auto')
      }, 80)
    }
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [])

  const cut = {
    initial: reduced ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reduced ? { opacity: 1 } : { opacity: 0 },
    transition: { duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] },
  }

  return (
    <NavContext.Provider value={goTo}>
      <div ref={containerRef} className={styles.shell} id="deck">
        {plate.image && plate.mode !== 'hidden' && (
          <DepthField
            key={plate.image.src}
            src={plate.image.src}
            alt={plate.image.alt}
            active
            fit={plate.image.fit ?? 'contain'}
            yaw={slide.yaw ?? 1}
            camera={slide.camera ?? 'drift'}
            mode={plate.mode}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.section
            key={slide.id}
            className={`${styles.slide} ${slide.layout}`}
            data-slide-index={activeIndex}
            data-slide-id={slide.id}
            aria-label={slide.label}
            initial={cut.initial}
            animate={cut.animate}
            exit={cut.exit}
            transition={cut.transition}
          >
            <div className={styles.slideInner}>
              <SlideView slide={slide} active plated={plate.mode !== 'hidden'} />
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      {!presenting && (
      <>
      <nav className={styles.nav} aria-label="Slide progress">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={styles.dot}
            data-active={i === activeIndex}
            aria-label={`Go to ${s.label}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </nav>

      <nav className={styles.toc} aria-label="Chapters">
        {chapterStarts.map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={styles.tocBtn}
            data-active={activeChapter === ch.id}
            onClick={() => goTo(Math.max(0, ch.index))}
          >
            {ch.num} {ch.title}
          </button>
        ))}
      </nav>

      <div className={styles.chrome}>
        <div className={styles.counter} aria-live="polite">
          {activeIndex + 1} / {slides.length}
        </div>
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={() => openPresentWindow()}
          aria-label="Open stage window"
          title="Stage window for Zoom (P)"
        >
          Stage
        </button>
        {fullscreen && (
          <button
            type="button"
            className={styles.fullscreenBtn}
            onClick={() => void toggleFullscreen()}
            aria-pressed
            aria-label="Exit fullscreen"
            title="Exit fullscreen (Shift+F)"
          >
            Exit full screen
          </button>
        )}
      </div>
      </>
      )}
    </NavContext.Provider>
  )
}
