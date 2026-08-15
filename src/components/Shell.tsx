import { useCallback, useEffect, useRef, useState } from 'react'
import { slides, CHAPTERS } from '../data/slides'
import { useActiveSlide } from '../hooks/useActiveSlide'
import { useViewportHeight } from '../hooks/useViewportHeight'
import { NavContext } from '../hooks/useSlideNav'
import { isPresentMode } from '../lib/asset'
import { SlideView } from './layouts/SlideView'
import styles from './Shell.module.css'

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
  const activeChapter = slides[activeIndex]?.chapter
  const [fullscreen, setFullscreen] = useState(false)

  useViewportHeight()

  useEffect(() => {
    if (isPresentMode()) {
      document.documentElement.setAttribute('data-present', '')
    }
    return () => document.documentElement.removeAttribute('data-present')
  }, [])

  useEffect(() => {
    let timer = 0
    const show = () => {
      document.documentElement.style.cursor = ''
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (getFullscreenElement() || isPresentMode()) {
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
  }, [])

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
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      const editable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable
      if (editable) return
      e.preventDefault()
      void toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFullscreen])

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

  return (
    <NavContext.Provider value={goTo}>
      <div ref={containerRef} className={styles.shell} id="deck">
        {slides.map((slide, i) => (
          <section
            key={slide.id}
            className={`${styles.slide} ${slide.layout}`}
            data-slide-index={i}
            data-slide-id={slide.id}
            aria-label={slide.label}
          >
            <div className={styles.slideInner}>
              <SlideView slide={slide} active={i === activeIndex} />
            </div>
          </section>
        ))}
      </div>

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
          onClick={() => void toggleFullscreen()}
          aria-pressed={fullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
        >
          {fullscreen ? 'Exit full screen' : 'Full screen'}
        </button>
      </div>
    </NavContext.Provider>
  )
}
