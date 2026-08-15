import { slides, type ChapterId, type Slide } from '../data/slides'
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
}

export function chapterTitle(id: ChapterId) {
  return CHAPTER_HEAD[id]
}

export function onScreenLines(slide: Slide): string[] {
  const lines: string[] = []
  if (slide.brand) lines.push(slide.brand)
  if (slide.kicker) lines.push(slide.kicker)
  if (slide.ghostNum) lines.push(slide.ghostNum)
  if (slide.heroNum) lines.push(slide.heroNum)
  if (slide.displayTitle) lines.push(slide.displayTitle.replace(/\n/g, ' '))
  if (slide.title) lines.push(slide.title.replace(/\n/g, ' '))
  if (slide.subtitle) lines.push(slide.subtitle)
  if (slide.body) lines.push(slide.body)
  if (slide.quote) lines.push(`“${slide.quote}”`)
  if (slide.meta) lines.push(slide.meta)
  for (const bullet of slide.bullets ?? []) lines.push(`• ${bullet}`)
  if (slide.image) lines.push(`Image: ${slide.image.alt}`)
  if (slide.motif === 'prep-modes') {
    for (const mode of PREP_MODES) lines.push(`• ${mode.title} — ${mode.body}`)
  } else if (slide.motif === 'ion-chart') {
    lines.push('Motif: ion-exchange chart (Na⁺ admitted, K⁺ excluded)')
  } else if (slide.motif === 'crystal-viewer') {
    lines.push('Motif: ZS-9 crystal structure — K⁺ in the channels (drag to orbit)')
  } else if (slide.motif === 'criteria-overlap') {
    lines.push('Motif: aesthetic judgment overlapping scientific standing')
  } else if (slide.motif === 'color-reveal') {
    lines.push('Motif: color reveal (Enter / R)')
  }
  if (lines.length === 0) lines.push('(specimen only — no type)')
  return lines
}

export function scriptBeats(): ScriptBeat[] {
  return slides.map((slide, index) => ({
    index,
    slide,
    chapter: slide.chapter,
    onScreen: onScreenLines(slide),
    notes: slide.notes,
  }))
}

export function scriptMarkdown(): string {
  const beats = scriptBeats()
  const parts = [
    `# ${SCRIPT_TITLE}`,
    '',
    SCRIPT_META,
    '',
    'Speaker script. Each beat lists what is on the projection, then what to say. The argument lives in the spoken notes, not on the wall.',
    '',
  ]

  let lastChapter: ChapterId | undefined
  for (const beat of beats) {
    if (beat.chapter !== lastChapter) {
      parts.push(`## ${chapterTitle(beat.chapter)}`, '')
      lastChapter = beat.chapter
    }
    parts.push(`### ${beat.index + 1}. ${beat.slide.label}`, '')
    parts.push('**On screen**', '')
    for (const line of beat.onScreen) parts.push(`- ${line}`)
    parts.push('')
    if (beat.notes) {
      parts.push('**Say**', '', beat.notes, '')
    }
  }

  return parts.join('\n').trim() + '\n'
}
