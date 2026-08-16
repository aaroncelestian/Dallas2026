export type Vec3 = [number, number, number]

export type CrystalPhase = 'k' | 'h-point' | 'exchange' | 'locked'

export type Hydroxyl = {
  id: string
  oxygen: Vec3
  point: Vec3
  bend: Vec3
  out: Vec3
}

export type Potassium = {
  id: number
  pos: Vec3
}

type Atom = {
  id: number
  element: string
  x: number
  y: number
  z: number
}

const OH = 0.97
const KO_CUTOFF = 3.15
const BEND = 1.28
const LEAVE = 2.15

function v(x: number, y: number, z: number): Vec3 {
  return [x, y, z]
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function len(a: Vec3) {
  return Math.hypot(a[0], a[1], a[2])
}

function nrm(a: Vec3): Vec3 {
  const d = len(a) || 1
  return scale(a, 1 / d)
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function rotate(dir: Vec3, axisHint: Vec3, angle: number): Vec3 {
  let axis = cross(dir, axisHint)
  if (len(axis) < 1e-5) axis = cross(dir, [0, 1, 0])
  if (len(axis) < 1e-5) axis = cross(dir, [1, 0, 0])
  axis = nrm(axis)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const d = nrm(dir)
  // Rodrigues
  const kxd = cross(axis, d)
  const kdot = axis[0] * d[0] + axis[1] * d[1] + axis[2] * d[2]
  return nrm([
    d[0] * c + kxd[0] * s + axis[0] * kdot * (1 - c),
    d[1] * c + kxd[1] * s + axis[1] * kdot * (1 - c),
    d[2] * c + kxd[2] * s + axis[2] * kdot * (1 - c),
  ])
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export function phaseForBeat(id?: string): CrystalPhase {
  if (id === 'protons') return 'h-point'
  if (id === 'lock') return 'exchange'
  if (id === 'patients') return 'locked'
  return 'k'
}

export function buildExchangeSites(atoms: Atom[]) {
  const potassium: Potassium[] = atoms
    .filter((atom) => atom.element === 'K')
    .map((atom) => ({ id: atom.id, pos: v(atom.x, atom.y, atom.z) }))
  const oxygens = atoms.filter((atom) => atom.element === 'O')
  const hydroxyls: Hydroxyl[] = []

  for (const k of potassium) {
    const coordinated = oxygens
      .map((o) => ({ o, d: Math.hypot(o.x - k.pos[0], o.y - k.pos[1], o.z - k.pos[2]) }))
      .filter((row) => row.d > 0.5 && row.d < KO_CUTOFF)
      .sort((a, b) => a.d - b.d)
    const near = coordinated.slice(0, Math.round(coordinated.length * 0.5))

    for (const { o } of near) {
      const oxygen = v(o.x, o.y, o.z)
      const towardK = nrm(sub(k.pos, oxygen))
      const radial = nrm(oxygen)
      const bent = rotate(towardK, radial, BEND)
      const leaving = nrm(add(rotate(towardK, radial, LEAVE), scale(towardK, -0.35)))
      hydroxyls.push({
        id: `${k.id}-${o.id}`,
        oxygen,
        point: add(oxygen, scale(towardK, OH)),
        bend: add(oxygen, scale(bent, OH)),
        out: add(oxygen, scale(leaving, 2.35)),
      })
    }
  }

  return { potassium, hydroxyls }
}

export type ExchangeAnim = {
  hMix: number
  hOp: number
  kOp: number
  kLock: number
  cellScale: number
  cellGlow: number
}

export const CELL_OPEN = 1
export const CELL_SHRUNK = 0.82
const CELL_CLAMP = 0.76

function shrinkScale(t: number) {
  const s = smooth(t)
  if (s < 0.72) return CELL_OPEN - (CELL_OPEN - CELL_CLAMP) * smooth(s / 0.72)
  return CELL_CLAMP + (CELL_SHRUNK - CELL_CLAMP) * smooth((s - 0.72) / 0.28)
}

function openScale(t: number) {
  const s = smooth(t)
  if (s < 0.78) return CELL_SHRUNK + (1.04 - CELL_SHRUNK) * smooth(s / 0.78)
  return 1.04 - 0.04 * smooth((s - 0.78) / 0.22)
}

export function sampleHEntry(progress: number): ExchangeAnim {
  const p = Math.max(0, Math.min(1, progress))
  const t = smooth(p)
  return {
    hMix: 0,
    hOp: t,
    kOp: 1 - 0.86 * t,
    kLock: 0,
    cellScale: shrinkScale(p),
    cellGlow: t,
  }
}

export function sampleExchange(progress: number): ExchangeAnim {
  const p = Math.max(0, Math.min(1, progress))
  const hT = smooth(p / 0.84)
  let hMix = 0
  let hOp = 1
  if (hT < 0.14) {
    hMix = 0
  } else if (hT < 0.64) {
    hMix = smooth((hT - 0.14) / 0.5)
  } else {
    const u = smooth((hT - 0.64) / 0.36)
    hMix = 1 + u
    hOp = 1 - u
  }
  const opening = smooth((p - 0.46) / 0.42)
  return {
    hMix,
    hOp,
    kOp: smooth((p - 0.48) / 0.32),
    kLock: smooth((p - 0.78) / 0.22),
    cellScale: openScale(opening),
    cellGlow: 1 - opening,
  }
}

export function hydroxylAt(site: Hydroxyl, hMix: number): Vec3 {
  if (hMix <= 1) return lerp3(site.point, site.bend, hMix)
  return lerp3(site.bend, site.out, hMix - 1)
}
