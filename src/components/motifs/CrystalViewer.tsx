import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import structure from '../../data/lokelmaAtoms.json'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './Motifs.module.css'

const K_COLOR = '#f0c878'
const LEGEND = [
  { color: '#8a9aa8', label: 'Zr' },
  { color: '#7ec4d4', label: 'Si' },
  { color: '#c8c0b4', label: 'O' },
  { color: K_COLOR, label: 'K⁺' },
] as const

function Bond({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  const mid = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const dir = new THREE.Vector3().subVectors(B, A)
    const len = dir.length()
    const quat = new THREE.Quaternion()
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { len, quat, pos: A.clone().add(B).multiplyScalar(0.5) }
  }, [a, b])
  return (
    <mesh position={mid.pos.toArray()} quaternion={mid.quat}>
      <cylinderGeometry args={[0.028, 0.028, mid.len, 6]} />
      <meshStandardMaterial color="#6a645c" roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

function CellWire({ size }: { size: number }) {
  const edges = useMemo(() => {
    const h = size / 2
    const c: [number, number, number][] = [
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
    return pairs.map(([i, j]) => [c[i], c[j]] as [[number, number, number], [number, number, number]])
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

function Scene({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null)
  const reduced = usePrefersReducedMotion()
  const scale = 0.4
  const atoms = structure.atoms
  const bonds = structure.bonds as [number, number][]

  useFrame((_, dt) => {
    if (!group.current || reduced || !active) return
    group.current.rotation.y += dt * 0.1
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.15} />
      <directionalLight position={[-4, -2, -6]} intensity={0.32} />
      <pointLight position={[0, 0.4, 2.2]} intensity={1.15} color={K_COLOR} distance={14} />
      <group ref={group}>
        <CellWire size={structure.cell.a * scale} />
        {bonds.map(([i, j]) => {
          const A = atoms[i]
          const B = atoms[j]
          if (!A || !B) return null
          return (
            <Bond
              key={`${i}-${j}`}
              a={[A.x * scale, A.y * scale, A.z * scale]}
              b={[B.x * scale, B.y * scale, B.z * scale]}
            />
          )
        })}
        {atoms.map((atom) => {
          const isK = atom.element === 'K'
          const r = atom.radius * (isK ? 1.08 : 0.92)
          return (
            <mesh key={atom.id} position={[atom.x * scale, atom.y * scale, atom.z * scale]}>
              <sphereGeometry args={[r, isK ? 20 : 14, isK ? 20 : 14]} />
              <meshStandardMaterial
                color={atom.color}
                roughness={isK ? 0.22 : 0.4}
                metalness={isK ? 0.55 : atom.element === 'Zr' ? 0.45 : 0.12}
                emissive={isK ? K_COLOR : '#000000'}
                emissiveIntensity={isK ? 0.55 : 0}
              />
            </mesh>
          )
        })}
      </group>
      <OrbitControls enablePan={false} enableZoom={false} makeDefault />
    </>
  )
}

export function CrystalViewer({ active }: { active: boolean }) {
  return (
    <div className={styles.crystal} aria-label="Lokelma crystal structure with potassium in the channels">
      <div className={styles.legend}>
        {LEGEND.map((row) => (
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
          <Scene active={active} />
        </Suspense>
      </Canvas>
      <div className={styles.crystalCaption}>ZS-9 · K⁺ in the channels · drag to orbit</div>
    </div>
  )
}
