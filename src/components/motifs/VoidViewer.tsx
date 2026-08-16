import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import mesh from '../../data/rowleyiteVoid.json'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import styles from './Motifs.module.css'

const VOID = '#e0b15c'

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
  const scale = 0.155

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
    geo.setIndex(mesh.index)
    return geo
  }, [])

  useFrame((_, dt) => {
    if (!group.current || reduced || !active) return
    group.current.rotation.y += dt * 0.1
  })

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[6, 8, 4]} intensity={1.05} color="#fff4e0" />
      <directionalLight position={[-5, -2, -6]} intensity={0.38} color="#9ec4d4" />
      <pointLight position={[0, 0.2, 1.6]} intensity={1.05} color={VOID} distance={16} />
      <group ref={group} scale={scale}>
        <CellWire size={mesh.cell.a} />
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color={VOID}
            roughness={0.34}
            metalness={0.18}
            emissive={VOID}
            emissiveIntensity={0.2}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <OrbitControls enablePan={false} enableZoom={false} makeDefault />
    </>
  )
}

export function VoidViewer({ active }: { active: boolean }) {
  return (
    <div className={styles.crystal} aria-label="Rowleyite void space — the cages and channels, not the atoms">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [3.6, 2.0, 9.4], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene active={active} />
        </Suspense>
      </Canvas>
      <div className={styles.crystalCaption}>Rowleyite · void space · drag to orbit</div>
    </div>
  )
}
