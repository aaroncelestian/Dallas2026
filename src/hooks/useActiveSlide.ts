import { useEffect, useRef, useState, useCallback } from 'react'

export function useActiveSlide(count: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const pendingIndexRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)

  const setIndex = useCallback((index: number) => {
    activeIndexRef.current = index
    setActiveIndex(index)
  }, [])

  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const root = containerRef.current
      if (!root) return
      const clamped = Math.max(0, Math.min(count - 1, index))
      const el = root.querySelector<HTMLElement>(`[data-slide-index="${clamped}"]`)
      if (!el) return

      pendingIndexRef.current = clamped
      setIndex(clamped)

      const scroll = () => {
        root.scrollTo({ top: el.offsetTop, behavior })
      }
      if (behavior === 'auto') {
        requestAnimationFrame(() => requestAnimationFrame(scroll))
      } else {
        scroll()
      }

      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = window.setTimeout(
        () => {
          pendingIndexRef.current = null
          settleTimerRef.current = null
        },
        behavior === 'auto' ? 80 : 450,
      )
    },
    [count, setIndex],
  )

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const sections = root.querySelectorAll<HTMLElement>('[data-slide-index]')
    const observer = new IntersectionObserver(
      (entries) => {
        if (pendingIndexRef.current !== null) return

        let best: { index: number; ratio: number } | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number(entry.target.getAttribute('data-slide-index'))
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio }
          }
        }
        if (best && best.index !== activeIndexRef.current) {
          setIndex(best.index)
        }
      },
      { root, threshold: [0.5, 0.75, 0.9] },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [count, setIndex])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const onScrollEnd = () => {
      pendingIndexRef.current = null
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current)
        settleTimerRef.current = null
      }
    }

    root.addEventListener('scrollend', onScrollEnd)
    return () => root.removeEventListener('scrollend', onScrollEnd)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const editable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        (e.target as HTMLElement)?.isContentEditable
      if (editable) return

      const current = pendingIndexRef.current ?? activeIndexRef.current

      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        goTo(current + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        goTo(current - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goTo(count - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, goTo])

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
    }
  }, [])

  return { containerRef, activeIndex, goTo }
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}
