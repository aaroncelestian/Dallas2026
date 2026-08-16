#!/usr/bin/env node
/**
 * Dock doxorubicin / vincristine into rowleyite cages near the +Z cell face
 * so the default camera looks into the opening.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const cifPath = join(root, 'original_images', 'supporting', 'rowleyite.cif')
const outPath = join(root, 'src', 'data', 'rowleyiteGuests.json')

const GRID = 52
const PROBE = 1.35
const RADII = { O: 1.32, V: 1.58, P: 1.48, As: 1.52 }
const GUEST_CLEAR = 0.55
const DISPLAY = {
  C: { color: '#e8d4c0', radius: 0.2 },
  N: { color: '#5b7ec7', radius: 0.19 },
  O: { color: '#e24b4b', radius: 0.18 },
}

const GUESTS = [
  {
    id: 'doxorubicin',
    file: 'doxorubicin_3D.pdb',
    carbon: '#f0c4a8',
    minClear: -0.35,
  },
  {
    id: 'vincristine',
    file: 'vincristine_3D.pdb',
    carbon: '#c5d8e6',
    minClear: -0.45,
  },
]

function parseNum(value) {
  return Number(String(value).replace(/\([^)]*\)/g, ''))
}

function parseLoop(text, requiredTag) {
  const chunks = text.split(/\bloop_/)
  for (const chunk of chunks) {
    const lines = chunk.split('\n')
    const tags = []
    let i = 0
    while (i < lines.length) {
      const t = lines[i].trim()
      if (t.startsWith('_')) {
        tags.push(t.split(/\s+/)[0])
        i++
        continue
      }
      if (t === '' || t.startsWith('#')) {
        i++
        continue
      }
      break
    }
    if (!tags.includes(requiredTag)) continue
    const rows = []
    for (; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('#') || line.startsWith('loop_')) break
      if (line.startsWith('_')) break
      const fields = []
      const re = /'([^']*)'|"([^"]*)"|(\S+)/g
      let m
      while ((m = re.exec(line))) fields.push(m[1] ?? m[2] ?? m[3])
      if (fields.length) rows.push(fields)
    }
    return { tags, rows }
  }
  throw new Error(`No CIF loop containing ${requiredTag}`)
}

function parseOps(text) {
  const tag = text.includes('_symmetry_equiv_pos_as_xyz')
    ? '_symmetry_equiv_pos_as_xyz'
    : '_space_group_symop_operation_xyz'
  const { tags, rows } = parseLoop(text, tag)
  const idx = tags.indexOf(tag)
  return rows.map((row) => row[idx].replace(/\s+/g, ''))
}

function parseAtoms(text) {
  const { tags, rows } = parseLoop(text, '_atom_site_label')
  const iLabel = tags.indexOf('_atom_site_label')
  const iX = tags.indexOf('_atom_site_fract_x')
  const iY = tags.indexOf('_atom_site_fract_y')
  const iZ = tags.indexOf('_atom_site_fract_z')
  const iType = tags.indexOf('_atom_site_type_symbol')
  return rows.map((row) => ({
    element: iType >= 0 ? row[iType] : row[iLabel].replace(/\d+/g, ''),
    x: parseNum(row[iX]),
    y: parseNum(row[iY]),
    z: parseNum(row[iZ]),
  }))
}

function evalCoord(expr, x, y, z) {
  const e = expr
    .toLowerCase()
    .replace(/(\d)\/(\d)/g, '($1/$2)')
    .replace(/x/g, `(${x})`)
    .replace(/y/g, `(${y})`)
    .replace(/z/g, `(${z})`)
  return Function(`"use strict"; return (${e});`)()
}

function applyOp(op, atom) {
  const parts = op.split(',')
  return {
    element: atom.element,
    x: evalCoord(parts[0], atom.x, atom.y, atom.z),
    y: evalCoord(parts[1], atom.x, atom.y, atom.z),
    z: evalCoord(parts[2], atom.x, atom.y, atom.z),
  }
}

function wrap01(v) {
  let r = v % 1
  if (r < 0) r += 1
  if (r > 0.9999) r = 0
  return r
}

function minImage(d, cell) {
  const half = cell * 0.5
  if (d > half) return d - cell
  if (d < -half) return d + cell
  return d
}

function parsePdb(path) {
  const text = readFileSync(path, 'utf8')
  const raw = []
  const conect = new Map()
  for (const line of text.split('\n')) {
    if (line.startsWith('HETATM') || line.startsWith('ATOM  ')) {
      const serial = Number(line.slice(6, 11))
      const element = (line.slice(76, 78).trim() || line.slice(12, 16).trim()[0]).toUpperCase()
      raw.push({
        serial,
        element,
        x: Number(line.slice(30, 38)),
        y: Number(line.slice(38, 46)),
        z: Number(line.slice(46, 54)),
      })
    } else if (line.startsWith('CONECT')) {
      const nums = line.slice(6).trim().split(/\s+/).map(Number)
      const from = nums[0]
      conect.set(from, [...(conect.get(from) ?? []), ...nums.slice(1)])
    }
  }
  const heavy = raw.filter((p) => p.element !== 'H')
  const bySerial = new Map(heavy.map((p, i) => [p.serial, i]))
  const bonds = []
  const seen = new Set()
  for (const [from, tos] of conect) {
    const i = bySerial.get(from)
    if (i == null) continue
    for (const to of tos) {
      const j = bySerial.get(to)
      if (j == null || i === j) continue
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key)) continue
      seen.add(key)
      bonds.push([i, j])
    }
  }
  const cx = heavy.reduce((s, p) => s + p.x, 0) / heavy.length
  const cy = heavy.reduce((s, p) => s + p.y, 0) / heavy.length
  const cz = heavy.reduce((s, p) => s + p.z, 0) / heavy.length
  const local = heavy.map((p) => ({
    element: p.element,
    x: p.x - cx,
    y: p.y - cy,
    z: p.z - cz,
  }))
  let maxR = 0
  for (const p of local) maxR = Math.max(maxR, Math.hypot(p.x, p.y, p.z))
  return { atoms: local, bonds, radius: maxR }
}

function rotMat(rx, ry, rz) {
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  return [
    cy * cz,
    sx * sy * cz - cx * sz,
    cx * sy * cz + sx * sz,
    cy * sz,
    sx * sy * sz + cx * cz,
    cx * sy * sz - sx * cz,
    -sy,
    sx * cy,
    cx * cy,
  ]
}

function applyRot(p, m) {
  return {
    element: p.element,
    x: m[0] * p.x + m[1] * p.y + m[2] * p.z,
    y: m[3] * p.x + m[4] * p.y + m[5] * p.z,
    z: m[6] * p.x + m[7] * p.y + m[8] * p.z,
  }
}

const cif = readFileSync(cifPath, 'utf8')
const a = parseNum(cif.match(/_cell_length_a\s+(\S+)/)?.[1] ?? '31.704')
const ops = parseOps(cif)
const asym = parseAtoms(cif)
const unit = new Map()
for (const atom of asym) {
  if (!(atom.element in RADII)) continue
  for (const op of ops) {
    const p = applyOp(op, atom)
    const w = { element: p.element, x: wrap01(p.x), y: wrap01(p.y), z: wrap01(p.z) }
    unit.set(`${w.x.toFixed(4)},${w.y.toFixed(4)},${w.z.toFixed(4)}`, w)
  }
}
const atoms = [...unit.values()].map((atom) => ({
  element: atom.element,
  x: atom.x * a,
  y: atom.y * a,
  z: atom.z * a,
  r: RADII[atom.element],
}))

const n = GRID
const field = new Float64Array((n + 1) ** 3)
function fIndex(i, j, k) {
  return (i * (n + 1) + j) * (n + 1) + k
}
function sdfExact(x, y, z) {
  let best = Infinity
  for (const atom of atoms) {
    const dx = minImage(x - atom.x, a)
    const dy = minImage(y - atom.y, a)
    const dz = minImage(z - atom.z, a)
    const d = Math.hypot(dx, dy, dz) - atom.r
    if (d < best) best = d
  }
  return best
}

console.log(`Sampling ${n + 1}³ field…`)
for (let i = 0; i <= n; i++) {
  const x = (i / n) * a
  for (let j = 0; j <= n; j++) {
    const y = (j / n) * a
    for (let k = 0; k <= n; k++) {
      const z = (k / n) * a
      field[fIndex(i, j, k)] = sdfExact(x, y, z)
    }
  }
}

function wrapI(v) {
  const s = n + 1
  return ((v % s) + s) % s
}

function sdfInterp(x, y, z) {
  let wx = ((x % a) + a) % a
  let wy = ((y % a) + a) % a
  let wz = ((z % a) + a) % a
  const fx = (wx / a) * n
  const fy = (wy / a) * n
  const fz = (wz / a) * n
  const i0 = Math.floor(fx)
  const j0 = Math.floor(fy)
  const k0 = Math.floor(fz)
  const tx = fx - i0
  const ty = fy - j0
  const tz = fz - k0
  let acc = 0
  for (let di = 0; di < 2; di++) {
    for (let dj = 0; dj < 2; dj++) {
      for (let dk = 0; dk < 2; dk++) {
        const w = (di ? tx : 1 - tx) * (dj ? ty : 1 - ty) * (dk ? tz : 1 - tz)
        acc += w * field[fIndex(wrapI(i0 + di), wrapI(j0 + dj), wrapI(k0 + dk))]
      }
    }
  }
  return acc
}

const sites = []
for (let i = 1; i < n; i++) {
  for (let j = 1; j < n; j++) {
    for (let k = 1; k < n; k++) {
      const v = field[fIndex(i, j, k)]
      if (v <= PROBE + 1.1) continue
      let isMax = true
      for (let di = -1; di <= 1 && isMax; di++) {
        for (let dj = -1; dj <= 1 && isMax; dj++) {
          for (let dk = -1; dk <= 1; dk++) {
            if (di === 0 && dj === 0 && dk === 0) continue
            if (field[fIndex(i + di, j + dj, k + dk)] > v + 1e-6) {
              isMax = false
              break
            }
          }
        }
      }
      if (!isMax) continue
      const x = (i / n) * a
      const y = (j / n) * a
      const z = (k / n) * a
      const zFace = a - z
      const xFace = Math.min(x, a - x)
      const yFace = Math.min(y, a - y)
      sites.push({
        x,
        y,
        z,
        r: v,
        zFace,
        edge: Math.min(xFace, yFace, zFace),
        score: v * (1.15 + 2.4 * Math.max(0, 1 - zFace / 9) * (xFace > 4 && yFace > 4 ? 1 : 0.35)),
      })
    }
  }
}

sites.sort((p, q) => q.score - p.score)
console.log(
  `Cage maxima: ${sites.length} · top ` +
    sites
      .slice(0, 8)
      .map((s) => `r=${s.r.toFixed(2)} zFace=${s.zFace.toFixed(1)}`)
      .join(' · '),
)

function guestClearance(placed) {
  let min = Infinity
  for (const p of placed) {
    const d = sdfInterp(p.x, p.y, p.z) - GUEST_CLEAR
    if (d < min) min = d
  }
  return min
}

function faceOn(placed) {
  let xx = 0
  let yy = 0
  let zz = 0
  let xy = 0
  let xz = 0
  let yz = 0
  for (const p of placed) {
    xx += p.x * p.x
    yy += p.y * p.y
    zz += p.z * p.z
    xy += p.x * p.y
    xz += p.x * p.z
    yz += p.y * p.z
  }
  return zz / (xx + yy + zz + 1e-6)
}

function dock(mol, site, occupied) {
  const deg = Math.PI / 180
  let best = null
  for (let rx = 0; rx < 180; rx += 30) {
    for (let ry = 0; ry < 360; ry += 30) {
      for (let rz = 0; rz < 180; rz += 45) {
        const m = rotMat(rx * deg, ry * deg, rz * deg)
        for (const dz of [-1.2, 0, 1.2]) {
          const placed = mol.atoms.map((p) => {
            const q = applyRot(p, m)
            return {
              element: q.element,
              x: q.x + site.x,
              y: q.y + site.y,
              z: q.z + site.z + dz,
            }
          })
          if (occupied.some((o) => Math.hypot(site.x - o.x, site.y - o.y, site.z + dz - o.z) < o.span)) {
            continue
          }
          const clear = guestClearance(placed)
          const view = faceOn(placed.map((p) => ({ x: p.x - site.x, y: p.y - site.y, z: p.z - site.z - dz })))
          const score = clear * 4 - view * 0.35
          if (!best || score > best.score) {
            best = { placed, clear, view, score, dz }
          }
        }
      }
    }
  }
  return best
}

const placedGuests = []
const occupied = []

for (const spec of GUESTS) {
  const pdbPath = join(root, 'original_images', 'supporting', spec.file)
  const mol = parsePdb(pdbPath)
  console.log(`${spec.id}: ${mol.atoms.length} heavy atoms, radius ${mol.radius.toFixed(1)} Å`)
  let chosen = null
  for (const site of sites.slice(0, 24)) {
    if (site.zFace < 2.4 || site.zFace > 11) continue
    if (occupied.some((o) => Math.hypot(site.x - o.x, site.y - o.y, site.z - o.z) < o.span + 2)) continue
    const trial = dock(mol, site, occupied)
    if (!trial) continue
    if (trial.clear < spec.minClear) continue
    if (!chosen || trial.score > chosen.score) {
      chosen = { ...trial, site }
    }
  }
  if (!chosen) {
    console.log(`  skipped — no cage near the +Z face accepted it`)
    continue
  }
  console.log(
    `  docked at zFace=${chosen.site.zFace.toFixed(1)} Å  clearance=${chosen.clear.toFixed(2)} Å  view=${chosen.view.toFixed(2)}`,
  )
  occupied.push({
    x: chosen.site.x,
    y: chosen.site.y,
    z: chosen.site.z + chosen.dz,
    span: mol.radius + 1.5,
  })
  placedGuests.push({
    name: spec.id,
    carbon: spec.carbon,
    site: {
      x: chosen.site.x - a * 0.5,
      y: chosen.site.y - a * 0.5,
      z: chosen.site.z + chosen.dz - a * 0.5,
    },
    atoms: chosen.placed.map((p, i) => {
      const look = DISPLAY[p.element] ?? DISPLAY.C
      return {
        id: i,
        element: p.element,
        x: p.x - a * 0.5,
        y: p.y - a * 0.5,
        z: p.z - a * 0.5,
        color: p.element === 'C' ? spec.carbon : look.color,
        radius: look.radius,
      }
    }),
    bonds: mol.bonds,
  })
}

if (!placedGuests.length) {
  throw new Error('Could not dock either guest into an edge cage')
}

const focus = placedGuests.reduce(
  (acc, g) => ({
    x: acc.x + g.site.x / placedGuests.length,
    y: acc.y + g.site.y / placedGuests.length,
    z: acc.z + g.site.z / placedGuests.length,
  }),
  { x: 0, y: 0, z: 0 },
)

const payload = {
  source: 'rowleyite.cif + doxorubicin_3D.pdb + vincristine_3D.pdb',
  cell: { a },
  focus: {
    x: Math.round(focus.x * 1000) / 1000,
    y: Math.round(focus.y * 1000) / 1000,
    z: Math.round(focus.z * 1000) / 1000,
  },
  molecules: placedGuests.map((g) => ({
    ...g,
    site: {
      x: Math.round(g.site.x * 1000) / 1000,
      y: Math.round(g.site.y * 1000) / 1000,
      z: Math.round(g.site.z * 1000) / 1000,
    },
    atoms: g.atoms.map((p) => ({
      ...p,
      x: Math.round(p.x * 1000) / 1000,
      y: Math.round(p.y * 1000) / 1000,
      z: Math.round(p.z * 1000) / 1000,
    })),
  })),
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(payload))
console.log(`Wrote ${placedGuests.map((g) => g.name).join(' + ')} → ${outPath}`)
