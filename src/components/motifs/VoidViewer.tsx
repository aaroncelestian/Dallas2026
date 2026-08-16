import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import mesh from '../../data/rowleyiteVoid.json'
import guests from '../../data/rowleyiteGuests.json'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './Motifs.module.css'

const VOID_OUT = '#e0b15c'
const VOID_IN = '#5aa8b8'
const SCALE = 0.155

const LEGEND_WALLS = [
  { color: VOID_OUT, label: 'outside' },
  { color: VOID_IN, label: 'inside' },
] as const

const LEGEND_GUESTS = [
  { color: '#f0c4a8', label: 'doxorubicin' },
  { color: '#c5d8e6', label: 'vincristine' },
  { color: '#d0d6de', label: 'cisplatin' },
  { color: '#e6d08a', label: 'temozolomide' },
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
    <mesh position={mid.pos.toArray()} quaternion={mid.quat} castShadow userData={{ guestBond: true }}>
      <cylinderGeometry args={[0.055, 0.055, mid.len, 6]} />
      <meshStandardMaterial
        color="#6a5a4a"
        roughness={0.55}
        metalness={0.12}
        transparent
        opacity={0}
        depthWrite
      />
    </mesh>
  )
}

function GuestMolecules({ visible, reduced }: { visible: boolean; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const opacity = useRef(visible ? 1 : 0)

  useFrame((_, dt) => {
    const root = group.current
    if (!root) return
    const target = visible ? 1 : 0
    if (reduced) {
      opacity.current = target
    } else {
      opacity.current += (target - opacity.current) * Math.min(1, dt * 2.15)
      if (Math.abs(opacity.current - target) < 0.004) opacity.current = target
    }
    const a = opacity.current
    root.visible = a > 0.012
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined
      if (!mat || mat.opacity == null) return
      const isBond = Boolean(obj.userData.guestBond)
      mat.opacity = isBond ? a * 0.92 : a
      if (!isBond) mat.emissiveIntensity = 0.22 * a
    })
  })

  return (
    <group ref={group} visible={false}>
      {guests.molecules.map((mol) => (
        <group key={mol.name}>
          {mol.bonds.map(([i, j]) => {
            const A = mol.atoms[i]
            const B = mol.atoms[j]
            if (!A || !B) return null
            return <Bond key={`${mol.name}-${i}-${j}`} a={[A.x, A.y, A.z]} b={[B.x, B.y, B.z]} />
          })}
          {mol.atoms.map((atom) => (
            <mesh key={`${mol.name}-${atom.id}`} position={[atom.x, atom.y, atom.z]} castShadow receiveShadow>
              <sphereGeometry args={[atom.radius, 16, 16]} />
              <meshStandardMaterial
                color={atom.color}
                roughness={0.28}
                metalness={0.18}
                emissive={atom.color}
                emissiveIntensity={0}
                transparent
                opacity={0}
                depthWrite
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function LocalEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
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
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[7, 9, 5]}
        intensity={1.7}
        color="#fff3dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00045}
        shadow-normalBias={0.045}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <directionalLight position={[-6, 3, -4]} intensity={0.42} color="#9ec4d4" />
      <directionalLight position={[2, -5, 6]} intensity={0.28} color="#f0c878" />
      <LocalEnvironment />
      <group ref={group} scale={SCALE}>
        <CellWire size={mesh.cell.a} />
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={VOID_OUT}
            roughness={0.38}
            metalness={0.22}
            clearcoat={0.45}
            clearcoatRoughness={0.35}
            sheen={0.28}
            sheenColor="#f0d4a0"
            envMapIntensity={0.95}
            side={THREE.FrontSide}
          />
        </mesh>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={VOID_IN}
            roughness={0.62}
            metalness={0.06}
            clearcoat={0.08}
            sheen={0.18}
            sheenColor="#b8e0e8"
            envMapIntensity={0.55}
            side={THREE.BackSide}
          />
        </mesh>
        <GuestMolecules visible={showGuests} reduced={reduced} />
      </group>
      <ContactShadows
        position={[0, -2.85, 0]}
        opacity={0.48}
        scale={14}
        blur={2.1}
        far={8}
        color="#050403"
      />
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
          ? 'Rowleyite void space with doxorubicin, vincristine, cisplatin, and temozolomide in near-face cages'
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
        <div className={styles.legendGuests} data-on={showGuests || undefined}>
          <div className={styles.legendGuestsInner}>
            {LEGEND_GUESTS.map((row) => (
              <div key={row.label} className={styles.legendRow}>
                <span className={styles.swatch} style={{ background: row.color }} />
                {row.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        camera={{ position: [5.4, 3.2, 12.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene active={active} showGuests={showGuests} />
        </Suspense>
      </Canvas>
      <div className={styles.crystalCaption}>
        <span className={styles.captionSizer} aria-hidden>
          Rowleyite · four cargos in the near cages · drag to orbit
        </span>
        <span data-on={!showGuests || undefined}>Rowleyite · void space · drag to orbit</span>
        <span data-on={showGuests || undefined}>Rowleyite · four cargos in the near cages · drag to orbit</span>
      </div>
    </div>
  )
}
