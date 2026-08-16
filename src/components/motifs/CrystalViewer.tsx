import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import structure from '../../data/lokelmaAtoms.json'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { useScene } from '../../hooks/useSceneBeats'
import {
  buildExchangeSites,
  hydroxylAt,
  phaseForBeat,
  sampleExchange,
  type CrystalPhase,
  type Hydroxyl,
  type Vec3,
} from '../../lib/lokelmaExchange'
import styles from './Motifs.module.css'

const K_COLOR = '#f0c878'
const H_COLOR = '#e8f2f6'
const SCALE = 0.4
const PHASES: CrystalPhase[] = ['k', 'h-point', 'exchange', 'locked']

const LEGEND = [
  { color: '#8a9aa8', label: 'Zr' },
  { color: '#7ec4d4', label: 'Si' },
  { color: '#c8c0b4', label: 'O' },
  { color: K_COLOR, label: 'K⁺' },
  { color: H_COLOR, label: 'H' },
] as const

const CAPTION: Record<CrystalPhase, string> = {
  k: 'ZS-9 · K⁺ in the channels · drag to orbit',
  'h-point': 'H pointing at the K site · H to step',
  exchange: 'H bends, then exchanges out',
  locked: 'K locked in the 7-ring',
}

function scaled(p: Vec3): Vec3 {
  return [p[0] * SCALE, p[1] * SCALE, p[2] * SCALE]
}

function Bond({ a, b }: { a: Vec3; b: Vec3 }) {
  const mid = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const dir = new THREE.Vector3().subVectors(B, A)
    const length = dir.length()
    const quat = new THREE.Quaternion()
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { length, quat, pos: A.clone().add(B).multiplyScalar(0.5) }
  }, [a, b])
  return (
    <mesh position={mid.pos.toArray()} quaternion={mid.quat}>
      <cylinderGeometry args={[0.028, 0.028, mid.length, 6]} />
      <meshStandardMaterial color="#6a645c" roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

function CellWire({ size }: { size: number }) {
  const edges = useMemo(() => {
    const h = size / 2
    const c: Vec3[] = [
      [-h, -h, -h],
      [h, -h, -h],
      [h, h, -h],
      [-h, h, -h],
      [-h, -h, h],
      [h, -h, h],
      [h, h, h],
      [-h, h, h],
    ]
    const pairs: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ]
    return pairs.map(([i, j]) => [c[i], c[j]] as [Vec3, Vec3])
  }, [size])

  return (
    <group>
      {edges.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#d4a04a"
          lineWidth={1.05}
          transparent
          opacity={0.28}
        />
      ))}
    </group>
  )
}

function alignBond(mesh: THREE.Mesh, a: Vec3, b: Vec3) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const dir = new THREE.Vector3().subVectors(B, A)
  const length = dir.length()
  mesh.position.copy(A.clone().add(B).multiplyScalar(0.5))
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  mesh.scale.set(1, length, 1)
}

type ExchangeAnim = {
  hMix: number
  hOp: number
  kOp: number
  kLock: number
}

function Hydroxyls({
  sites,
  anim,
}: {
  sites: Hydroxyl[]
  anim: MutableRefObject<ExchangeAnim>
}) {
  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    const root = group.current
    if (!root) return
    const { hMix, hOp } = anim.current
    root.visible = hOp > 0.02
    sites.forEach((site, i) => {
      const pair = root.children[i] as THREE.Group | undefined
      const atom = pair?.children[0] as THREE.Mesh | undefined
      const bond = pair?.children[1] as THREE.Mesh | undefined
      if (!atom || !bond) return
      const h = scaled(hydroxylAt(site, hMix))
      atom.position.set(...h)
      const mat = atom.material as THREE.MeshStandardMaterial
      mat.opacity = hOp
      mat.emissiveIntensity = 0.7 * hOp
      alignBond(bond, scaled(site.oxygen), h)
      const bondMat = bond.material as THREE.MeshStandardMaterial
      bondMat.opacity = hOp * 0.85
    })
  })

  return (
    <group ref={group} visible={false}>
      {sites.map((site) => (
        <group key={site.id}>
          <mesh position={scaled(site.point)}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial
              color={H_COLOR}
              roughness={0.25}
              metalness={0.05}
              emissive={H_COLOR}
              emissiveIntensity={0.7}
              transparent
              opacity={1}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.016, 0.016, 1, 6]} />
            <meshStandardMaterial
              color="#c5d4dc"
              roughness={0.45}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function PotassiumSites({
  atoms,
  anim,
}: {
  atoms: { id: number; x: number; y: number; z: number; radius: number }[]
  anim: MutableRefObject<ExchangeAnim>
}) {
  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    const root = group.current
    if (!root) return
    const { kOp, kLock } = anim.current
    root.visible = kOp > 0.02
    for (const child of root.children) {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.opacity = kOp
      mat.emissiveIntensity = (0.55 + kLock * 0.45) * kOp
      const base = (mesh.userData.radius as number) * (1 + kLock * 0.08)
      mesh.scale.setScalar(base)
    }
  })

  return (
    <group ref={group}>
      {atoms.map((atom) => (
        <mesh
          key={atom.id}
          userData={{ radius: atom.radius * 1.08 }}
          position={[atom.x * SCALE, atom.y * SCALE, atom.z * SCALE]}
          scale={atom.radius * 1.08}
        >
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial
            color={K_COLOR}
            roughness={0.22}
            metalness={0.55}
            emissive={K_COLOR}
            emissiveIntensity={0.55}
            transparent
            opacity={1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function applyPhase(phase: CrystalPhase, progress: number, reduced: boolean): ExchangeAnim {
  if (phase === 'k') return { hMix: 0, hOp: 0, kOp: 1, kLock: 0 }
  if (phase === 'h-point') return { hMix: 0, hOp: 1, kOp: 0.14, kLock: 0 }
  if (phase === 'locked' || (phase === 'exchange' && reduced)) {
    return { hMix: 2, hOp: 0, kOp: 1, kLock: 1 }
  }
  return sampleExchange(progress)
}

function Scene({ active, phase }: { active: boolean; phase: CrystalPhase }) {
  const group = useRef<THREE.Group>(null)
  const progress = useRef(phase === 'locked' || phase === 'k' ? 1 : 0)
  const anim = useRef<ExchangeAnim>(applyPhase(phase, progress.current, false))
  const reduced = usePrefersReducedMotion()
  const atoms = structure.atoms
  const bonds = structure.bonds as [number, number][]
  const framework = useMemo(() => atoms.filter((atom) => atom.element !== 'K'), [atoms])
  const kAtoms = useMemo(() => atoms.filter((atom) => atom.element === 'K'), [atoms])
  const sites = useMemo(() => buildExchangeSites(atoms), [atoms])

  useEffect(() => {
    progress.current = phase === 'exchange' && !reduced ? 0 : 1
    anim.current = applyPhase(phase, progress.current, reduced)
  }, [phase, reduced])

  useFrame((_, dt) => {
    if (group.current && !reduced && active) {
      group.current.rotation.y += dt * 0.1
    }
    if (phase === 'exchange' && !reduced && progress.current < 1) {
      progress.current = Math.min(1, progress.current + dt / 3.6)
    }
    anim.current = applyPhase(phase, progress.current, reduced)
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.15} />
      <directionalLight position={[-4, -2, -6]} intensity={0.32} />
      <pointLight
        position={[0, 0.4, 2.2]}
        intensity={phase === 'h-point' || phase === 'exchange' ? 0.85 : 1.15}
        color={phase === 'h-point' || phase === 'exchange' ? H_COLOR : K_COLOR}
        distance={14}
      />
      <group ref={group}>
        <CellWire size={structure.cell.a * SCALE} />
        {bonds.map(([i, j]) => {
          const A = atoms[i]
          const B = atoms[j]
          if (!A || !B) return null
          return (
            <Bond
              key={`${i}-${j}`}
              a={[A.x * SCALE, A.y * SCALE, A.z * SCALE]}
              b={[B.x * SCALE, B.y * SCALE, B.z * SCALE]}
            />
          )
        })}
        {framework.map((atom) => (
          <mesh key={atom.id} position={[atom.x * SCALE, atom.y * SCALE, atom.z * SCALE]}>
            <sphereGeometry args={[atom.radius * 0.92, 14, 14]} />
            <meshStandardMaterial
              color={atom.color}
              roughness={0.4}
              metalness={atom.element === 'Zr' ? 0.45 : 0.12}
            />
          </mesh>
        ))}
        <PotassiumSites atoms={kAtoms} anim={anim} />
        <Hydroxyls sites={sites.hydroxyls} anim={anim} />
      </group>
      <OrbitControls enablePan={false} enableZoom={false} makeDefault />
    </>
  )
}

export function CrystalViewer({ active }: { active: boolean }) {
  const scene = useScene()
  const beatPhase = phaseForBeat(scene.beat?.id)
  const [override, setOverride] = useState<CrystalPhase | null>(null)

  useEffect(() => {
    setOverride(null)
  }, [scene.beat?.id])

  useEffect(() => {
    if (!active) {
      setOverride(null)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'h' && e.key !== 'H') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      e.preventDefault()
      e.stopPropagation()
      setOverride((current) => {
        const now = current ?? beatPhase
        return PHASES[(PHASES.indexOf(now) + 1) % PHASES.length]
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [active, beatPhase])

  const phase = override ?? beatPhase
  const showH = phase === 'h-point' || phase === 'exchange'
  const legend = showH ? LEGEND : LEGEND.filter((row) => row.label !== 'H')

  return (
    <div className={styles.crystal} aria-label={CAPTION[phase]}>
      <div className={styles.legend}>
        {legend.map((row) => (
          <div key={row.label} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
      </div>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [3.2, 1.6, 9.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene active={active} phase={phase} />
        </Suspense>
      </Canvas>
      <div className={styles.crystalCaption}>{CAPTION[phase]}</div>
    </div>
  )
}
