import { motion } from 'framer-motion'
import type { Slide, MotifKind } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { DepthField } from './DepthField'
import { IonChart } from '../motifs/IonChart'
import { CriteriaOverlap } from '../motifs/CriteriaOverlap'
import { PrepModes } from '../motifs/PrepModes'
import { ColorReveal } from '../motifs/ColorReveal'
import { PREP_MODES } from '../../data/prepModes'
import styles from './Layouts.module.css'

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

function Rise({
  active,
  children,
  delay = 0,
  className,
}: {
  active: boolean
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={false}
      animate={active ? 'show' : 'hidden'}
      variants={rise}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function Kicker({ text }: { text?: string }) {
  if (!text) return null
  return <div className="kicker">{text}</div>
}

function TitleLines({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={`${i}-${line}`}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </>
  )
}

function Motif({ kind, active, slide }: { kind: MotifKind; active: boolean; slide: Slide }) {
  switch (kind) {
    case 'ion-chart':
      return <IonChart active={active} />
    case 'criteria-overlap':
      return <CriteriaOverlap active={active} />
    case 'prep-modes':
      return <PrepModes active={active} modes={PREP_MODES} />
    case 'color-reveal':
      return (
        <ColorReveal
          active={active}
          src={slide.image?.src ?? ''}
          alt={slide.image?.alt ?? 'Blue Wave aragonite'}
        />
      )
    default:
      return null
  }
}

export function SlideView({ slide, active }: { slide: Slide; active: boolean }) {
  const yaw = (slide.yaw ?? 1) as 1 | -1

  if (slide.layout === 'cover') {
    return (
      <div className={styles.cover} data-active={active || undefined}>
        {slide.image && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
          />
        )}
        <div className={styles.coverScrim} aria-hidden />
        <Rise active={active} className={styles.coverContent}>
          {slide.brand && <div className={styles.brand}>{slide.brand}</div>}
          {slide.displayTitle && (
            <h1 className={styles.display}>
              <TitleLines text={slide.displayTitle} />
            </h1>
          )}
          {slide.subtitle && <p className={styles.sub}>{slide.subtitle}</p>}
        </Rise>
        {slide.meta && <div className={styles.meta}>{slide.meta}</div>}
      </div>
    )
  }

  if (slide.layout === 'divider') {
    return (
      <div className={styles.divider}>
        <Rise active={active}>
          <div className={styles.ghost}>{slide.ghostNum}</div>
        </Rise>
        <Rise active={active} delay={0.12}>
          <h2 className={styles.dividerTitle}>{slide.title}</h2>
        </Rise>
        {slide.body && (
          <Rise active={active} delay={0.2}>
            <p className={`${styles.body} text-muted`}>{slide.body}</p>
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'bleed') {
    return (
      <div className={styles.bleedWrap}>
        {slide.image && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
          />
        )}
        {slide.kicker && <div className={`${styles.bleedKicker} kicker`}>{slide.kicker}</div>}
        {(slide.title || slide.body) && (
          <Rise active={active} className={styles.bleedCopy}>
            {slide.title && (
              <h2>
                <TitleLines text={slide.title} />
              </h2>
            )}
            {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'stage') {
    const motifFull =
      slide.motif === 'color-reveal' || slide.motif === 'prep-modes'
    return (
      <div className={styles.stage} data-motif={slide.motif || undefined}>
        {slide.image && !motifFull && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
          />
        )}
        {!motifFull && <div className={styles.stageScrim} aria-hidden />}
        {slide.motif === 'color-reveal' ? (
          <Motif kind="color-reveal" active={active} slide={slide} />
        ) : slide.motif === 'prep-modes' ? (
          <div className={styles.stagePad}>
            <Rise active={active} className={styles.stageCopy}>
              <Kicker text={slide.kicker} />
              {slide.title && <h2>{slide.title}</h2>}
              {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
            </Rise>
            <Rise active={active} delay={0.1} className={styles.stageMotifWide}>
              <Motif kind="prep-modes" active={active} slide={slide} />
            </Rise>
          </div>
        ) : (
          <Rise active={active} className={styles.stageCopy}>
            <Kicker text={slide.kicker} />
            {slide.title && (
              <h2>
                <TitleLines text={slide.title} />
              </h2>
            )}
            {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
            {slide.motif && (
              <div className={styles.stageMotif}>
                <Motif kind={slide.motif} active={active} slide={slide} />
              </div>
            )}
            {slide.quote && <blockquote className={styles.quote}>{slide.quote}</blockquote>}
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'hero') {
    return (
      <div className={styles.hero}>
        <Rise active={active} className={styles.heroCopy}>
          <Kicker text={slide.kicker} />
          {slide.heroNum && <div className={styles.heroNum}>{slide.heroNum}</div>}
          {slide.title && (
            <h2>
              <TitleLines text={slide.title} />
            </h2>
          )}
          {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
        </Rise>
        {slide.motif && (
          <Rise active={active} delay={0.12} className={styles.heroMotif}>
            <Motif kind={slide.motif} active={active} slide={slide} />
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'split') {
    return (
      <div className={`${styles.split}${slide.splitFlip ? ` ${styles.splitFlip}` : ''}`}>
        <Rise active={active} className={styles.splitCopy}>
          <Kicker text={slide.kicker} />
          {slide.title && (
            <h2>
              <TitleLines text={slide.title} />
            </h2>
          )}
          {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
          {slide.bullets && (
            <ul className={styles.bullets}>
              {slide.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </Rise>
        <Rise active={active} delay={0.08} className={styles.splitMedia}>
          {slide.motif ? (
            <Motif kind={slide.motif} active={active} slide={slide} />
          ) : slide.image ? (
            <div className={styles.splitDepth}>
              <DepthField
                src={slide.image.src}
                alt={slide.image.alt}
                active={active}
                fit={slide.image.fit ?? 'cover'}
                yaw={yaw}
              />
            </div>
          ) : null}
        </Rise>
      </div>
    )
  }

  // content
  return (
    <div className={styles.contentSlide}>
      <Rise active={active} className={styles.contentFill}>
        <Kicker text={slide.kicker} />
        {slide.title && (
          <h2>
            <TitleLines text={slide.title} />
          </h2>
        )}
        {slide.body && <p className={`${styles.body} text-muted`}>{slide.body}</p>}
        {slide.quote && <blockquote className={styles.quote}>{slide.quote}</blockquote>}
        {slide.bullets && (
          <ul className={styles.bullets}>
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {slide.motif && (
          <div className={styles.contentMotif}>
            <Motif kind={slide.motif} active={active} slide={slide} />
          </div>
        )}
      </Rise>
    </div>
  )
}
