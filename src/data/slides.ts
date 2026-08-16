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
  | 'impact'

export type MotifKind =
  | 'ion-chart'
  | 'crystal-viewer'
  | 'void-viewer'
  | 'criteria-overlap'
  | 'prep-modes'
  | 'color-reveal'

export type ChapterId = 'open' | 'research' | 'exhibition' | 'close'

export type CameraKind =
  | 'push'
  | 'pull'
  | 'pan-left'
  | 'pan-right'
  | 'rise'
  | 'fall'
  | 'rack'
  | 'drift'
  | 'hold'

export type SceneLayerKind = 'image' | 'motif' | 'video'

export interface SceneLayer {
  id: string
  kind: SceneLayerKind
  src?: string
  poster?: string
  alt?: string
  fit?: 'cover' | 'contain'
  motif?: MotifKind
}

export interface SceneBeat {
  id: string
  label: string
  kicker?: string
  title?: string
  subtitle?: string
  layers?: string[]
  guests?: boolean
  notes?: string
}

export interface StoneMark {
  label: string
  x: number
  y: number
  w: number
  h: number
  src?: string
  tint?: string
}

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
  image?: {
    src: string
    alt: string
    fit?: 'cover' | 'contain'
    /** Normalized crop the impact hold should fill. */
    focus?: { x: number; y: number; w: number; h: number }
    /** High-res plate of `focus` — used for the zoomed-in hold, then faded as the full image pulls back. */
    detail?: string
    /** Specimen callouts, normalized to the full image. */
    marks?: StoneMark[]
  }
  motif?: MotifKind
  yaw?: 1 | -1
  camera?: CameraKind
  /** Drop the living plate to black instead of ghosting the last specimen. */
  clearPlate?: boolean
  /** Seconds before type appears. */
  enterDelay?: number
  /** Seconds to hold on black after type fades, before the next beat. */
  exitHold?: number
  /** Hold a black frame before the type comes up. */
  enterBlack?: boolean
  /** Arrive from black as a hard hit — do not lift the blackout first. */
  enterHit?: boolean
  /** Type cuts on and off. No fade. */
  copySnap?: boolean
  splitFlip?: boolean
  notes?: string
  layers?: SceneLayer[]
  scene?: SceneBeat[]
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
    camera: 'rack',
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
    camera: 'rack',
    brand: 'NHMLAC',
    displayTitle: 'Exhibitions\nand the Mission\nof a Natural\nHistory Museum',
    meta: 'Aaron Celestian  ·  Mineral Sciences  ·  Dallas  ·  40 minutes',
    image: {
      src: asset('images/gold.jpg'),
      alt: 'Crystallized gold on quartz',
      fit: 'contain',
    },
    yaw: 1,
    exitHold: 1,
    notes:
      'Title card only. The thesis stays in your mouth, not on the wall: acquisition is a bet on future analytical capacity — and on how the public learns to see.',
  },
  {
    id: 'question',
    label: 'The question',
    chapter: 'open',
    layout: 'void',
    camera: 'drift',
    title: 'Why keep a mineral\nno one yet knows\nhow to use?',
    exitHold: 1,
    enterBlack: true,
    copySnap: true,
    notes:
      'Open verbatim with the abstract line. Add, spoken: or put on public display? Don’t answer. Promise two answers that turn out to be the same answer.',
  },
  {
    id: 'twice',
    label: 'Twice',
    chapter: 'open',
    layout: 'void',
    camera: 'drift',
    title: 'I’ll answer twice.',
    exitHold: 2,
    enterBlack: true,
    copySnap: true,
    notes:
      'Once through research. Once through exhibition. Both answers converge. Then go to 1620.',
  },
  {
    id: 'cabinet',
    label: 'Four centuries',
    chapter: 'open',
    layout: 'monument',
    camera: 'pull',
    heroNum: '1620',
    subtitle: 'Four centuries. One cabinet.',
    exitHold: 1,
    copySnap: true,
    notes:
      'Papal cabinet specimen — acquired for curiosity, princely display, natural philosophy. Asked later to answer under instruments nobody in 1620 could imagine. A specimen’s use is not fixed at acquisition. This is the talk in miniature. Then the doorway hits. Don’t caption it.',
  },
  {
    id: 'cabinet-hit',
    label: 'The doorway',
    chapter: 'open',
    layout: 'impact',
    enterHit: true,
    clearPlate: true,
    image: {
      src: asset('images/cabinet-windsor.webp'),
      alt: 'Central doorway of the Borghese-Windsor Cabinet',
      fit: 'contain',
      focus: { x: 0.347876, y: 0.427042, w: 0.342135, h: 0.176953 },
      detail: asset('images/cabinet-doorway.webp'),
      marks: [
        {
          label: 'Quartz',
          x: 0.448,
          y: 0.328,
          w: 0.132,
          h: 0.036,
          src: asset('images/cabinet-quartz.webp'),
          tint: '#c4a0d4',
        },
        {
          label: 'Agate',
          x: 0.462,
          y: 0.244,
          w: 0.105,
          h: 0.048,
          src: asset('images/cabinet-agate.webp'),
          tint: '#d47848',
        },
        {
          label: 'Travertine',
          x: 0.24,
          y: 0.422,
          w: 0.12,
          h: 0.014,
          src: asset('images/cabinet-travertine.webp'),
          tint: '#d8c4a4',
        },
        {
          label: 'Lapis',
          x: 0.492,
          y: 0.614,
          w: 0.044,
          h: 0.020,
          src: asset('images/cabinet-lapis.webp'),
          tint: '#4a7ec8',
        },
      ],
    },
    bullets: [
      'Made for Pope Paul V',
      'Agate — Lapis — Ebony',
      'Moganite-to-quartz ratio dates the agate',
      'Two populations. Two source rocks.',
    ],
    notes:
      'Hold the doorway. Do not say cabinet. Do not say furniture. Let it read as a temple threshold — something biblical, larger than the object. Five seconds. Then it pulls back and it is a cabinet. As it settles, the stones light: quartz, agate, travertine, lapis. Talk the minerals off the close-ups. Then advance. The plates go to blur and the facts come in: papal commission, the materials, moganite dating the agate, two populations from two source rocks. The point stays in your mouth: what we keep opens onto more than we knew. Then Act I.',
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
      'A handful of specimens. Centuries, in aggregate, of waiting. Each acquired for a reason that had nothing to do with its eventual payoff — and one recurring signature that shows up in more of them than you’d expect.',
  },
  {
    id: 'lithium',
    label: 'Lithium',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'spinel',
        kind: 'image',
        src: asset('images/spinel.jpg'),
        alt: 'Spinel octahedron',
        fit: 'contain',
      },
    ],
    scene: [
      {
        id: 'low-water',
        label: 'Low-water lithium',
        kicker: 'Resource security',
        title: 'Low-water lithium.',
        layers: ['spinel'],
        notes:
          'Spinel-structured analogs guiding extraction against Chile/Argentina evaporative brine. Museum mineralogy in a live supply-chain conversation. The specimen is the structure, not the mine.',
      },
      {
        id: 'water',
        label: 'Water cost',
        kicker: 'Resource security',
        title: 'The Atacama cannot\nspare the water.',
        layers: ['spinel'],
        notes:
          'Water cost, ecosystem impact. Let the sentence carry the politics. Then leave it.',
      },
    ],
  },
  {
    id: 'rowleyite',
    label: 'Rowleyite',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'specimen',
        kind: 'image',
        src: asset('images/rowleyite.jpg'),
        alt: 'Rowleyite crystals on matrix',
        fit: 'contain',
      },
      {
        id: 'voids',
        kind: 'motif',
        motif: 'void-viewer',
      },
    ],
    scene: [
      {
        id: 'novelty',
        label: 'Novelty',
        kicker: 'A new species',
        title: 'Prized for novelty.',
        layers: ['specimen'],
        notes:
          'That same structural selectivity doesn’t stop at extraction. It goes into medicine too. Collector logic here was pure taxonomic curiosity — not medicine. Dallas may already know the species-description story. Don’t retell it.',
      },
      {
        id: 'voids',
        label: 'Void space',
        kicker: 'Channel architecture',
        title: 'The architecture\nis empty space.',
        layers: ['voids'],
        guests: true,
        notes:
          'Don’t draw the atoms. The framework is vanadium and phosphate; what the structure actually offers is the hole — cages and a connected channel network. Drag if you want the room to look into a cage. That empty space is what made it more than a new species.',
      },
      {
        id: 'cargo',
        label: 'Cargo',
        kicker: 'Host–guest',
        title: 'Doxorubicin. Vincristine.\nCisplatin. Temozolomide.',
        layers: ['voids'],
        guests: true,
        notes:
          'Four chemotherapeutics sitting in openings on the near face of the cell. The cages are large enough. Don’t overclaim a calculated pose — this is the picture of the idea: the hole is the useful part. Drag to look in from the side.',
      },
      {
        id: 'lead',
        label: 'Therapeutic lead',
        title: 'Then a\ntherapeutic lead.',
        layers: ['voids'],
        guests: true,
        notes:
          'Vanadium-bearing framework, cytotoxic selectivity, controlled-release potential. The cargo is still on the wall. That channel architecture is what informed targeted oncology. The delay between “new species” and “drug-design lead” is the point.',
      },
    ],
  },
  {
    id: 'lokelma',
    label: 'Lokelma',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'zeolite',
        kind: 'image',
        src: asset('images/zeolite.jpg'),
        alt: 'Zeolite specimen, stellarite',
        fit: 'contain',
      },
      {
        id: 'structure',
        kind: 'motif',
        motif: 'crystal-viewer',
      },
    ],
    scene: [
      {
        id: 'specimen',
        label: 'Zeolite',
        kicker: 'Channel structure',
        title: 'Nobody bought this\nas medicine.',
        layers: ['zeolite'],
        notes:
          'Acquired for channel structure and aesthetic rarity. State it plainly: nobody acquired this as medical research. The specimen is the class, not the drug. The names that matter are next.',
      },
      {
        id: 'precedents',
        label: 'Precedents',
        kicker: 'Zeolite → Lokelma',
        title: 'Georgechaoite.\nUmbite.\nSitinakite.',
        layers: ['zeolite'],
        notes:
          'Name the minerals that taught the pore. Georgechaoite and umbite are the natural zirconosilicates — Na/K sitting in a Zr–Si channel. Sitinakite is the titanosilicate cousin. Lokelma is the synthetic that left the cabinet. Don’t lecture the structures. The names are the lineage.',
      },
      {
        id: 'gut',
        label: 'Gut',
        kicker: 'Zeolite → Lokelma',
        title: 'Not blood.\nNot kidney.\nGut.',
        layers: ['structure'],
        notes:
          'One channel-selective mineral is still years from a patient. Another already is one. Correct a likely assumption: Lokelma doesn’t circulate in the blood, and it doesn’t act on the kidney. It’s non-absorbed — it never leaves the gut. Drag if you want the room to look into a channel.',
      },
      {
        id: 'pore',
        label: 'Pore',
        kicker: 'Zeolite → Lokelma',
        title: 'A ~3 Å pore, built to\nmimic a K⁺ channel.',
        layers: ['structure'],
        notes:
          'The crystal lattice opens a pore about three angstroms wide, engineered to mimic the selectivity of the body’s own potassium channels. Extremely selective over Na⁺, Ca²⁺, Mg²⁺. It captures potassium as food moves through the intestine, before the kidney would ever have to clear it. Deployed exactly where the kidney isn’t, because the kidney is the organ that’s failing.',
      },
      {
        id: 'protons',
        label: 'Protons',
        kicker: 'Zeolite → Lokelma',
        title: 'Protons point\nat the empty site.',
        layers: ['structure'],
        notes:
          'Strip the potassium. Hydrogens sit on the ring oxygens, pointing into the channel — toward the site K wants. Watch the cell contract. The framework is doing the work, not a soak. H steps the exchange if you want to run it by hand.',
      },
      {
        id: 'lock',
        label: 'Lock',
        kicker: 'Zeolite → Lokelma',
        title: 'They bend.\nThey leave.\nK stays.',
        layers: ['structure'],
        notes:
          'The protons reorient, then exchange out. The cell opens as potassium occupies the 7-ring and the window closes behind it. Size-selective capture, not a reversible soak.',
      },
      {
        id: 'patients',
        label: '3 million',
        kicker: 'Zeolite → Lokelma',
        title: 'Size-selective exchange\nbecomes a drug.',
        subtitle: '3 million patients.',
        layers: ['structure'],
        notes:
          'The three million is already on the wall. Then leave it.',
      },
    ],
  },
  {
    id: 'stones',
    label: 'Kidney stones',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'polish',
        kind: 'image',
        src: asset('images/stone-polish.jpg'),
        alt: 'Polished cross-section of a calcium oxalate kidney stone',
        fit: 'contain',
      },
      {
        id: 'ct',
        kind: 'video',
        src: asset('images/ks78-thickness.mp4'),
        poster: asset('images/ks78-cut.jpg'),
        alt: 'CT thickness map of a kidney stone, orbiting',
        fit: 'cover',
      },
      {
        id: 'stromatolite',
        kind: 'image',
        src: asset('images/stromatolite.jpg'),
        alt: 'Stromatolite thin section, blue epoxy in the pores',
        fit: 'contain',
      },
      {
        id: 'biofilm',
        kind: 'image',
        src: asset('images/stone-biofilm.jpg'),
        alt: 'SEM of intercalated bacterial biofilm inside a calcium stone',
        fit: 'contain',
      },
    ],
    scene: [
      {
        id: 'uninvited',
        label: 'Uninvited',
        title: 'One mineral you swallow\non purpose.',
        subtitle: 'One mineral builds itself, uninvited.',
        layers: ['polish'],
        notes:
          'The kidney’s own mineral chemistry is a different story. Not compensation from outside — a mineral forming inside the kidney’s own machinery. The oldest assumption about the most common kidney stone, calcium oxalate, is that it’s purely abiotic.',
      },
      {
        id: 'inside',
        label: 'CT volume',
        title: 'It has an inside.',
        layers: ['ct'],
        notes:
          'High-resolution imaging of the volume — layers, voids, thickness. Not a pebble. An architecture.',
      },
      {
        id: 'layers',
        label: 'Layers',
        title: 'Layers, again.',
        layers: ['stromatolite'],
        notes:
          'That layered architecture should look familiar to anyone who’s cut open a stromatolite. The blue is epoxy in the pores, not the mineral. Different mineral — calcium carbonate instead of calcium oxalate — but the same open question: is the layering evidence of a microbial mat building upward, one generation at a time? We don’t yet know that a kidney stone and a stromatolite form by the identical mechanism. What we do know is that both are laminated structures where biology appears to be templating mineral growth in sequence, not just contaminating it once.',
      },
      {
        id: 'biofilm',
        label: 'Biofilm',
        title: 'It doesn’t build alone.',
        layers: ['biofilm'],
        notes:
          'High-resolution electron imaging and synchrotron XRD: bacterial biofilms structurally intercalated through the internal architecture, in layers, in patients with no diagnosed infection at all. Schmidt et al., PNAS 2026. Kidney stone disease, partly microbial in origin.',
      },
    ],
  },
  {
    id: 'salt-mars',
    label: 'Salt and Mars',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'halite',
        kind: 'image',
        src: asset('images/halite-trona.jpg'),
        alt: 'Halite crystals on trona',
        fit: 'contain',
      },
      {
        id: 'mars',
        kind: 'image',
        src: asset('images/mars-analog.jpg'),
        alt: 'Mars-analog evaporite with microbial texture',
        fit: 'contain',
      },
    ],
    scene: [
      {
        id: 'entomb',
        label: 'Shelter',
        title: 'Why entomb yourself\nin mineral at all?',
        layers: ['halite'],
        notes:
          'There’s a reason biology keeps doing this, at every scale we’ve just walked through. Halophilic organisms don’t just tolerate salt — they use it. Mineral encasement, salt-crystal fluid inclusions, layered carbonate mats: all of it functions as protection, a way to survive conditions that would otherwise be lethal. A stromatolite, looked at this way, isn’t just a record. It’s a shelter its builders kept constructing.',
      },
      {
        id: 'elsewhere',
        label: 'Mars',
        kicker: 'Astrobiology',
        title: 'If salt is a shelter here,\nask where else.',
        layers: ['mars'],
        notes:
          'If mineral encasement is a survival strategy on this planet, it doesn’t stay confined to this planet. Mars-analog evaporites. Halophile carotenoid biosignatures. The same shelter-building strategy, looked for somewhere no one’s confirmed biology ever existed at all.',
      },
    ],
  },
  {
    id: 'pattern',
    label: 'The pattern',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    scene: [
      {
        id: 'signature',
        label: 'Signature',
        title: 'The same signature.\nThree scales apart.',
        notes:
          'Hinge of the talk. A kidney stone’s biofilm layers, a stromatolite’s laminae, a halophile’s salt-crystal shelter, a Mars-analog evaporite’s texture — not four unrelated curiosities, but one recurring strategy, read at scales from a human body to a planet nobody’s stood on. No single specimen could show that pattern. It only became visible because the specimens existed together, waiting to be read against each other. Then step back.',
      },
    ],
  },
  {
    id: 'treasure',
    label: 'Treasure',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    scene: [
      {
        id: 'rare-beautiful-functional',
        label: 'Rare, beautiful, functional',
        title: 'Rare. Beautiful. Functional.',
        subtitle: 'A treasure holds all three.',
        notes:
          'Step back. Rare alone is just scarcity. Beautiful alone is decoration. Functional alone is utility. A treasure is what happens when one specimen holds all three at once — and every specimen in the last twenty minutes earned that word without me saying it. The zeolite. The rowleyite. The biofilm inside a kidney stone. Same pattern, every time.',
      },
    ],
  },
  {
    id: 'story',
    label: 'Story',
    chapter: 'research',
    layout: 'stage',
    clearPlate: true,
    scene: [
      {
        id: 'what-a-mineral-holds',
        label: 'What a mineral holds',
        title: 'A Picasso is a story.',
        subtitle: 'So is a mineral.',
        notes:
          'Any real work of art is never just an object to look at — it’s a story, about a place and time, or about what was happening inside the person who made it. A mineral holds a story too. Not a metaphor. Literal information: how it formed, when, what changed around it while it grew. Beauty is one way to read that story. It was never the only one.',
      },
    ],
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
      'Research infrastructure is the half of the mission the public doesn’t see. Exhibition is the half they do. Same acquisition logic, different audience, same story, read differently. Name Unearthed.',
  },
  {
    id: 'unearthed',
    label: 'Unearthed',
    chapter: 'exhibition',
    layout: 'bleed',
    camera: 'rack',
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
    camera: 'pull',
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
    camera: 'pan-left',
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
    camera: 'push',
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
    camera: 'pan-right',
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
    camera: 'push',
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
