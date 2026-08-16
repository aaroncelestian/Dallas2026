import { useEffect, useState } from 'react'
import { exitPrint } from '../lib/asset'
import {
  SCRIPT_META,
  SCRIPT_TITLE,
  chapterTitle,
  scriptBeats,
  scriptMarkdown,
} from '../lib/script'
import styles from './PrintView.module.css'

export function PrintView() {
  const beats = scriptBeats()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        exitPrint()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptMarkdown())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={styles.page} data-print-root>
      <header className={styles.toolbar}>
        <button type="button" className={styles.toolBtn} onClick={() => exitPrint()}>
          Back
        </button>
        <div className={styles.toolActions}>
          <button type="button" className={styles.toolBtn} onClick={() => void copyScript()}>
            {copied ? 'Copied' : 'Copy for AI'}
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </header>

      <article className={styles.doc}>
        <header className={styles.masthead}>
          <p className={styles.brand}>NHMLAC</p>
          <h1>{SCRIPT_TITLE}</h1>
          <p className={styles.meta}>{SCRIPT_META}</p>
          <p className={styles.lede}>
            Speaker script. Each beat lists what is on the projection, then what
            to say. Paste this into an AI, or print / save as PDF.
          </p>
        </header>

        {beats.map((beat, i) => {
          const showChapter = i === 0 || beat.chapter !== beats[i - 1].chapter
          return (
            <section
              key={`${beat.slide.id}-${beat.sceneLabel ?? 'slide'}-${beat.index}`}
              className={styles.beat}
            >
              {showChapter && (
                <h2 className={styles.chapter}>{chapterTitle(beat.chapter)}</h2>
              )}
              <h3>
                <span className={styles.num}>{beat.index + 1}</span>
                {beat.sceneLabel
                  ? `${beat.slide.label} · ${beat.sceneLabel}`
                  : beat.slide.label}
              </h3>
              <div className={styles.grid}>
                <div>
                  <h4>On screen</h4>
                  {(() => {
                    const layer = beat.slide.layers?.find(
                      (item) =>
                        (item.kind === 'image' || item.kind === 'video') &&
                        (item.poster || item.src) &&
                        (!beat.sceneLabel ||
                          beat.slide.scene
                            ?.find((s) => s.label === beat.sceneLabel)
                            ?.layers?.includes(item.id)),
                    )
                    const src =
                      (layer?.kind === 'video' ? layer.poster : layer?.src) ??
                      beat.slide.image?.src
                    const alt = layer?.alt ?? beat.slide.image?.alt
                    if (!src) return null
                    return (
                      <figure className={styles.figure}>
                        <img src={src} alt={alt} />
                      </figure>
                    )
                  })()}
                  <ul>
                    {beat.onScreen.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                {beat.notes && (
                  <div>
                    <h4>Say</h4>
                    <p>{beat.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </article>
    </div>
  )
}
