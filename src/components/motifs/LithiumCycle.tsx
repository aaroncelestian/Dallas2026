import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../../hooks/useActiveSlide'
import { useScene } from '../../hooks/useSceneBeats'
import styles from './Motifs.module.css'

type CycleBeat = 'brine' | 'absorb' | 'air' | 'product' | 'award' | 'recycle'
type StationId = 'brine' | 'spinel' | 'air' | 'product'

const RING = 4.25
const GOLD = '#d4a04a'
const GOLD_HOT = '#f0c878'
const CREAM = '#f3eee4'
const FLIGHT_S = 1.85
const ALIGN_S = 0.72
const ORBIT_IN_S = 0.9
const PULL_S = 2.3
const REPLAY_DELAY_MS = 3000
const REPLAY_LOOP_S = 4

const ORDER: CycleBeat[] = ['brine', 'absorb', 'air', 'product', 'award', 'recycle']
const ANGLE: Record<CycleBeat, number> = {
  brine: 180,
  absorb: 270,
  air: 360,
  product: 450,
  award: 450,
  recycle: 450,
}

const WORLD_UP = new THREE.Vector3(0, 1, 0)

const STATIONS: { id: StationId; html: ReactNode; angle: number; from: number }[] = [
  { id: 'brine', html: 'brine', angle: 180, from: 0 },
  { id: 'spinel', html: <>H<sub>2</sub>MnO<sub>4</sub></>, angle: 270, from: 1 },
  { id: 'air', html: <>CO<sub>2</sub></>, angle: 0, from: 2 },
  { id: 'product', html: <>Li<sub>2</sub>CO<sub>3</sub></>, angle: 90, from: 3 },
]

const WIDE_POS = new THREE.Vector3(6.4, 5.6, 6.9)
const WIDE_LOOK = new THREE.Vector3(0, 0, 0)
const RIDE_FOG: [number, number] = [0.85, 3.35]
const STOP_FOG: [number, number] = [1.2, 5.4]
const WIDE_FOG: [number, number] = [9, 24]
const ARC_BEHIND = 18
const ARC_AHEAD = 74
const ARC_RAD = ((ARC_BEHIND + ARC_AHEAD) * Math.PI) / 180

function focusStation(beat: CycleBeat): StationId | 'all' {
  if (beat === 'recycle') return 'all'
  if (beat === 'brine') return 'brine'
  if (beat === 'absorb') return 'spinel'
  if (beat === 'air') return 'air'
  return 'product'
}

function asBeat(id?: string): CycleBeat {
  if (id && ORDER.includes(id as CycleBeat)) return id as CycleBeat
  return 'brine'
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

function wrapAngle(deg: number) {
  return ((deg % 360) + 360) % 360
}

function onRing(deg: number, radius = RING): THREE.Vector3 {
  const rad = (deg * Math.PI) / 180
  return new THREE.Vector3(Math.cos(rad) * radius, 0, Math.sin(rad) * radius)
}

function tangent(deg: number): THREE.Vector3 {
  const rad = (deg * Math.PI) / 180
  return new THREE.Vector3(-Math.sin(rad), 0, Math.cos(rad)).normalize()
}

function nearestStation(deg: number): StationId {
  const a = wrapAngle(deg)
  let best: StationId = 'brine'
  let bestDist = 180
  for (const station of STATIONS) {
    let dist = Math.abs(a - station.angle)
    if (dist > 180) dist = 360 - dist
    if (dist < bestDist) {
      bestDist = dist
      best = station.id
    }
  }
  return best
}

type Anim = {
  angle: number
  from: number
  to: number
  pendingTo: number | null
  flight: number
  align: number
  orbitMix: number
  orbitClock: number
  reveal: number
  pull: number
  loop: boolean
  time: number
}

function CycleRig({
  beat,
  active,
  reduced,
  glow,
  onGlow,
}: {
  beat: CycleBeat
  active: boolean
  reduced: boolean
  glow: StationId | null
  onGlow: (id: StationId | null) => void
}) {
  const { camera, scene } = useThree()
  const recycled = beat === 'recycle'
  const reached = ORDER.indexOf(beat)
  const glowRef = useRef<StationId | null>(null)
  const looping = useRef(false)
  const [wide, setWide] = useState(false)
  const anim = useRef<Anim>({
    angle: ANGLE[beat],
    from: ANGLE[beat],
    to: ANGLE[beat],
    pendingTo: null,
    flight: 1,
    align: 1,
    orbitMix: 0,
    orbitClock: 0,
    reveal: 0,
    pull: recycled ? 1 : 0,
    loop: false,
    time: 0,
  })
  const ridePos = useMemo(() => new THREE.Vector3(), [])
  const rideLook = useMemo(() => new THREE.Vector3(), [])
  const travelPos = useMemo(() => new THREE.Vector3(), [])
  const travelLook = useMemo(() => new THREE.Vector3(), [])
  const camPos = useMemo(() => new THREE.Vector3(), [])
  const camLook = useMemo(() => new THREE.Vector3(), [])
  const liPos = useMemo(() => new THREE.Vector3(), [])
  const alignFromPos = useMemo(() => new THREE.Vector3(), [])
  const alignFromLook = useMemo(() => new THREE.Vector3(), [])
  const side = useMemo(() => new THREE.Vector3(), [])
  const viewDir = useMemo(() => new THREE.Vector3(), [])
  const li = useRef<THREE.Mesh>(null)
  const co2 = useRef<THREE.Mesh>(null)
  const returnLine = useRef<THREE.Group>(null)
  const arc = useRef<THREE.Group>(null)
  const fullRing = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const next = ANGLE[beat]
    const same = Math.abs(next - anim.current.angle) < 0.5
    if (reduced || same) {
      anim.current.angle = next
      anim.current.from = next
      anim.current.to = next
      anim.current.pendingTo = null
      anim.current.flight = 1
      anim.current.align = 1
    } else {
      camera.getWorldDirection(viewDir)
      alignFromPos.copy(camera.position)
      alignFromLook.copy(camera.position).addScaledVector(viewDir, 3.2)
      anim.current.pendingTo = next
      anim.current.align = 0
      anim.current.flight = 1
      anim.current.orbitMix = 0
      anim.current.from = anim.current.angle
      anim.current.to = anim.current.angle
    }
    looping.current = false
    if (!recycled) {
      glowRef.current = null
      onGlow(null)
    }
  }, [alignFromLook, alignFromPos, beat, camera, onGlow, recycled, reduced, viewDir])

  useEffect(() => {
    if (!recycled) {
      setWide(false)
      looping.current = false
      return
    }
    const ready = window.setTimeout(() => setWide(true), reduced ? 0 : PULL_S * 1000)
    if (!active || reduced) return () => window.clearTimeout(ready)
    const start = window.setTimeout(() => {
      looping.current = true
    }, REPLAY_DELAY_MS)
    return () => {
      window.clearTimeout(ready)
      window.clearTimeout(start)
    }
  }, [active, recycled, reduced])

  useFrame((_, dt) => {
    const a = anim.current
    a.time += dt
    const cap = reduced ? 1 : dt

    if (recycled && looping.current && active && !reduced) {
      a.angle += (360 / REPLAY_LOOP_S) * dt
      const nextGlow = nearestStation(a.angle)
      if (nextGlow !== glowRef.current) {
        glowRef.current = nextGlow
        onGlow(nextGlow)
      }
    } else if (a.align < 1) {
      a.align = Math.min(1, a.align + cap / ALIGN_S)
      if (a.align >= 1 && a.pendingTo !== null) {
        a.from = a.angle
        a.to = a.pendingTo
        a.pendingTo = null
        a.flight = 0
      }
    } else if (a.flight < 1) {
      a.flight = Math.min(1, a.flight + cap / FLIGHT_S)
      a.angle = a.from + (a.to - a.from) * easeOut(a.flight)
      if (a.flight >= 1) {
        a.orbitMix = 0
        a.orbitClock = 0
      }
    } else {
      a.angle = a.to
    }

    const wantPull = recycled ? 1 : 0
    a.pull = reduced
      ? wantPull
      : THREE.MathUtils.damp(a.pull, wantPull, recycled ? 1.15 : 3.2, dt)

    const t = a.angle
    const tan = tangent(t)

    liPos.copy(onRing(t))
    if (li.current) li.current.position.copy(liPos)
    const radial = liPos.clone().setY(0).normalize()
    side.crossVectors(tan, WORLD_UP).normalize()

    const holding = !recycled && a.align >= 1 && a.flight >= 1 && !reduced
    a.reveal = reduced
      ? holding
        ? 1
        : 0
      : THREE.MathUtils.damp(a.reveal, holding ? 1 : 0, holding ? 1.5 : 2.6, dt)
    const shown = holding ? a.reveal : 0
    const back = THREE.MathUtils.lerp(1.35, 2.05, shown)
    const height = THREE.MathUtils.lerp(0.34, 0.58, shown)
    const out = THREE.MathUtils.lerp(0.22, 0.38, shown)

    travelPos
      .copy(liPos)
      .addScaledVector(tan, -back)
      .addScaledVector(radial, out)
      .setY(height)
    travelLook.copy(liPos).addScaledVector(tan, THREE.MathUtils.lerp(1.7, 2.35, shown)).setY(0.12)

    if (holding) {
      a.orbitMix = Math.min(1, a.orbitMix + dt / ORBIT_IN_S)
      a.orbitClock += dt
      const k = easeOut(a.orbitMix)
      const w = a.orbitClock * 0.38
      travelPos
        .addScaledVector(side, Math.sin(w) * 0.42 * k)
        .addScaledVector(WORLD_UP, (0.06 + Math.cos(w) * 0.16) * k)
        .addScaledVector(tan, Math.cos(w * 0.85) * 0.16 * k)
      travelLook
        .addScaledVector(side, Math.sin(w) * 0.12 * k)
        .addScaledVector(WORLD_UP, Math.cos(w) * 0.04 * k)
    }

    if (a.align < 1 && !reduced) {
      const k = easeOut(a.align)
      ridePos.lerpVectors(alignFromPos, travelPos, k)
      rideLook.lerpVectors(alignFromLook, travelLook, k)
    } else {
      ridePos.copy(travelPos)
      rideLook.copy(travelLook)
    }

    camPos.lerpVectors(ridePos, WIDE_POS, easeOut(a.pull))
    camLook.lerpVectors(rideLook, WIDE_LOOK, easeOut(a.pull))

    if (!wide) {
      camera.up.copy(WORLD_UP)
      camera.position.copy(camPos)
      camera.lookAt(camLook)
    } else {
      camera.up.copy(WORLD_UP)
    }

    if (arc.current) {
      arc.current.rotation.y = -THREE.MathUtils.degToRad(t - ARC_BEHIND)
      arc.current.visible = a.pull < 0.92
      arc.current.traverse((child) => {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined
        if (mat && 'opacity' in mat) mat.opacity = 1 - easeOut(a.pull)
      })
    }
    if (fullRing.current) {
      const mat = fullRing.current.material as THREE.MeshStandardMaterial
      mat.opacity = easeOut(a.pull)
      mat.transparent = true
      fullRing.current.visible = a.pull > 0.08
    }
    const persp = camera as THREE.PerspectiveCamera
    persp.fov = THREE.MathUtils.lerp(60, 40, easeOut(a.pull))
    persp.near = 0.12
    persp.updateProjectionMatrix()

    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      const near = THREE.MathUtils.lerp(RIDE_FOG[0], STOP_FOG[0], a.reveal)
      const far = THREE.MathUtils.lerp(RIDE_FOG[1], STOP_FOG[1], a.reveal)
      fog.near = THREE.MathUtils.lerp(near, WIDE_FOG[0], a.pull)
      fog.far = THREE.MathUtils.lerp(far, WIDE_FOG[1], a.pull)
    }

    if (co2.current) {
      const shown = reached >= 2
      const destY = shown ? 0.28 : 3.6
      const destOp = shown ? 1 : 0
      co2.current.position.y = reduced
        ? destY
        : THREE.MathUtils.damp(co2.current.position.y, destY, 1.4, dt)
      const mat = co2.current.material as THREE.MeshStandardMaterial
      mat.opacity = reduced ? destOp : THREE.MathUtils.damp(mat.opacity, destOp, 1.8, dt)
    }

    if (returnLine.current) {
      returnLine.current.visible = a.pull > 0.12
      returnLine.current.traverse((child) => {
        const mesh = child as THREE.Line
        const mat = mesh.material as THREE.LineBasicMaterial | undefined
        if (mat && 'opacity' in mat) mat.opacity = Math.max(0, (a.pull - 0.12) / 0.88)
      })
    }
  })

  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 7, 2]} intensity={0.7} color={CREAM} />
      <pointLight position={[0, 2.2, 0]} intensity={0.35} color={GOLD} />

      <group ref={arc}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING, 0.042, 14, 48, ARC_RAD]} />
          <meshStandardMaterial
            color={GOLD}
            roughness={0.38}
            metalness={0.55}
            emissive={GOLD}
            emissiveIntensity={0.22}
            transparent
            opacity={1}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh ref={fullRing} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[RING, 0.042, 14, 128]} />
        <meshStandardMaterial
          color={GOLD}
          roughness={0.38}
          metalness={0.55}
          emissive={GOLD}
          emissiveIntensity={0.18}
          transparent
          opacity={0}
        />
      </mesh>

      <group ref={returnLine} visible={false}>
        <Line
          points={[
            [RING, 0.03, 0],
            [-RING, 0.03, 0],
          ]}
          color={GOLD}
          dashed
          dashSize={0.2}
          gapSize={0.14}
          lineWidth={1.6}
          transparent
          opacity={0}
        />
      </group>

      {STATIONS.map((station) => {
        const focus = focusStation(beat)
        const here = focus === 'all' || station.id === focus
        const live = here && (recycled || reached >= station.from)
        const lit = glow === station.id
        const p = onRing(station.angle)
        const label = onRing(station.angle, RING + 0.62)
        return (
          <group key={station.id}>
            <mesh position={[p.x, 0.02, p.z]} visible={live}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                color={GOLD}
                emissive={GOLD_HOT}
                emissiveIntensity={lit ? 1.1 : 0.55}
              />
            </mesh>
            {live && (
              <Html
                position={[label.x, 0.48, label.z]}
                center
                transform={false}
                occlude={false}
                wrapperClass={styles.cycleFormulaWrap}
                style={{ pointerEvents: 'none' }}
              >
                <span className={styles.cycleFormula} data-glow={lit || undefined}>
                  {station.html}
                </span>
              </Html>
            )}
          </group>
        )
      })}

      <mesh ref={li} position={onRing(ANGLE[beat]).toArray()}>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshStandardMaterial
          color={GOLD_HOT}
          emissive={GOLD_HOT}
          emissiveIntensity={1.15}
          roughness={0.22}
          metalness={0.45}
        />
      </mesh>

      <mesh ref={co2} position={[RING, 3.6, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial
          color="#c8d8e0"
          emissive="#9eb8c4"
          emissiveIntensity={0.7}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <OrbitControls
        enabled={wide && !reduced}
        enablePan={false}
        enableZoom={false}
        makeDefault={wide}
      />
    </>
  )
}

export function LithiumCycle({ active }: { active: boolean }) {
  const scene = useScene()
  const reduced = usePrefersReducedMotion()
  const beat = asBeat(scene.beat?.id)
  const recycled = beat === 'recycle'
  const [glow, setGlow] = useState<StationId | null>(null)

  return (
    <div
      className={styles.cycle}
      data-wide={recycled || undefined}
      aria-label="Lithium extraction loop"
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [-4.47, 0.34, 1.35], fov: 60, near: 0.12, far: 40 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', RIDE_FOG[0], RIDE_FOG[1]]} />
        <Suspense fallback={null}>
          <CycleRig
            beat={beat}
            active={active}
            reduced={reduced}
            glow={glow}
            onGlow={setGlow}
          />
        </Suspense>
      </Canvas>
      {recycled && (
        <div className={styles.crystalCaption}>The circle they just rode · drag to orbit</div>
      )}
    </div>
  )
}
