import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import mesh from '../../data/rowleyiteVoid.json'
import guests from '../../data/rowleyiteGuests.json'
import framework from '../../data/rowleyiteFramework.json'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './Motifs.module.css'

const VOID_OUT = '#e0b15c'
const VOID_IN = '#5aa8b8'
const SCALE = 0.155

const LEGEND_WALLS = [
  { color: VOID_OUT, label: 'outside' },
  { color: VOID_IN, label: 'inside' },
] as const

const LEGEND_FRAME = [
  { color: '#9a8ab0', label: 'V' },
  { color: '#d4b45a', label: 'As' },
  { color: '#d0c8bc', label: 'O' },
] as const

const LEGEND_GUESTS = [
  { color: '#f0c4a8', label: 'doxorubicin' },
  { color: '#c5d8e6', label: 'vincristine' },
] as const

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
    <mesh position={mid.pos.toArray()} quaternion={mid.quat} renderOrder={20}>
      <cylinderGeometry args={[0.055, 0.055, mid.len, 6]} />
      <meshStandardMaterial
        color="#6a5a4a"
        roughness={0.65}
        metalness={0.08}
        transparent
        opacity={1}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

function InstancedSpheres({
  atoms,
  color,
  radius,
}: {
  atoms: { x: number; y: number; z: number }[]
  color: string
  radius: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    atoms.forEach((atom, i) => {
      dummy.position.set(atom.x, atom.y, atom.z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [atoms])
  if (!atoms.length) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, atoms.length]} renderOrder={2}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshStandardMaterial
        color={color}
        roughness={0.38}
        metalness={0.2}
        emissive={color}
        emissiveIntensity={0.18}
        transparent
        opacity={0.7}
        depthTest={false}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function FrameworkBonds() {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const y = new THREE.Vector3(0, 1, 0)
    framework.bonds.forEach((bond, i) => {
      const A = new THREE.Vector3(...(bond.a as [number, number, number]))
      const B = new THREE.Vector3(...(bond.b as [number, number, number]))
      const dir = B.clone().sub(A)
      const len = dir.length()
      dummy.position.copy(A.add(B).multiplyScalar(0.5))
      dummy.quaternion.setFromUnitVectors(y, dir.normalize())
      dummy.scale.set(1, len, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, framework.bonds.length]} renderOrder={2}>
      <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
      <meshStandardMaterial
        color="#7a7064"
        roughness={0.65}
        metalness={0.08}
        transparent
        opacity={0.62}
        depthTest={false}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function Framework() {
  const groups = useMemo(() => {
    const by: Record<string, { x: number; y: number; z: number; color: string; radius: number }[]> = {
      V: [],
      As: [],
      O: [],
    }
    for (const atom of framework.atoms) {
      const list = by[atom.element]
      if (list) list.push(atom)
    }
    return by
  }, [])
  return (
    <group>
      <FrameworkBonds />
      {(['V', 'As', 'O'] as const).map((el) => (
        <InstancedSpheres
          key={el}
          atoms={groups[el]}
          color={groups[el][0]?.color ?? '#ccc'}
          radius={groups[el][0]?.radius ?? 0.2}
        />
      ))}
    </group>
  )
}

function GuestMolecules() {
  return (
    <>
      {guests.molecules.map((mol) => (
        <group key={mol.name}>
          {mol.bonds.map(([i, j]) => {
            const A = mol.atoms[i]
            const B = mol.atoms[j]
            if (!A || !B) return null
            return <Bond key={`${mol.name}-${i}-${j}`} a={[A.x, A.y, A.z]} b={[B.x, B.y, B.z]} />
          })}
          {mol.atoms.map((atom) => (
            <mesh key={`${mol.name}-${atom.id}`} position={[atom.x, atom.y, atom.z]} renderOrder={20}>
              <sphereGeometry args={[atom.radius, 16, 16]} />
              <meshStandardMaterial
                color={atom.color}
                roughness={0.3}
                metalness={0.12}
                emissive={atom.color}
                emissiveIntensity={0.55}
                transparent
                opacity={1}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Scene({ active, showGuests }: { active: boolean; showGuests: boolean }) {
  const group = useRef<THREE.Group>(null)
  const reduced = usePrefersReducedMotion()

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
    geo.setIndex(mesh.index)
    return geo
  }, [])

  useFrame((_, dt) => {
    if (!group.current || reduced || !active) return
    group.current.rotation.y += dt * 0.08
  })

  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight position={[6, 8, 4]} intensity={1.05} color="#fff4e0" />
      <directionalLight position={[-5, -2, -6]} intensity={0.34} color="#9ec4d4" />
      <pointLight position={[0, 0.4, 3.2]} intensity={1.15} color={VOID_IN} distance={18} />
      <group ref={group} scale={SCALE}>
        <CellWire size={mesh.cell.a} />
        <mesh geometry={geometry} renderOrder={0}>
          <meshStandardMaterial
            color={VOID_OUT}
            roughness={0.36}
            metalness={0.18}
            emissive={VOID_OUT}
            emissiveIntensity={0.12}
            transparent
            opacity={0.82}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
        <mesh geometry={geometry} renderOrder={0}>
          <meshStandardMaterial
            color={VOID_IN}
            roughness={0.42}
            metalness={0.08}
            emissive={VOID_IN}
            emissiveIntensity={0.2}
            transparent
            opacity={0.88}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
        <Framework />
        {showGuests && <GuestMolecules />}
      </group>
      <OrbitControls enablePan={false} enableZoom={false} makeDefault />
    </>
  )
}

export function VoidViewer({ active, guests: showGuests = false }: { active: boolean; guests?: boolean }) {
  return (
    <div
      className={styles.crystal}
      aria-label={
        showGuests
          ? 'Rowleyite void space with doxorubicin and vincristine in near-face cages'
          : 'Rowleyite void space — the cages and channels, not the atoms'
      }
    >
      <div className={styles.legend}>
        {LEGEND_WALLS.map((row) => (
          <div key={row.label} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
        {LEGEND_FRAME.map((row) => (
          <div key={row.label} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
        {showGuests &&
          LEGEND_GUESTS.map((row) => (
            <div key={row.label} className={styles.legendRow}>
              <span className={styles.swatch} style={{ background: row.color }} />
              {row.label}
            </div>
          ))}
      </div>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [5.4, 3.2, 12.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene active={active} showGuests={showGuests} />
        </Suspense>
      </Canvas>
      <div className={styles.crystalCaption}>
        {showGuests
          ? 'Rowleyite · doxorubicin + vincristine in the near cages · drag to orbit'
          : 'Rowleyite · void space · drag to orbit'}
      </div>
    </div>
  )
}
