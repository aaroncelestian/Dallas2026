import { slides, type ChapterId, type SceneBeat, type Slide } from '../data/slides'
import { PREP_MODES } from '../data/prepModes'

export const SCRIPT_TITLE = 'Exhibitions and the Mission of a Natural History Museum'
export const SCRIPT_META = 'Aaron Celestian  ·  Mineral Sciences  ·  Dallas  ·  40 minutes'

const CHAPTER_HEAD: Record<ChapterId, string> = {
  open: 'Open',
  research: '01  Research',
  exhibition: '02  Exhibition',
  close: '03  Return',
}

export interface ScriptBeat {
  index: number
  slide: Slide
  chapter: ChapterId
  onScreen: string[]
  notes?: string
  sceneLabel?: string
}

export function chapterTitle(id: ChapterId) {
  return CHAPTER_HEAD[id]
}

function motifLine(slide: Slide): string | undefined {
  if (slide.motif === 'prep-modes') return undefined
  if (slide.motif === 'ion-chart') return 'Motif: ion-exchange chart'
  if (slide.motif === 'crystal-viewer') {
    return 'Motif: ZS-9 crystal structure — K⁺ in the channels (drag to orbit)'
  }
  if (slide.motif === 'void-viewer') {
    return 'Motif: Rowleyite void space — cages and channels, no atoms (drag to orbit)'
  }
  if (slide.motif === 'criteria-overlap') {
    return 'Motif: aesthetic judgment overlapping scientific standing'
  }
  if (slide.motif === 'color-reveal') return 'Motif: color reveal (Enter / R)'
  return undefined
}

export function onScreenLines(slide: Slide, beat?: SceneBeat): string[] {
  const lines: string[] = []
  if (slide.brand) lines.push(slide.brand)
  const kicker = beat?.kicker ?? slide.kicker
  const title = beat?.title ?? slide.title
  const subtitle = beat?.subtitle ?? slide.subtitle
  if (kicker) lines.push(kicker)
  if (slide.ghostNum) lines.push(slide.ghostNum)
  if (slide.heroNum) lines.push(slide.heroNum)
  if (slide.displayTitle) lines.push(slide.displayTitle.replace(/\n/g, ' '))
  if (title) lines.push(title.replace(/\n/g, ' '))
  if (subtitle) lines.push(subtitle)
  if (slide.body) lines.push(slide.body)
  if (slide.quote) lines.push(`“${slide.quote}”`)
  if (slide.meta) lines.push(slide.meta)
  for (const bullet of slide.bullets ?? []) lines.push(`• ${bullet}`)
  if (beat?.layers && slide.layers) {
    for (const id of beat.layers) {
      const layer = slide.layers.find((item) => item.id === id)
      if (layer?.alt) lines.push(`Image: ${layer.alt}`)
      if (layer?.kind === 'motif' && layer.motif === 'crystal-viewer') {
        if (beat?.id === 'protons') {
          lines.push('Motif: ZS-9 — K removed, H pointing at the vacant site (H to step)')
        } else if (beat?.id === 'lock') {
          lines.push('Motif: ZS-9 — H bends and exchanges out; K locks in')
        } else if (beat?.id === 'patients') {
          lines.push('Motif: ZS-9 — K locked in the 7-ring (drag to orbit)')
        } else {
          lines.push('Motif: ZS-9 crystal structure — K⁺ in the channels (drag to orbit)')
        }
      }
      if (layer?.kind === 'motif' && layer.motif === 'void-viewer') {
        lines.push(
          beat?.guests
            ? 'Motif: Rowleyite void — doxorubicin, vincristine, cisplatin, temozolomide in the near-face cages (drag to orbit)'
            : 'Motif: Rowleyite void space — cages and channels, no atoms (drag to orbit)',
        )
      }
    }
  } else if (slide.image) {
    lines.push(`Image: ${slide.image.alt}`)
  }
  if (slide.motif === 'prep-modes') {
    for (const mode of PREP_MODES) lines.push(`• ${mode.title} — ${mode.body}`)
  } else {
    const motif = motifLine(slide)
    if (motif && !beat) lines.push(motif)
  }
  if (lines.length === 0) lines.push('(specimen only — no type)')
  return lines
}

export function scriptBeats(): ScriptBeat[] {
  const beats: ScriptBeat[] = []
  let index = 0
  for (const slide of slides) {
    if (slide.scene?.length) {
      for (const beat of slide.scene) {
        beats.push({
          index: index++,
          slide,
          chapter: slide.chapter,
          onScreen: onScreenLines(slide, beat),
          notes: beat.notes,
          sceneLabel: beat.label,
        })
      }
    } else {
      beats.push({
        index: index++,
        slide,
        chapter: slide.chapter,
        onScreen: onScreenLines(slide),
        notes: slide.notes,
      })
    }
  }
  return beats
}

export function scriptMarkdown(): string {
  const beats = scriptBeats()
  const parts = [
    `# ${SCRIPT_TITLE}`,
    '',
    SCRIPT_META,
    '',
    'Speaker script. Each beat lists what is on the projection, then what to say. The argument lives in the spoken notes, not on the wall. Space walks scene beats; hover the counter to jump.',
    '',
  ]

  let lastChapter: ChapterId | undefined
  for (const beat of beats) {
    if (beat.chapter !== lastChapter) {
      parts.push(`## ${chapterTitle(beat.chapter)}`, '')
      lastChapter = beat.chapter
    }
    const title = beat.sceneLabel
      ? `${beat.slide.label} · ${beat.sceneLabel}`
      : beat.slide.label
    parts.push(`### ${beat.index + 1}. ${title}`, '')
    parts.push('**On screen**', '')
    for (const line of beat.onScreen) parts.push(`- ${line}`)
    parts.push('')
    if (beat.notes) {
      parts.push('**Say**', '', beat.notes, '')
    }
  }

  return parts.join('\n').trim() + '\n'
}
