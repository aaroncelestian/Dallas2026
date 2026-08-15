import { asset } from '../lib/asset'

export type LayoutKind =
  | 'cover'
  | 'divider'
  | 'content'
  | 'split'
  | 'bleed'
  | 'stage'
  | 'hero'
  | 'void'
  | 'monument'
  | 'image'
  | 'litany'

export type MotifKind =
  | 'ion-chart'
  | 'criteria-overlap'
  | 'prep-modes'
  | 'color-reveal'

export type ChapterId = 'open' | 'research' | 'exhibition' | 'close'

export interface Slide {
  id: string
  label: string
  chapter: ChapterId
  layout: LayoutKind
  brand?: string
  kicker?: string
  title?: string
  displayTitle?: string
  subtitle?: string
  body?: string
  bullets?: string[]
  quote?: string
  meta?: string
  ghostNum?: string
  heroNum?: string
  image?: { src: string; alt: string; fit?: 'cover' | 'contain' }
  motif?: MotifKind
  yaw?: 1 | -1
  notes?: string
}

export const CHAPTERS: { id: ChapterId; num: string; title: string }[] = [
  { id: 'research', num: '01', title: 'Research' },
  { id: 'exhibition', num: '02', title: 'Exhibition' },
  { id: 'close', num: '03', title: 'Return' },
]

export const slides: Slide[] = [
  // ── Open ──────────────────────────────────────────────
  {
    id: 'cold',
    label: 'Cold open',
    chapter: 'open',
    layout: 'image',
    image: {
      src: asset('images/gold.jpg'),
      alt: 'Crystallized gold on quartz, uncaptioned',
      fit: 'contain',
    },
    yaw: 1,
    notes:
      'Hold. Do not name it. Do not start the title. Let the room look. This is the whole talk in one object: something kept because it was extraordinary, not because anyone knew what it would be asked to do.',
  },
  {
    id: 'title',
    label: 'Title',
    chapter: 'open',
    layout: 'cover',
    brand: 'NHMLAC',
    displayTitle: 'Exhibitions\nand the Mission\nof a Natural\nHistory Museum',
    meta: 'Aaron Celestian  ·  Mineral Sciences  ·  Dallas  ·  40 minutes',
    image: {
      src: asset('images/gold.jpg'),
      alt: 'Crystallized gold on quartz',
      fit: 'contain',
    },
    yaw: 1,
    notes:
      'Title card only. The thesis stays in your mouth, not on the wall: acquisition is a bet on future analytical capacity — and on how the public learns to see.',
  },
  {
    id: 'question',
    label: 'The question',
    chapter: 'open',
    layout: 'void',
    title: 'Why keep a mineral\nno one yet knows\nhow to use?',
    notes:
      'Open verbatim with the abstract line. Add, spoken: or put on public display? Don’t answer. Promise two answers that turn out to be the same answer.',
  },
  {
    id: 'twice',
    label: 'Twice',
    chapter: 'open',
    layout: 'void',
    title: 'I’ll answer twice.',
    notes:
      'Once through research. Once through exhibition. Both answers converge. Then go to 1620.',
  },
  {
    id: 'cabinet',
    label: 'Four centuries',
    chapter: 'open',
    layout: 'monument',
    heroNum: '1620',
    subtitle: 'Four centuries. One cabinet.',
    notes:
      'Papal cabinet specimen — acquired for curiosity, princely display, natural philosophy. Asked later to answer under instruments nobody in 1620 could imagine. A specimen’s use is not fixed at acquisition. This is the talk in miniature. Then breathe into Act I.',
  },

  // ── Act I ─────────────────────────────────────────────
  {
    id: 'act1',
    label: 'Act I',
    chapter: 'research',
    layout: 'divider',
    ghostNum: '01',
    title: 'Research as\nunplanned infrastructure',
    notes:
      'Four specimens. Four centuries of waiting. Each acquired for a reason that had nothing to do with its eventual payoff.',
  },
  {
    id: 'zeolite-setup',
    label: 'Zeolite',
    chapter: 'research',
    layout: 'bleed',
    kicker: 'Channel structure',
    title: 'Nobody bought this\nas medicine.',
    image: {
      src: asset('images/zeolite.jpg'),
      alt: 'Zeolite specimen, stellarite',
      fit: 'contain',
    },
    yaw: -1,
    notes:
      'Acquired for channel structure and aesthetic rarity. Show the specimen. State it plainly: nobody acquired this as medical research.',
  },
  {
    id: 'lokelma',
    label: 'Lokelma',
    chapter: 'research',
    layout: 'hero',
    kicker: 'Zeolite → Lokelma',
    heroNum: 'K⁺',
    title: 'Size-selective exchange\nbecomes a drug.',
    motif: 'ion-chart',
    notes:
      'Microporous zirconosilicate. Channels permissive to Na⁺, exclusive of K⁺ (1.38 Å). The selectivity coefficient that cleared FDA approval for hyperkalemia. ~3 million patients. Prefer the chart over a table. Then leave it.',
  },
  {
    id: 'rowleyite-setup',
    label: 'Rowleyite',
    chapter: 'research',
    layout: 'bleed',
    kicker: 'A new species',
    title: 'Prized for novelty.',
    image: {
      src: asset('images/rowleyite.jpg'),
      alt: 'Rowleyite crystals on matrix',
      fit: 'cover',
    },
    yaw: 1,
    notes:
      'Collector logic: taxonomic curiosity — not medicine. Dallas may already know the species-description story. Don’t retell it. The therapeutic angle is downstream of pure taxonomy.',
  },
  {
    id: 'rowleyite-oncology',
    label: 'Oncology',
    chapter: 'research',
    layout: 'void',
    title: 'Then a\ntherapeutic lead.',
    notes:
      'Vanadium-bearing framework, cytotoxic selectivity, controlled-release potential. Channel architecture informing targeted oncology. The delay between “new species” and “drug-design lead” is the point.',
  },
  {
    id: 'spinel',
    label: 'Lithium',
    chapter: 'research',
    layout: 'void',
    kicker: 'Resource security',
    title: 'Low-water lithium.',
    notes:
      'Spinel-structured analogs guiding extraction against Chile/Argentina evaporative brine — water cost, ecosystem impact. Museum mineralogy in a live supply-chain conversation. No specimen on screen: let the sentence carry it.',
  },
  {
    id: 'mars',
    label: 'Mars analogs',
    chapter: 'research',
    layout: 'bleed',
    kicker: 'Astrobiology',
    title: 'It looked like\nnothing else.',
    image: {
      src: asset('images/mars-analog.jpg'),
      alt: 'Mars-analog evaporite with microbial texture',
      fit: 'cover',
    },
    yaw: -1,
    notes:
      'Collected because it looked like nothing else. Mars-analog evaporites. Halophile carotenoid biosignatures. Novelty that became a template for reading life’s residue.',
  },
  {
    id: 'pattern',
    label: 'The pattern',
    chapter: 'research',
    layout: 'void',
    title: 'They had to\nwait together.',
    notes:
      'Hinge of the talk. Microbial activity leaves a structural signature that persists across scales — kidney stones to Martian regolith. No single acquisition could show this. It only became visible because the specimens existed together, decades apart, waiting to be read against each other. Close Act I here.',
  },

  // ── Act II ────────────────────────────────────────────
  {
    id: 'act2',
    label: 'Act II',
    chapter: 'exhibition',
    layout: 'divider',
    ghostNum: '02',
    title: 'Exhibition as the same bet,\npointed at the public',
    notes:
      'Research infrastructure is the half of the mission the public doesn’t see. Exhibition is the half they do. Same acquisition logic, different audience. Name Unearthed.',
  },
  {
    id: 'unearthed',
    label: 'Unearthed',
    chapter: 'exhibition',
    layout: 'bleed',
    kicker: 'Unearthed: Raw Beauty',
    title: 'The mineral\nstands alone.',
    image: {
      src: asset('images/emerald.jpg'),
      alt: 'Emerald crystal, Unearthed',
      fit: 'contain',
    },
    yaw: -1,
    notes:
      'Crystallized minerals as finished aesthetic objects — not illustrations of principle, not raw material for lapidary. No pairing against human-made art. Further than Rare Earth at the Crow Museum here in Dallas, and Santa Barbara. Strong local hook.',
  },
  {
    id: 'criteria',
    label: 'Criteria',
    chapter: 'exhibition',
    layout: 'hero',
    kicker: 'The same act of looking',
    heroNum: '=',
    title: 'Aesthetic judgment\nand scientific standing.',
    motif: 'criteria-overlap',
    notes:
      'Size, form, color, transparency, luster, matrix, provenance — the checklist that makes a specimen beautiful also makes it a better dataset. Not parallel tracks. Same looking. A complete crystal face is a better object and an uninterrupted growth history.',
  },
  {
    id: 'blue-wave',
    label: 'Blue Wave',
    chapter: 'exhibition',
    layout: 'stage',
    motif: 'color-reveal',
    image: {
      src: asset('images/blue-wave.jpg'),
      alt: 'Blue Wave aragonite, Wenshan Mine, Yunnan',
      fit: 'contain',
    },
    notes:
      'Press Enter or R to reveal. Visitors assume dyed. Trace copper substitution in the aragonite lattice — same transition-metal mechanism as malachite and azurite. Aesthetic surprise delivering a mineralogy lesson. Hold after the reveal.',
  },
  {
    id: 'preservation',
    label: 'Preservation',
    chapter: 'exhibition',
    layout: 'bleed',
    kicker: 'Wuning',
    title: 'Specimens that\nalmost weren’t.',
    image: {
      src: asset('images/stibnite.jpg'),
      alt: 'Wuning stibnite pocket, preserved',
      fit: 'contain',
    },
    yaw: 1,
    notes:
      'Wuning stibnite pocket preserved instead of ground for antimony. Crystallized gold worth orders of magnitude above melt value — because it wasn’t melted. Every exceptional specimen destroyed is an irretrievable loss. Infrastructure argument in reverse: preservation against economic pressure.',
  },
  {
    id: 'prep-spectrum',
    label: 'Preparation',
    chapter: 'exhibition',
    layout: 'stage',
    kicker: 'Four modes',
    title: 'Where does geology end\nand intention begin?',
    motif: 'prep-modes',
    notes:
      'Unearthed holds the open question with four deliberate modes. Use [ ] or , . to pull focus: citrine teapot (total transformation), chrysanthemum stone (subtraction), Hubei turquoise (architecture exposed), ammolite with Pepper’s Ghost (interpretive reconstruction). Don’t resolve the question.',
  },
  {
    id: 'provenance',
    label: 'Provenance',
    chapter: 'exhibition',
    layout: 'bleed',
    kicker: 'De’an · Wushan',
    title: 'Named locality.',
    image: {
      src: asset('images/fluorite.jpg'),
      alt: 'Fluorite with calcite, documented locality',
      fit: 'contain',
    },
    yaw: -1,
    notes:
      'Hinge between missions. De’an fluorite mine, Wushan — not “fluorite, China.” Undocumented material can still be beautiful; it can never become infrastructure. Provenance pays in both currencies. Mechanism, not metaphor.',
  },
  {
    id: 'regional',
    label: 'Peninsular Ranges',
    chapter: 'exhibition',
    layout: 'bleed',
    kicker: 'Southern California',
    title: 'Himalaya. Pala.\nStewart Lithia.',
    image: {
      src: asset('images/tourmaline.jpg'),
      alt: 'Tourmaline, Himalaya Mine',
      fit: 'contain',
    },
    yaw: 1,
    notes:
      'Peninsular Ranges pegmatites — Himalaya, Tourmaline King/Queen, Pala Chief, Stewart Lithia. NHMLAC’s collection as the largest public gathering of that material assembled to date. Crevoshay as a contemporary extension of specimen-first logic into wearable art. Keep tight. Regional color, not new argument.',
  },
  {
    id: 'loans',
    label: 'Loans',
    chapter: 'exhibition',
    layout: 'bleed',
    kicker: 'April 2027',
    title: 'Nearly everything\nis on loan.',
    image: {
      src: asset('images/unearthed-gallery.jpg'),
      alt: 'Unearthed gallery',
      fit: 'cover',
    },
    yaw: -1,
    notes:
      'What the museum “keeps” isn’t necessarily these objects — it’s the practice of bringing exceptional borrowed material to change how visitors see the permanent collection. A temporary exhibition is a lens, not a holding. Blue Wave leaves in 2027; the way of looking doesn’t.',
  },
  {
    id: 'both',
    label: 'What it takes',
    chapter: 'exhibition',
    layout: 'litany',
    kicker: 'Under one roof',
    bullets: [
      'Research scientists',
      'A permanent collection',
      'Traveling exhibitions',
      'Research loans out',
      'Exhibit loans in',
    ],
    notes:
      'Each depends on the others. Not a generic claim about “museums” — specific to what this institution is built to do. Act I could not run on a loan clock. Accession is the only path by which a collector’s private judgment enters the centuries-long story we opened with. Don’t over-explain the ask. State the mechanism.',
  },

  // ── Close ─────────────────────────────────────────────
  {
    id: 'synthesis',
    label: 'Return',
    chapter: 'close',
    layout: 'divider',
    ghostNum: '03',
    title: 'One acquisition logic.',
    notes:
      'Provenance, rarity, structural intuition in — drugs, templates, biosignatures, and a changed permanent collection out. Loans recruit attention; ownership holds it. Complementary, not competitors.',
  },
  {
    id: 'bet',
    label: 'The bet',
    chapter: 'close',
    layout: 'void',
    title: 'Today’s specimen is\ntomorrow’s unanswered\nquestion.',
    notes:
      'Run on an instrument not yet built — or seen by a visitor who hasn’t yet learned how to look. Strategic collecting is scientific and cultural infrastructure. Restate the abstract closing claim, then return to the gold.',
  },
  {
    id: 'close',
    label: 'Close',
    chapter: 'close',
    layout: 'stage',
    kicker: 'The longer bet',
    title: 'It’s you.',
    image: {
      src: asset('images/gold.jpg'),
      alt: 'Crystallized gold, now with the talk attached',
      fit: 'contain',
    },
    yaw: 1,
    notes:
      'Return to the opening image. Land this spoken, not on the wall: Unearthed closes April 2027. Nearly everything is on loan. That’s not a weakness; it’s the argument. What NHMLAC is betting on isn’t these objects — it’s you. A private collection can show you something extraordinary once. A public museum is making a longer bet: that showing you something extraordinary, even temporarily, changes what you notice in what’s already, permanently, yours. Then thank-yous. Not before.',
  },
]
