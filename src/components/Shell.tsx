import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slides, CHAPTERS, type CameraKind, type ChapterId, type Slide } from '../data/slides'
import { useActiveSlide, usePrefersReducedMotion } from '../hooks/useActiveSlide'
import { useViewportHeight } from '../hooks/useViewportHeight'
import { NavContext } from '../hooks/useSlideNav'
import { exitPresent, fillAvailableScreen, isPresentMode, openPresentWindow, openPrintView } from '../lib/asset'
import { DepthField, type PlateMode } from './layouts/DepthField'
import { SlideView } from './layouts/SlideView'
import styles from './Shell.module.css'

function holdsCopy(slide?: Slide) {
  return Boolean(slide && !slide.enterHit && (slide.enterDelay ?? 0) > 0)
}

function chapterLabel(id: ChapterId) {
  if (id === 'open') return 'Open'
  const ch = CHAPTERS.find((c) => c.id === id)
  return ch ? `${ch.num} ${ch.title}` : id
}

function plateState(slide: Slide, last: Slide['image']) {
  const hide =
    slide.motif === 'color-reveal' ||
    slide.motif === 'prep-modes' ||
    slide.clearPlate ||
    slide.layout === 'impact' ||
    slide.layout === 'void' ||
    slide.layout === 'monument' ||
    slide.enterHit
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
  const interceptRef = useRef<((from: number, to: number) => boolean) | null>(null)
  const { containerRef, activeIndex, goTo } = useActiveSlide(slides.length, interceptRef)
  const slide = slides[activeIndex]
  const activeChapter = slide?.chapter
  const [fullscreen, setFullscreen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const activePickRef = useRef<HTMLButtonElement>(null)
  const lastImage = useRef<Slide['image']>(slide?.image)
  const heldCamera = useRef<CameraKind | undefined>(slide?.camera)
  const reduced = usePrefersReducedMotion()

  if (
    slide?.image &&
    slide.layout !== 'impact' &&
    slide.motif !== 'color-reveal' &&
    slide.motif !== 'prep-modes'
  ) {
    if (lastImage.current?.src !== slide.image.src) {
      heldCamera.current = slide.camera
    }
    lastImage.current = slide.image
  }
  if (slide?.clearPlate) {
    lastImage.current = undefined
    heldCamera.current = undefined
  }

  const plate = plateState(slide, lastImage.current)
  const [gateId, setGateId] = useState(slide.id)
  const [copyOn, setCopyOn] = useState(() => !holdsCopy(slide))
  const [blackout, setBlackout] = useState(() => Boolean(slide.enterBlack))
  const [blackoutCut, setBlackoutCut] = useState(false)
  const leavingRef = useRef(false)

  if (slide.id !== gateId) {
    setGateId(slide.id)
    if (slide.enterHit) {
      setCopyOn(true)
      setBlackoutCut(true)
      setBlackout(false)
    } else if (holdsCopy(slide)) {
      setCopyOn(false)
      setBlackout(Boolean(slide.enterBlack))
      setBlackoutCut(false)
    } else {
      setCopyOn(true)
      setBlackoutCut(false)
    }
  }

  useEffect(() => {
    const href = slides.find((s) => s.id === 'cabinet-hit')?.image?.src
    if (!href) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = href
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    if (reduced) {
      setCopyOn(true)
      setBlackout(false)
      setBlackoutCut(false)
      return
    }
    if (slide?.enterHit) {
      setBlackoutCut(true)
      setBlackout(false)
      const clear = window.setTimeout(() => setBlackoutCut(false), 80)
      return () => window.clearTimeout(clear)
    }
    if (!holdsCopy(slide)) {
      setCopyOn(true)
      if (slide?.enterBlack) {
        setBlackoutCut(true)
        let cancelled = false
        let cutTimer = 0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return
            setBlackout(false)
            cutTimer = window.setTimeout(() => {
              if (!cancelled) setBlackoutCut(false)
            }, 80)
          })
        })
        return () => {
          cancelled = true
          window.clearTimeout(cutTimer)
        }
      }
      return
    }
    if (slide.enterBlack) setBlackout(true)
    const timer = window.setTimeout(() => {
      setBlackout(false)
      setCopyOn(true)
    }, (slide.enterDelay ?? 0) * 1000)
    return () => window.clearTimeout(timer)
  }, [slide?.id, slide?.enterDelay, slide?.enterBlack, slide?.enterHit, reduced])

  useEffect(() => {
    interceptRef.current = (from, to) => {
      if (leavingRef.current) return true
      if (to <= from) return false
      const current = slides[from]
      if (!current?.exitHold || reduced) return false
      leavingRef.current = true
      setCopyOn(false)
      setBlackoutCut(true)
      setBlackout(true)
      window.setTimeout(() => {
        leavingRef.current = false
        const next = slides[to]
        if (!next?.enterBlack && !next?.enterHit) {
          setBlackoutCut(true)
          setBlackout(false)
        }
        goTo(to, 'auto', true)
      }, current.exitHold * 1000)
      return true
    }
  }, [goTo, reduced])

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
        if (pickerOpen) {
          setPickerOpen(false)
          return
        }
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
  }, [presenting, pickerOpen, toggleFullscreen])

  useEffect(() => {
    setPickerOpen(false)
  }, [activeIndex])

  useEffect(() => {
    if (!pickerOpen) return
    activePickRef.current?.scrollIntoView({ block: 'nearest' })
    const onPointer = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [pickerOpen])

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

  const hard = reduced || Boolean(slide?.enterHit || slide?.enterBlack || slide?.copySnap)
  const cut = {
    initial: hard ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reduced ? { opacity: 1 } : { opacity: 0 },
    transition: { duration: hard ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] as const },
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
            camera={heldCamera.current ?? slide.camera ?? 'drift'}
            mode={plate.mode}
          />
        )}

        <div className={styles.buildId} aria-hidden>
          {__BUILD_ID__}
        </div>

        <AnimatePresence mode={hard ? 'wait' : 'sync'}>
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
              <SlideView
                slide={slide}
                active
                plated={plate.mode !== 'hidden'}
                copyActive={copyOn}
              />
            </div>
          </motion.section>
        </AnimatePresence>
        <div
          className={styles.blackout}
          data-on={blackout || undefined}
          data-cut={blackoutCut || undefined}
          aria-hidden
        />
      </div>

      {!presenting && (
      <>
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

      <div className={styles.chrome} data-open={pickerOpen || undefined}>
        <div className={styles.pickerWrap} ref={pickerRef}>
          {pickerOpen && (
            <div className={styles.picker} role="listbox" aria-label="Slides">
              {slides.map((s, i) => {
                const showChapter = i === 0 || s.chapter !== slides[i - 1].chapter
                return (
                  <div key={s.id}>
                    {showChapter && (
                      <div className={styles.pickerChapter}>{chapterLabel(s.chapter)}</div>
                    )}
                    <button
                      type="button"
                      role="option"
                      ref={i === activeIndex ? activePickRef : undefined}
                      className={styles.pickerItem}
                      data-active={i === activeIndex}
                      aria-selected={i === activeIndex}
                      onClick={() => {
                        goTo(i)
                        setPickerOpen(false)
                      }}
                    >
                      <span className={styles.pickerNum}>{i + 1}</span>
                      {s.label}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <button
            type="button"
            className={styles.counter}
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            aria-label={`Slide ${activeIndex + 1} of ${slides.length}. Open slide list`}
            title="Jump to a slide"
            onClick={() => setPickerOpen((open) => !open)}
          >
            {activeIndex + 1} / {slides.length}
          </button>
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
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={() => openPrintView()}
          aria-label="Open speaker script"
          title="Print script — copy for AI or save as PDF"
        >
          Print
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
