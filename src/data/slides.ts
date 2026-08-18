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
  | 'lithium-cycle'
  | 'prep-modes'

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
  | 'zoom-pan'
  | 'pan-bounce'
  | 'hold'

export type SceneLayerKind = 'image' | 'motif' | 'video' | 'slideshow'

export interface SceneSlide {
  src: string
  alt: string
  /** Float on the stage. No edge bleed. */
  cutout?: boolean
}

export interface SceneLayer {
  id: string
  kind: SceneLayerKind
  src?: string
  poster?: string
  alt?: string
  fit?: 'cover' | 'contain'
  camera?: CameraKind
  motif?: MotifKind
  slides?: SceneSlide[]
  /** First plate hold, then each later plate. */
  dwellMs?: [number, number]
  /** Seconds. Play once, then hold this frame. */
  holdAt?: number
  /** Pause the video at these times; advance resumes to the next hold. */
  holds?: VideoHold[]
  scaleBar?: ScaleBar
  marks?: SpecimenCallout[]
}

export type VideoMarkKind = 'mineral' | 'biomass' | 'onion'

export interface VideoMark {
  id: string
  x: number
  y: number
  kind: VideoMarkKind
  title: string
  body?: string
  side?: 'left' | 'right'
  /** Ellipse radii, normalized to the video frame. Onion marks. */
  rx?: number
  ry?: number
  rings?: number
}

export interface VideoHold {
  at: number
  marks?: VideoMark[]
}

export interface ScaleBar {
  mm: number
  /** Bar length as a fraction of the video width. */
  width: number
}

export interface SpecimenCallout {
  id: string
  x: number
  y: number
  side?: 'left' | 'right'
  title: string
  formula?: string
  body?: string
  /** Smaller Spanish line under the English label. */
  es?: string
  /** Vertical label position on the plate (0–1). Skips edge stacking. */
  ly?: number
  /** Degrees. For the overload beat. */
  tilt?: number
  /** Extra gutter inset toward the specimen, in rem. */
  inset?: number
}

export interface SceneBeat {
  id: string
  label: string
  kicker?: string
  title?: string
  subtitle?: string
  layers?: string[]
  guests?: boolean
  /** Callout ids from the visible image layer. */
  callouts?: string[]
  /** Seconds to wait before callouts appear. */
  calloutDelay?: number
  /** Seconds for those callouts to fade in. */
  calloutFade?: number
  bullets?: string[]
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
    /** High-res plate used for the zoomed-in hold, then faded as the full image pulls back. */
    detail?: string
    /** Where `detail` sits on the full image. Defaults to `focus`. */
    detailFocus?: { x: number; y: number; w: number; h: number }
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
      'Just look at this for a moment. I\'m not going to name it yet. This is the whole talk in one object — something kept because it was extraordinary, not because anyone knew what it would later be asked to do.',
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
      'Exhibitions and the mission of a natural history museum. The thesis isn\'t on the wall yet — it\'s this: every acquisition is a bet on future analytical capacity, and on how the public learns to see.',
  },
  {
    id: 'question',
    label: 'The question',
    chapter: 'open',
    layout: 'void',
    camera: 'drift',
    title: 'Every acquisition is a bet\nyou can’t price yet.',
    exitHold: 1,
    enterBlack: true,
    copySnap: true,
    notes:
      'Every acquisition is a bet you can\'t price yet. Is this for research, or for public display? Don\'t answer that yet. I\'m going to give you two answers tonight — and they\'ll turn out to be the same answer.',
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
      'We\'ll walk it once through research, and once through exhibition. Both answers converge. But first, 1620.',
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
      'This came out of a papal cabinet. It was acquired for curiosity, for princely display, for natural philosophy. Later it was asked to answer under instruments nobody in 1620 could have imagined. A specimen\'s use is not fixed at acquisition. That\'s the talk in miniature.',
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
      detailFocus: { x: 0.140009, y: 0.174991, w: 0.719983, h: 0.519979 },
      marks: [
        {
          label: 'Agate',
          x: 0.462,
          y: 0.244,
          w: 0.105,
          h: 0.048,
          src: asset('images/cabinet-agate.png'),
          tint: '#d47848',
        },
        {
          label: 'Amethyst',
          x: 0.448,
          y: 0.328,
          w: 0.132,
          h: 0.036,
          src: asset('images/cabinet-amethyst.png'),
          tint: '#9a4a8c',
        },
        {
          label: 'Travertine',
          x: 0.24,
          y: 0.422,
          w: 0.12,
          h: 0.014,
          src: asset('images/cabinet-travertine.png'),
          tint: '#d8c4a4',
        },
        {
          label: 'Lapis',
          x: 0.492,
          y: 0.614,
          w: 0.044,
          h: 0.020,
          src: asset('images/cabinet-lapis.png'),
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
      'For a moment, just look at the doorway. Don\'t call it a cabinet yet. Let it feel like a temple threshold — something larger than furniture. As we pull back, it becomes a cabinet. The stones light up: agate, amethyst, travertine, lapis. And then the facts arrive — papal commission, the materials themselves, moganite dating the agate, two populations from two source rocks. What we keep opens onto more than we knew.',
  },

  // ── Act I ─────────────────────────────────────────────
  {
    id: 'act1',
    label: 'Act I',
    chapter: 'research',
    layout: 'divider',
    ghostNum: '01',
    title: 'Acquired for one reason.\nPaid off for another.',
    notes:
      'A handful of specimens. Centuries of waiting, in aggregate. Each one acquired for a reason that had nothing to do with its eventual payoff — and one recurring signature that shows up in more of them than you\'d expect.',
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
      {
        id: 'cycle',
        kind: 'motif',
        motif: 'lithium-cycle',
      },
    ],
    scene: [
      {
        id: 'property',
        label: 'The property',
        kicker: 'Resource security',
        title: 'Not the mineral.\nThe property.',
        layers: ['spinel'],
        notes:
          'Look at this spinel. This is not lithium ore. Nobody accessioned it as a battery plant. Natural structures already know how to host a small cation, how to be selective, how to let something in and hold it. Sometimes we never put the specimen in the reactor. We take the property and build with it. That inspiration is the point of this story.',
      },
      {
        id: 'brine',
        label: 'Brine',
        kicker: 'Resource security',
        title: 'Desalination already\nconcentrated the brine.',
        layers: ['cycle'],
        notes:
          'The plant already did the hard work. Reject brine, just sitting there. This is not a new evaporative pond. Not a new pit in the Atacama. The lithium is in a liquid we already make. That double helix on the rail is DNA — the Materials Genome. It pays off at the spinel.',
      },
      {
        id: 'absorb',
        label: 'Absorb',
        kicker: 'Resource security',
        title: 'The spinel takes\nthe lithium.',
        layers: ['cycle'],
        notes:
          'HMn₂O₄ — the protonated manganese spinel. Size-selective uptake. Lithium fits. The bigger cations in seawater do not. Watch it move in. We used the property, not the specimen. That helix is the Materials Genome Project — that\'s how we made this spinel, and made it better than anything else out there.',
      },
      {
        id: 'air',
        label: 'Air',
        kicker: 'Resource security',
        title: 'The acid comes\nfrom the air.',
        layers: ['cycle'],
        notes:
          'CO₂ out of the atmosphere, turned into carbonic acid. That\'s the wash. No mined acid. No roast. The air does the stripping.',
      },
      {
        id: 'product',
        label: 'Li₂CO₃',
        kicker: 'Resource security',
        title: 'Li₂CO₃\nReady for a battery.',
        layers: ['cycle'],
        notes:
          'And the wash is also the product. Lithium carbonate — the feedstock battery plants already know how to use. Loop closed.',
      },
      {
        id: 'award',
        label: 'R&D 100',
        kicker: 'Resource security',
        title: 'An R&D 100.',
        subtitle: 'Innovation award.',
        layers: ['cycle'],
        notes:
          'R&D World. Global competition. This is the stamp that a mineral-inspired process left the cabinet and entered a live supply-chain conversation. The prize isn\'t the point for this room. The point is that a museum was on the team because someone had spent years watching how natural structures already solve the problem.',
      },
      {
        id: 'recycle',
        label: 'Recycle',
        kicker: 'Resource security',
        title: 'The spinel comes back.',
        layers: ['cycle'],
        notes:
          'One hundred percent recyclable. That dashed line is the return — after the CO₂ wash, the empty spinel goes back to the brine. This is the circle we just rode. The loop will keep running. And that same structural selectivity doesn\'t stop at extraction.',
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
          'That same structural selectivity doesn\'t stop at extraction. It goes into medicine too. The collector logic here was pure taxonomic curiosity — not medicine. Some of you may already know the species-description story. I won\'t retell it.',
      },
      {
        id: 'voids',
        label: 'Void space',
        kicker: 'Channel architecture',
        title: 'The architecture\nis empty space.',
        layers: ['voids'],
        notes:
          'I\'m not going to draw the atoms. The framework is vanadium and phosphate. What the structure actually offers is the hole — cages and a connected channel network. That empty space is what made it more than a new species.',
      },
      {
        id: 'cargo',
        label: 'Cargo',
        kicker: 'Host–guest',
        title: 'Doxorubicin. Vincristine.\nCisplatin. Temozolomide.',
        layers: ['voids'],
        guests: true,
        notes:
          'Four chemotherapeutics sitting in openings on the near face of the cell. The cages are large enough. I\'m not overclaiming a calculated pose — this is the picture of the idea: the hole is the useful part.',
      },
      {
        id: 'lead',
        label: 'Design template',
        title: 'Rowleyite · Design template',
        subtitle: 'The channel became the blueprint, not the drug.',
        layers: ['voids'],
        guests: true,
        notes:
          'A vanadium-bearing framework. Cytotoxic selectivity. Controlled-release potential. The cargo is still on the wall. That channel architecture is what informed targeted oncology. And the delay between "new species" and "drug-design lead" — that\'s the point.',
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
        alt: 'Porous mineral specimen, stellarite',
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
        label: 'Porous mineral',
        kicker: 'Channel structure',
        title: 'Nobody bought this\nas medicine.',
        layers: ['zeolite'],
        notes:
          'This was acquired for channel structure and aesthetic rarity. Nobody acquired this as medical research. The specimen is the class, not the drug. The names that matter are next.',
      },
      {
        id: 'precedents',
        label: 'Precedents',
        kicker: 'Porous mineral → Lokelma',
        title: 'Georgechaoite.\nUmbite.\nSitinakite.',
        layers: ['zeolite'],
        notes:
          'These are the minerals that taught the pore. Georgechaoite and umbite — the natural zirconosilicates, with sodium and potassium sitting in a zirconium–silicon channel. Sitinakite is the titanosilicate cousin. Lokelma is the synthetic that left the cabinet. The names are the lineage.',
      },
      {
        id: 'gut',
        label: 'Gut',
        kicker: 'Porous mineral → Lokelma',
        title: 'Not blood.\nNot kidney.\nGut.',
        layers: ['structure'],
        notes:
          'One channel-selective mineral is still years from a patient. Another already is one. And here\'s what people often get wrong: Lokelma doesn\'t circulate in the blood, and it doesn\'t act on the kidney. It\'s non-absorbed — it never leaves the gut.',
      },
      {
        id: 'pore',
        label: 'Pore',
        kicker: 'Porous mineral → Lokelma',
        title: 'A ~3 Å pore, built to\nmimic a K⁺ channel.',
        layers: ['structure'],
        notes:
          'Watch the potassium fade first — then the three-angstrom window. The crystal lattice opens a pore about three angstroms wide, engineered to mimic the selectivity of the body\'s own potassium channels. Extremely selective over sodium, calcium, magnesium. It captures potassium as food moves through the intestine, before the kidney would ever have to clear it. Deployed exactly where the kidney isn\'t — because the kidney is the organ that\'s failing.',
      },
      {
        id: 'protons',
        label: 'Protons',
        kicker: 'Porous mineral → Lokelma',
        title: 'Protons point\nat the empty site.',
        layers: ['structure'],
        notes:
          'Strip the potassium. Hydrogens sit on the ring oxygens, pointing into the channel — toward the site potassium wants. Watch the cell contract. The framework is doing the work, not a soak.',
      },
      {
        id: 'lock',
        label: 'Lock',
        kicker: 'Porous mineral → Lokelma',
        title: 'They bend.\nThey leave.\nK stays.',
        layers: ['structure'],
        notes:
          'The protons reorient, then exchange out. The cell opens as potassium occupies the seven-ring, and the window closes behind it. Size-selective capture — not a reversible soak.',
      },
      {
        id: 'patients',
        label: '3 million',
        kicker: 'Porous mineral → Lokelma',
        title: 'Size-selective exchange\nbecomes a drug.',
        subtitle: '3 million patients.',
        layers: ['structure'],
        notes:
          'Three million patients. That\'s already on the wall. Let it sit.',
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
        fit: 'contain',
        holds: [
          {
            at: 10.92,
            marks: [
              {
                id: 'mark-msxplade',
                x: 0.366,
                y: 0.42,
                kind: 'biomass',
                side: 'left',
                title: 'Weak / no layering.',
              },
              {
                id: 'mark-msxplsfc',
                x: 0.579,
                y: 0.466,
                kind: 'mineral',
                side: 'right',
                title: 'Strong layering.',
              },
              {
                id: 'mark-msxpmyi8',
                x: 0.537,
                y: 0.36,
                kind: 'onion',
                side: 'right',
                title: 'Alternating layers',
                body: 'Caused by bacteria inhibiting large crystal growth.',
                rx: 0.04,
                ry: 0.065,
                rings: 3,
              },
            ],
          },
          {
            at: 17.87,
            marks: [
              {
                id: 'mark-msxpvyza',
                x: 0.342,
                y: 0.51,
                kind: 'onion',
                side: 'left',
                title: 'Nucleation center',
                body: 'Stones can coalesce.',
                rx: 0.085,
                ry: 0.12,
                rings: 4,
              },
              {
                id: 'mark-msxpxj9o',
                x: 0.515,
                y: 0.255,
                kind: 'onion',
                side: 'right',
                title: 'Possible second stone',
                rx: 0.055,
                ry: 0.075,
                rings: 3,
              },
            ],
          },
          {
            at: 38.23,
            marks: [
              {
                id: 'mark-msxpsd6s',
                x: 0.647,
                y: 0.424,
                kind: 'mineral',
                side: 'right',
                title: 'Layering gets stronger',
                body: 'The outer edges of the stone shows more intense layering structures.',
              },
            ],
          },
        ],
      },
      {
        id: 'stromatolite',
        kind: 'image',
        src: asset('images/stromatolite.jpg'),
        alt: 'Stromatolite thin section, blue epoxy in the pores',
        fit: 'cover',
        camera: 'zoom-pan',
      },
      {
        id: 'biofilm',
        kind: 'slideshow',
        src: asset('images/stone-biofilm.jpg'),
        alt: 'SEM of intercalated bacterial biofilm inside a calcium stone',
        fit: 'contain',
        dwellMs: [14000, 9000],
        slides: [
          {
            src: asset('images/stone-biofilm.jpg'),
            alt: 'SEM of a bacterial colony and biofilm inside a calcium stone',
          },
          {
            src: asset('images/stone-voids.jpg'),
            alt: 'SEM of bacteria sitting in the mineral voids of a calcium stone',
          },
        ],
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
          'The kidney\'s own mineral chemistry is a different story. Not compensation from outside — a mineral forming inside the kidney\'s own machinery. The oldest assumption about the most common kidney stone, calcium oxalate, is that it\'s purely abiotic.',
      },
      {
        id: 'inside',
        label: 'CT volume',
        title: 'It has an inside.',
        layers: ['ct'],
        notes:
          'The volume starts moving. The color is the argument. Blue is strong layering — high-density scattering. Red is weak or no layering. The scale is already on the frame; those axis numbers are millimeters. Look — the blue is not a smear. Discrete layered sites, scattered through the volume. And then the onion: concentric layers. That architecture is the point. Then the life.',
      },
      {
        id: 'biofilm',
        label: 'Biofilm',
        title: 'It doesn’t build alone.',
        layers: ['biofilm'],
        notes:
          'That\'s the life, at twenty-five hundred times — a biofilm, not a smear. And then the same life sitting in the mineral, in the voids. High-resolution electron imaging and synchrotron XRD show bacterial biofilms structurally intercalated through the internal architecture, in layers, in patients with no diagnosed infection at all. Schmidt and colleagues, PNAS 2026. Kidney stone disease is partly microbial in origin.',
      },
      {
        id: 'layers',
        label: 'Layers',
        title: 'Layers, again.',
        layers: ['stromatolite'],
        notes:
          'You just saw the life in those layers. That architecture should look familiar to anyone who\'s cut open a stromatolite. The blue here is epoxy in the pores, not the mineral. Different mineral — calcium carbonate instead of calcium oxalate — but the same open question: is the layering evidence of a microbial mat building upward, one generation at a time? We don\'t yet know that a kidney stone and a stromatolite form by the identical mechanism. What we do know is that both are laminated structures where biology appears to be templating mineral growth in sequence — not just contaminating it once.',
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
        alt: 'Halobacterium on Mars: Isidis basin, hopper salt, fluid inclusions. Watercolor, B.D. 2017',
        fit: 'cover',
        camera: 'pan-bounce',
      },
    ],
    scene: [
      {
        id: 'entomb',
        label: 'Shelter',
        title: 'Why entomb yourself\nin mineral at all?',
        layers: ['halite'],
        notes:
          'There\'s a reason biology keeps doing this, at every scale we\'ve just walked through. Halophilic organisms don\'t just tolerate salt — they use it. Mineral encasement, salt-crystal fluid inclusions, layered carbonate mats: all of it functions as protection, a way to survive conditions that would otherwise be lethal. A stromatolite, looked at this way, isn\'t just a record. It\'s a shelter its builders kept constructing.',
      },
      {
        id: 'elsewhere',
        label: 'Mars',
        kicker: 'Astrobiology',
        title: 'If salt is a shelter here,\nask where else.',
        layers: ['mars'],
        notes:
          'Look at this plate. Microbes. Isidis. Hopper crystals. Inclusions. If mineral encasement is a survival strategy on this planet, it doesn\'t stay confined to this planet. Mars-analog evaporites. Halophile carotenoid biosignatures. The same shelter-building strategy — looked for somewhere no one\'s confirmed biology ever existed at all.',
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
          'This is the hinge of the talk. A kidney stone\'s biofilm layers, a stromatolite\'s laminae, a halophile\'s salt-crystal shelter, a Mars-analog evaporite\'s texture — not four unrelated curiosities, but one recurring strategy, read at scales from a human body to a planet nobody\'s stood on. No single specimen could show that pattern. It only became visible because the specimens existed together, waiting to be read against each other.',
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
          'Step back for a moment. Rare alone is just scarcity. Beautiful alone is decoration. Functional alone is utility. A treasure is what happens when one specimen holds all three at once — and every specimen in the last twenty minutes earned that word without me saying it. The spinel that taught a sorbent. The porous mineral. The rowleyite. The biofilm inside a kidney stone. Same pattern, every time.',
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
        title: 'Every specimen is a record.',
        subtitle: 'Beauty is one way to read it.',
        notes:
          'Any real work of art is never just an object to look at — it\'s a story, about a place and time, or about what was happening inside the person who made it. A specimen holds a story too. Not a metaphor. Literal information: how it formed, when, what changed around it while it grew. Beauty is one way to read that story. It was never the only one.',
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
      'Research infrastructure is the half of the mission the public doesn\'t see. Exhibition is the half they do. Same acquisition logic, different audience, same story — read differently. Which brings us to Unearthed.',
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
      'Crystallized minerals as finished aesthetic objects — not illustrations of a principle, not raw material for lapidary. No pairing against human-made art. Further than Rare Earth at the Crow Museum here in Dallas, and further than Santa Barbara.',
  },
  {
    id: 'criteria',
    label: 'Blue Cap',
    chapter: 'exhibition',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'bluecap',
        kind: 'image',
        src: asset('images/bluecap.jpg'),
        alt: 'Blue Cap tourmaline on quartz, Tourmaline Queen mine, Carnegie collection',
        fit: 'contain',
        camera: 'hold',
        marks: [
          {
            id: 'termination',
            x: 0.36,
            y: 0.198,
            side: 'right',
            title: 'Complete termination.',
            body: 'Uninterrupted growth history.',
          },
          {
            id: 'cap',
            x: 0.36,
            y: 0.218,
            side: 'right',
            title: 'Fe in the last pulse.',
            formula: 'Na(Li,Al,Fe²⁺)₃Al₆(BO₃)₃Si₆O₁₈(OH)₄',
            body: 'Mn-pink body → Fe-blue cap. Same crystal, one fluid change.',
          },
          {
            id: 'body',
            x: 0.344,
            y: 0.38,
            side: 'left',
            title: 'Mn³⁺.',
            body: 'The color collectors pay for is the chromophore.',
          },
          {
            id: 'pocket',
            x: 0.59,
            y: 0.55,
            side: 'right',
            title: 'Tourmaline Queen, 1972.',
            body: 'One pocket. Never again.',
          },
          {
            id: 'cap-trim',
            x: 0.36,
            y: 0.218,
            side: 'right',
            title: 'Iron–titanium in the last pulse.',
            body: 'The blue variety is indicolite.',
            es: 'Hierro–titanio en el último pulso. La variedad azul es indicolita.',
          },
          {
            id: 'body-trim',
            x: 0.344,
            y: 0.38,
            side: 'left',
            title: 'Manganese makes the pink.',
            body: 'The variety is rubellite.',
            es: 'El manganeso da el rosa. La variedad es rubelita.',
          },
          {
            id: 'pocket-trim',
            x: 0.59,
            y: 0.55,
            side: 'right',
            title: 'Tourmaline Queen mine, 1972.',
            body: 'One pocket. Never again.',
            es: 'Mina Tourmaline Queen, 1972. Una sola bolsa. Nunca más.',
          },
          {
            id: 'carnegie',
            x: 0.40,
            y: 0.58,
            side: 'left',
            title: 'ex. Andrew Carnegie collection.',
            es: 'ex. colección Andrew Carnegie.',
          },
          {
            id: 'dump-elbaite',
            x: 0.338,
            y: 0.52,
            side: 'left',
            ly: 0.64,
            tilt: -5,
            inset: 0.4,
            title: 'Elbaite, var. rubellite.',
            body: 'Schorl at the base.',
          },
          {
            id: 'dump-carnegie',
            x: 0.42,
            y: 0.64,
            side: 'left',
            ly: 0.8,
            tilt: 3,
            inset: 1.8,
            title: 'Andrew Carnegie collection.',
          },
          {
            id: 'dump-growth',
            x: 0.36,
            y: 0.198,
            side: 'left',
            ly: 0.1,
            tilt: -4,
            title: 'Uninterrupted growth history.',
          },
          {
            id: 'dump-formula',
            x: 0.35,
            y: 0.3,
            side: 'right',
            ly: 0.34,
            tilt: 2,
            inset: 0.9,
            title: 'Elbaite.',
            formula: 'Na(Li,Al,Fe²⁺)₃Al₆(BO₃)₃Si₆O₁₈(OH)₄',
          },
          {
            id: 'dump-schorl',
            x: 0.332,
            y: 0.48,
            side: 'left',
            ly: 0.46,
            tilt: 5,
            inset: 2.2,
            title: 'Schorl → elbaite.',
            body: 'Early Fe-rich growth gives way to Li-Mn enrichment.',
          },
          {
            id: 'dump-mn',
            x: 0.344,
            y: 0.38,
            side: 'right',
            ly: 0.5,
            tilt: -3,
            inset: 2.4,
            title: 'Mn³⁺ chromophore.',
            body: 'The pink.',
          },
          {
            id: 'dump-fe',
            x: 0.36,
            y: 0.218,
            side: 'right',
            ly: 0.12,
            tilt: 4,
            inset: 0.3,
            title: 'Fe²⁺–Ti⁴⁺ charge transfer.',
            body: 'The blue cap.',
          },
          {
            id: 'dump-feedstock',
            x: 0.38,
            y: 0.36,
            side: 'right',
            ly: 0.68,
            tilt: -5,
            inset: 1.5,
            title: 'Tourmaline sculpting its own feedstock.',
            body: 'Of elements as it grows.',
          },
          {
            id: 'dump-trigonal',
            x: 0.35,
            y: 0.28,
            side: 'right',
            ly: 0.22,
            tilt: -2,
            inset: 1.1,
            title: 'Trigonal, space group R3m.',
            body: 'Crystal system.',
          },
          {
            id: 'dump-pedion',
            x: 0.36,
            y: 0.198,
            side: 'right',
            ly: 0.02,
            tilt: 3,
            inset: 1.7,
            title: 'c-axis termination, pedion face.',
            body: 'Crystallographic form.',
          },
          {
            id: 'dump-piezo',
            x: 0.35,
            y: 0.25,
            side: 'left',
            ly: 0.22,
            tilt: 4,
            inset: 0.8,
            title: 'Piezoelectric along c.',
            body: 'Physical property tourmaline is famous for.',
          },
          {
            id: 'dump-striated',
            x: 0.338,
            y: 0.42,
            side: 'left',
            ly: 0.32,
            tilt: -6,
            inset: 1.3,
            title: 'Striated prism faces.',
            body: 'Growth texture visible on the crystal.',
          },
          {
            id: 'dump-lct',
            x: 0.5,
            y: 0.62,
            side: 'right',
            ly: 0.84,
            tilt: 2,
            inset: 0.6,
            title: 'Pegmatite, LCT family.',
            body: 'Host rock type (Li-Cs-Ta pegmatite).',
          },
          {
            id: 'dump-miarolitic',
            x: 0.59,
            y: 0.55,
            side: 'right',
            ly: 0.92,
            tilt: -3,
            inset: 1.2,
            title: 'Miarolitic cavity.',
            body: 'The pocket type this grew in.',
          },
          {
            id: 'dump-fractionation',
            x: 0.36,
            y: 0.3,
            side: 'left',
            ly: 0.54,
            tilt: 5,
            inset: 2,
            title: 'Late-stage fluid fractionation.',
            body: 'Why zoning happens at all.',
          },
          {
            id: 'dump-paragenesis',
            x: 0.48,
            y: 0.7,
            side: 'left',
            ly: 0.9,
            tilt: -2,
            inset: 0.5,
            title: 'Quartz core, tourmaline overgrowth.',
            body: 'Paragenetic sequence with the smoky quartz host.',
          },
          {
            id: 'dump-ri',
            x: 0.344,
            y: 0.38,
            side: 'right',
            ly: 0.42,
            tilt: 6,
            inset: 0.2,
            title: 'RI 1.624–1.644.',
            body: 'Refractive index range for rubellite.',
          },
          {
            id: 'dump-pleochroic',
            x: 0.344,
            y: 0.38,
            side: 'left',
            ly: 0.38,
            tilt: -4,
            inset: 2.6,
            title: 'Pleochroic: pink to pale pink.',
            body: 'Optical property.',
          },
          {
            id: 'dump-grade',
            x: 0.36,
            y: 0.32,
            side: 'right',
            ly: 0.76,
            tilt: 3,
            inset: 2,
            title: 'Not gem grade — specimen grade.',
            body: 'Distinguishes from cut-stone market.',
          },
        ],
      },
    ],
    scene: [
      {
        id: 'alone',
        label: 'Alone',
        layers: ['bluecap'],
        notes:
          'Don\'t name it yet. Unearthed\'s first instruction is still in force: the mineral stands alone. Just look.',
      },
      {
        id: 'termination',
        label: 'Termination',
        title: 'A perfect termination.',
        layers: ['bluecap'],
        callouts: ['termination'],
        notes:
          'Collectors pay for that termination. And it is also an uninterrupted growth history. Size, form, matrix — those stay in what we say, not on the wall.',
      },
      {
        id: 'cap',
        label: 'The cap',
        title: 'The cap is the data.',
        layers: ['bluecap'],
        callouts: ['termination', 'cap', 'body'],
        notes:
          'The manganese-to-iron shift is right there in the formulae. That indigo rind is why this piece is famous — and it\'s a chemical change written into the crystal. Then the pocket.',
      },
      {
        id: 'same',
        label: 'Unique locality',
        title: 'Unique locality.',
        layers: ['bluecap'],
        callouts: ['termination', 'cap', 'body', 'pocket'],
        notes:
          'Tourmaline Queen, 1972. One pocket. Never again. That is the locality — not a district, a single cavity. And now the wall is about to do too much.',
      },
      {
        id: 'less',
        label: 'Less is more',
        layers: ['bluecap'],
        callouts: [
          'termination',
          'cap',
          'body',
          'pocket',
          'dump-elbaite',
          'dump-carnegie',
          'dump-growth',
          'dump-formula',
          'dump-schorl',
          'dump-mn',
          'dump-fe',
          'dump-feedstock',
          'dump-trigonal',
          'dump-pedion',
          'dump-piezo',
          'dump-striated',
          'dump-lct',
          'dump-miarolitic',
          'dump-fractionation',
          'dump-paragenesis',
          'dump-ri',
          'dump-pleochroic',
          'dump-grade',
        ],
        notes:
          'Look at that. A display specimen does not get better because we laid the science on top of it. Less is more. The crystal is already pleasing. Keeping that simple is more inviting. So let\'s strip it back to what a visitor can actually take.',
      },
      {
        id: 'enough',
        label: 'Enough',
        layers: ['bluecap'],
        callouts: ['cap-trim', 'body-trim', 'pocket-trim', 'carnegie'],
        calloutDelay: 2,
        calloutFade: 2,
        notes:
          'This is enough. Indicolite, rubellite, one pocket, Carnegie. A visitor can take that and still look. Now the wave.',
      },
    ],
  },
  {
    id: 'blue-wave',
    label: 'Blue Wave',
    chapter: 'exhibition',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'wave',
        kind: 'image',
        src: asset('images/blue-wave.jpg'),
        alt: 'Blue Wave aragonite, Wenshan Mine, Yunnan — the real copper-blue',
        fit: 'contain',
        camera: 'hold',
      },
    ],
    scene: [
      {
        id: 'hold',
        label: 'The wave',
        layers: ['wave'],
        notes:
          'This is the real color. A wave that never moved — water, frozen by crystallization, still carrying the chemistry of the fluid that made it.',
      },
      {
        id: 'water',
        label: 'Water',
        title: 'Water is the sculptor.',
        layers: ['wave'],
        notes:
          'Aragonite precipitating from solution. Every ridge is a growth front, not a carving. The same power that built every specimen tonight, made visible as one gesture: water writing mineral, over and over, until a wave stood up and stayed.',
      },
      {
        id: 'color',
        label: 'The color',
        title: 'The color came\nwith the water.',
        layers: ['wave'],
        notes:
          'There\'s trace copper in the aragonite lattice — the fluid\'s chemistry, not a dye. Same transition-metal mechanism as malachite and azurite. Visitors will assume it\'s dyed. Don\'t lead with that. They\'ve already seen the form as water. Now the blue is what that water was carrying.',
      },
    ],
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
      'This Wuning stibnite pocket was preserved instead of ground for antimony. Crystallized gold is worth orders of magnitude above melt value — because it wasn\'t melted. Every exceptional specimen destroyed is an irretrievable loss. That\'s the infrastructure argument in reverse: preservation against economic pressure.',
  },
  {
    id: 'prep-spectrum',
    label: 'Preparation',
    chapter: 'exhibition',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'modes',
        kind: 'motif',
        motif: 'prep-modes',
      },
    ],
    scene: [
      {
        id: 'question',
        label: 'The question',
        kicker: 'Four modes',
        title: 'Where does geology end\nand intention begin?',
        layers: ['modes'],
        notes:
          'Unearthed holds the open question with four deliberate modes. Where does geology end and intention begin? I\'m not going to resolve that question. I\'m going to show you the spectrum.',
      },
      {
        id: 'teapot',
        label: 'Transformation',
        kicker: 'Total transformation',
        title: 'Geological material,\nfully remade.',
        layers: ['modes'],
        notes:
          'A citrine teapot — total transformation. The geological material is still there, but the object is no longer a specimen. Intention won.',
      },
      {
        id: 'chrysanthemum',
        label: 'Subtraction',
        kicker: 'Subtraction',
        title: 'Revealing rather\nthan reshaping.',
        layers: ['modes'],
        notes:
          'Chrysanthemum stone — subtraction. Almost nothing added. Matrix taken away so the flower can be read. Geology doing most of the work.',
      },
      {
        id: 'malachite',
        label: 'Architecture',
        kicker: 'Architecture exposed',
        title: 'Cut and polished.',
        layers: ['modes'],
        notes:
          'Malachite feet in azurite — architecture exposed, cut and polished. The mineral grew the rooms. Someone chose the section.',
      },
      {
        id: 'ammolite',
        label: 'Reconstruction',
        kicker: 'Interpretive reconstruction',
        title: 'Meaning added\nin light.',
        layers: ['modes'],
        notes:
          'An ammolite reconstruction, swimming. Interpretive reconstruction — the animal is inferred, then put back in motion. Still the open question. Still unresolved.',
      },
    ],
  },
  {
    id: 'provenance',
    label: 'The tattoo',
    chapter: 'exhibition',
    layout: 'bleed',
    camera: 'pan-left',
    kicker: 'Wushan Fluorite Mine\nDe’an · Wushan',
    title: 'The tattoo.',
    image: {
      src: asset('images/fluorite.jpg'),
      alt: 'Fluorite with calcite, documented locality',
      fit: 'contain',
    },
    yaw: -1,
    notes:
      'Call it the tattoo because Rob Lavinsky has this piece on his arm. Arkenstone. This symposium is his. But the mine name is the other tattoo — De’an, Wushan, not just “fluorite, China.” A mark you can go back to. Undocumented material can still be beautiful. It can never become infrastructure.',
  },
  {
    id: 'regional',
    label: 'Peninsular Ranges',
    chapter: 'exhibition',
    layout: 'stage',
    clearPlate: true,
    layers: [
      {
        id: 'ranges',
        kind: 'slideshow',
        fit: 'contain',
        dwellMs: [4000, 4000],
        slides: [
          {
            src: asset('images/tourmaline.jpg'),
            alt: 'Tourmaline, Himalaya Mine',
          },
          {
            src: asset('images/morganite-queen.jpg'),
            alt: 'Morganite, Queen mine, Pala',
          },
          {
            src: asset('images/king-mine.jpg'),
            alt: 'Tourmaline, King Mine, 2022, ex. Larson',
          },
          {
            src: asset('images/little-three.jpg'),
            alt: 'Spessartine and schorl, Little Three Mine, Ramona',
          },
          {
            src: asset('images/crevoshay-pendant.png'),
            alt: 'Paula Crevoshay pendant — San Diego tourmaline',
            cutout: true,
          },
        ],
      },
    ],
    scene: [
      {
        id: 'mines',
        label: 'The mines',
        kicker: 'Southern California',
        title: 'Himalaya, King, Stewart, more.',
        layers: ['ranges'],
        notes:
          'Peninsular Ranges pegmatites — Himalaya, King, Stewart, and more. Himalaya tourmaline. The Morganite Queen. King Mine, ex. Larson. Little Three. A Crevoshay pendant — wearable, not a ring. NHMLAC\'s collection is the largest public gathering of that material assembled to date. Regional color. Not a new argument.',
      },
    ],
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
      'What the museum “keeps” isn’t necessarily these objects — it’s the practice of bringing exceptional borrowed material to change how visitors see the permanent collection. A temporary exhibition is a lens, not a holding. Blue Wave leaves in 2027. The way of looking doesn’t.',
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
      'Research loans out',
      'Exhibit loans in',
    ],
    notes:
      'Each of these depends on the others. That\'s not a generic claim about museums — it\'s specific to what this institution is built to do. Act I could not run on a loan clock. Accession is the only path by which a collector\'s private judgment enters the centuries-long story we opened with.',
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
      'Provenance, rarity, structural intuition go in. Drugs, templates, biosignatures, and a changed permanent collection come out. Loans recruit attention. Ownership holds it. Complementary, not competitors.',
  },
  {
    id: 'bet',
    label: 'The bet',
    chapter: 'close',
    layout: 'void',
    title: 'Today’s specimen is\ntomorrow’s unanswered\nquestion.',
    notes:
      'Today\'s specimen is tomorrow\'s unanswered question — run on an instrument not yet built, or seen by a visitor who hasn\'t yet learned how to look. Strategic collecting is scientific and cultural infrastructure.',
  },
  {
    id: 'close',
    label: 'Close',
    chapter: 'close',
    layout: 'bleed',
    camera: 'push',
    title: 'A museum is a reflection\nof who cared enough\nto keep it.',
    enterDelay: 2,
    image: {
      src: asset('images/aquamarine.jpg'),
      alt: 'Aquamarine crystals in albite with schorl, Unearthed',
      fit: 'cover',
    },
    yaw: 1,
    notes:
      'A museum is a reflection of who cared enough to keep it. Unearthed closes April 2027. Nearly everything is on loan. That\'s not a weakness — it\'s the argument. What NHMLAC is betting on isn\'t these objects. It\'s you. A private collection can show you something extraordinary once. A public museum is making a longer bet: that showing you something extraordinary, even temporarily, changes what you notice in what\'s already, permanently, yours.',
  },
]
