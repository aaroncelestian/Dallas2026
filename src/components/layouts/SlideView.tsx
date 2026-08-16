import { motion } from 'framer-motion'
import type { Slide, MotifKind } from '../../data/slides'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { DepthField } from './DepthField'
import { ImpactHit } from './ImpactHit'
import { IonChart } from '../motifs/IonChart'
import { CrystalViewer } from '../motifs/CrystalViewer'
import { CriteriaOverlap } from '../motifs/CriteriaOverlap'
import { PrepModes } from '../motifs/PrepModes'
import { ColorReveal } from '../motifs/ColorReveal'
import { PREP_MODES } from '../../data/prepModes'
import { SceneView } from './SceneView'
import styles from './Layouts.module.css'

const rise = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
}

function Rise({
  active,
  children,
  delay = 0,
  className,
  snap = false,
}: {
  active: boolean
  children: React.ReactNode
  delay?: number
  className?: string
  snap?: boolean
}) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={false}
      animate={active ? 'show' : 'hidden'}
      variants={rise}
      transition={{
        duration: snap ? 0 : 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay: snap || !active ? 0 : delay,
      }}
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
    case 'crystal-viewer':
      return <CrystalViewer active={active} />
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

export function SlideView({
  slide,
  active,
  plated = false,
  copyActive = true,
}: {
  slide: Slide
  active: boolean
  plated?: boolean
  copyActive?: boolean
}) {
  const yaw = (slide.yaw ?? 1) as 1 | -1
  const ownImage = !plated

  if (slide.scene) {
    return <SceneView slide={slide} active={active} />
  }

  if (slide.layout === 'impact') {
    return (
      <ImpactHit
        src={slide.image?.src ?? ''}
        alt={slide.image?.alt ?? 'Cabinet'}
        active={active}
        facts={slide.bullets}
        focus={slide.image?.focus}
      />
    )
  }

  if (slide.layout === 'image') {
    return (
      <div className={styles.bleedWrap}>
        {ownImage && slide.image && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'contain'}
            yaw={yaw}
            camera={slide.camera}
          />
        )}
      </div>
    )
  }

  if (slide.layout === 'void') {
    return (
      <div className={styles.voidSlide}>
        <Rise active={copyActive} snap={Boolean(slide.copySnap)} className={styles.voidInner}>
          <Kicker text={slide.kicker} />
          {slide.title && (
            <h2 className={styles.voidTitle}>
              <TitleLines text={slide.title} />
            </h2>
          )}
        </Rise>
      </div>
    )
  }

  if (slide.layout === 'monument') {
    const snap = Boolean(slide.copySnap)
    return (
      <div className={styles.monument}>
        <Rise active={copyActive} snap={snap}>
          {slide.heroNum && <div className={styles.monumentYear}>{slide.heroNum}</div>}
        </Rise>
        {slide.subtitle && (
          <Rise active={copyActive} snap={snap} delay={copyActive && !snap ? 0.18 : 0}>
            <p className={styles.monumentLine}>{slide.subtitle}</p>
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'litany') {
    return (
      <div className={styles.litany}>
        <Rise active={active}>
          <Kicker text={slide.kicker} />
        </Rise>
        <div className={styles.litanyList}>
          {(slide.bullets ?? []).map((line, i) => (
            <Rise key={line} active={active} delay={0.12 + i * 0.1}>
              <p>{line}</p>
            </Rise>
          ))}
        </div>
      </div>
    )
  }

  if (slide.layout === 'cover') {
    return (
      <div className={styles.cover} data-active={active || undefined}>
        {ownImage && slide.image && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
            camera={slide.camera}
          />
        )}
        <div className={styles.coverScrim} aria-hidden />
        <Rise active={copyActive} delay={0.15} className={styles.coverContent}>
          {slide.brand && <div className={styles.brand}>{slide.brand}</div>}
          {slide.displayTitle && (
            <h1 className={styles.display}>
              <TitleLines text={slide.displayTitle} />
            </h1>
          )}
        </Rise>
        {slide.meta && (
          <Rise active={copyActive} delay={0.28} className={styles.meta}>
            {slide.meta}
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'divider') {
    return (
      <div className={styles.divider}>
        <Rise active={active}>
          <div className={styles.ghost}>{slide.ghostNum}</div>
        </Rise>
        <Rise active={active} delay={0.16}>
          <h2 className={styles.dividerTitle}>
            {slide.title && <TitleLines text={slide.title} />}
          </h2>
        </Rise>
      </div>
    )
  }

  if (slide.layout === 'bleed') {
    return (
      <div className={styles.bleedWrap}>
        {ownImage && slide.image && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
            camera={slide.camera}
          />
        )}
        <div className={styles.bleedScrim} aria-hidden />
        {slide.kicker && <div className={`${styles.bleedKicker} kicker`}>{slide.kicker}</div>}
        {slide.title && (
          <Rise active={active} delay={0.2} className={styles.bleedCopy}>
            <h2>
              <TitleLines text={slide.title} />
            </h2>
          </Rise>
        )}
      </div>
    )
  }

  if (slide.layout === 'stage') {
    const motifFull =
      slide.motif === 'color-reveal' ||
      slide.motif === 'prep-modes' ||
      slide.motif === 'crystal-viewer'
    return (
      <div className={styles.stage} data-motif={slide.motif || undefined}>
        {ownImage && slide.image && !motifFull && (
          <DepthField
            src={slide.image.src}
            alt={slide.image.alt}
            active={active}
            fit={slide.image.fit ?? 'cover'}
            yaw={yaw}
            camera={slide.camera}
          />
        )}
        {slide.motif === 'crystal-viewer' && (
          <div className={styles.stageCrystal}>
            <Motif kind="crystal-viewer" active={active} slide={slide} />
          </div>
        )}
        {slide.motif !== 'color-reveal' && <div className={styles.stageScrim} aria-hidden />}
        {slide.motif === 'color-reveal' ? (
          <Motif kind="color-reveal" active={active} slide={slide} />
        ) : slide.motif === 'crystal-viewer' ? (
          <Rise active={active} delay={0.15} className={styles.stageCopy}>
            <Kicker text={slide.kicker} />
            {slide.title && (
              <h2>
                <TitleLines text={slide.title} />
              </h2>
            )}
            {slide.subtitle && <p className={`${styles.body} text-muted`}>{slide.subtitle}</p>}
          </Rise>
        ) : slide.motif === 'prep-modes' ? (
          <div className={styles.stagePad}>
            <Rise active={active} className={styles.stageCopy}>
              <Kicker text={slide.kicker} />
              {slide.title && (
                <h2>
                  <TitleLines text={slide.title} />
                </h2>
              )}
            </Rise>
            <Rise active={active} delay={0.14} className={styles.stageMotifWide}>
              <Motif kind="prep-modes" active={active} slide={slide} />
            </Rise>
          </div>
        ) : (
          <Rise active={active} delay={0.15} className={styles.stageCopy}>
            <Kicker text={slide.kicker} />
            {slide.title && (
              <h2>
                <TitleLines text={slide.title} />
              </h2>
            )}
            {slide.motif && (
              <div className={styles.stageMotif}>
                <Motif kind={slide.motif} active={active} slide={slide} />
              </div>
            )}
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
        </Rise>
        {slide.motif && (
          <Rise active={active} delay={0.16} className={styles.heroMotif}>
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
          {slide.subtitle && <p className={`${styles.body} text-muted`}>{slide.subtitle}</p>}
        </Rise>
        <Rise active={active} delay={0.1} className={styles.splitMedia}>
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

  return (
    <div className={styles.contentSlide}>
      <Rise active={active} className={styles.contentFill}>
        <Kicker text={slide.kicker} />
        {slide.title && (
          <h2>
            <TitleLines text={slide.title} />
          </h2>
        )}
        {slide.subtitle && <p className={`${styles.body} text-muted`}>{slide.subtitle}</p>}
      </Rise>
    </div>
  )
}
