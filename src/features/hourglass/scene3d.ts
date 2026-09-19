import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Plane,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  FACET_PHASE,
  facetedGlass,
  GLASS,
  outlineEdges,
  pileSandLevel,
  profilePoints,
  SAND_INSET,
  sparkPosition,
  strokeWidth,
  topSandLevel,
} from './geometry3d'
import type { Motion } from './motion'
import type { Palette } from './render'

/** The frame around the glass, in scene units (the glass is 2 tall). */
const FRAME = {
  plateThickness: 0.07,
  /** How far the plates reach beyond the glass's widest point. */
  plateOverhang: 0.2,
  /** A sliver of black between each end of the glass and its plate. */
  gap: 0.03,
  pillarRadius: 0.035,
}
const LINE_WEIGHT = 0.009
const GRAIN_RADIUS = 0.012
const SPARK_SIZE = 0.07

export interface Spark {
  /** Where its week lies in the remaining time: 0 is now, 1 is the end. */
  share: number
  seed: number
}

export interface SceneFrame {
  /** Share of the expected life already lived, 0 to 1. */
  lived: number
  sparks: Spark[]
  motion: Motion
  /** Whether sand is falling: false when time has run out or motion is reduced. */
  streaming: boolean
  /** Seconds, for the sparks' twinkle. */
  time: number
}

export interface HourglassScene {
  resize: (width: number, height: number, pixelRatio: number) => void
  /** Draws a frame, advancing the falling stream by `dt` seconds. */
  render: (frame: SceneFrame, dt: number) => void
  dispose: () => void
}

/** A four-pointed spark, drawn once and shared by every sealed letter. */
function sparkTexture(color: string): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const c = size / 2
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(c, 0)
    ctx.quadraticCurveTo(c, c, size, c)
    ctx.quadraticCurveTo(c, c, c, size)
    ctx.quadraticCurveTo(c, c, 0, c)
    ctx.quadraticCurveTo(c, c, c, 0)
    ctx.fill()
  }
  return new CanvasTexture(canvas)
}

export function createHourglassScene(
  canvas: HTMLCanvasElement,
  palette: Palette,
): HourglassScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.localClippingEnabled = true

  const scene = new Scene()
  const camera = new PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 0.9, 7.2)
  camera.lookAt(0, 0, 0)

  // Bright ambient light and a soft key light from the upper right: faces
  // turned away from it are only a little darker than pure white.
  scene.add(new AmbientLight(0xffffff, 2.2))
  const key = new DirectionalLight(0xffffff, 1.4)
  key.position.set(3, 4, 5)
  scene.add(key)

  const hourglass = new Group()
  scene.add(hourglass)

  const disposables: Array<{ dispose: () => void }> = []
  const keep = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item)
    return item
  }

  // The sand: each bulb's inside, cut off by a level surface in the world, so
  // it settles flat however the glass leans. Pure white, unaffected by light.
  const topPlane = new Plane(new Vector3(0, -1, 0), 0)
  const pilePlane = new Plane(new Vector3(0, -1, 0), 0)
  const sandMaterial = (plane: Plane) =>
    keep(
      new MeshBasicMaterial({
        color: palette.sand,
        side: DoubleSide,
        clippingPlanes: [plane],
      }),
    )
  const lathe = (from: number, to: number) =>
    keep(
      new LatheGeometry(
        profilePoints(from, to, 40, SAND_INSET).map(
          ([r, y]) => new Vector2(r, y),
        ),
        GLASS.facets,
        FACET_PHASE,
      ),
    )
  const topSand = sandMaterial(topPlane)
  const pileSand = sandMaterial(pilePlane)
  hourglass.add(new Mesh(lathe(0, GLASS.halfHeight), topSand))
  hourglass.add(new Mesh(lathe(-GLASS.halfHeight, 0), pileSand))
  // Cutting the sand leaves its surface open. A floor at the bottom of the
  // pile means looking down into it shows sand, not what lies beneath.
  const floor = new Mesh(
    keep(
      new CircleGeometry(
        GLASS.maxRadius * SAND_INSET,
        GLASS.facets,
        FACET_PHASE,
      ),
    ),
    pileSand,
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -GLASS.halfHeight + 0.001
  hourglass.add(floor)

  // The frame: two faceted plates, a sliver away from the glass, and three
  // pillars. Pure white, shaded flat so its faces read as a solid object.
  const solid = keep(
    new MeshLambertMaterial({ color: palette.sand, flatShading: true }),
  )
  const plateRadius = GLASS.maxRadius + FRAME.plateOverhang
  const plateGeometry = keep(
    new CylinderGeometry(
      plateRadius,
      plateRadius,
      FRAME.plateThickness,
      GLASS.facets,
    ),
  )
  for (const end of [1, -1]) {
    const plate = new Mesh(plateGeometry, solid)
    plate.position.y =
      end * (GLASS.halfHeight + FRAME.gap + FRAME.plateThickness / 2)
    plate.rotation.y = FACET_PHASE
    hourglass.add(plate)
  }
  // A thin black spacer in each gap, so a line of black always separates the
  // sand from the white plates, from any angle.
  const spacerGeometry = keep(
    new CylinderGeometry(
      GLASS.maxRadius,
      GLASS.maxRadius,
      FRAME.gap,
      GLASS.facets,
    ),
  )
  const spacerMaterial = keep(new MeshBasicMaterial({ color: palette.canvas }))
  for (const end of [1, -1]) {
    const spacer = new Mesh(spacerGeometry, spacerMaterial)
    spacer.position.y = end * (GLASS.halfHeight + FRAME.gap / 2)
    spacer.rotation.y = FACET_PHASE
    hourglass.add(spacer)
  }

  const pillarHeight = 2 * (GLASS.halfHeight + FRAME.gap)
  const pillarGeometry = keep(
    new CylinderGeometry(
      FRAME.pillarRadius,
      FRAME.pillarRadius,
      pillarHeight,
      6,
    ),
  )
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + Math.PI / 6
    const pillar = new Mesh(pillarGeometry, solid)
    const reach = plateRadius - 0.09
    pillar.position.set(Math.cos(angle) * reach, 0, Math.sin(angle) * reach)
    hourglass.add(pillar)
  }

  // The glass: only its outline, redrawn every frame as it turns.
  const glass = facetedGlass()
  const outlineGeometry = keep(new BufferGeometry())
  const outlinePositions = new BufferAttribute(
    new Float32Array(glass.edges.length * 18),
    3,
  ).setUsage(DynamicDrawUsage)
  outlineGeometry.setAttribute('position', outlinePositions)
  const outline = new Mesh(
    outlineGeometry,
    keep(new MeshBasicMaterial({ color: palette.glass, side: DoubleSide })),
  )
  outline.frustumCulled = false
  hourglass.add(outline)

  // Sealed letters: small black sparks on the surface of the top sand.
  const sparkMap = keep(sparkTexture(palette.glint))
  const sparks: Sprite[] = []
  const sparkSprite = () => {
    const sprite = new Sprite(
      keep(
        new SpriteMaterial({
          map: sparkMap,
          transparent: true,
          clippingPlanes: [topPlane],
        }),
      ),
    )
    sprite.scale.setScalar(SPARK_SIZE)
    hourglass.add(sprite)
    sparks.push(sprite)
    return sprite
  }

  // The falling stream, in world space so it always falls straight down.
  const grainGeometry = keep(new SphereGeometry(GRAIN_RADIUS, 6, 4))
  const grainMaterial = keep(new MeshBasicMaterial({ color: palette.sand }))
  const grains = Array.from({ length: 28 }, () => {
    const grain = new Mesh(grainGeometry, grainMaterial)
    grain.visible = false
    grain.userData = { velocity: 0 }
    scene.add(grain)
    return grain
  })
  let untilNextGrain = 0
  let lastSecond = -1

  const neck = new Vector3()
  const point = new Vector3()
  const cameraLocal = new Vector3()
  const toView = new Matrix4()
  const direction = new Vector3()
  const side = new Vector3()
  const corner = new Vector3()

  function levelInWorld(y: number): number {
    return point.set(0, y, 0).applyMatrix4(hourglass.matrixWorld).y
  }

  function drawOutline() {
    cameraLocal.copy(camera.position)
    hourglass.worldToLocal(cameraLocal)
    toView.multiplyMatrices(camera.matrixWorldInverse, hourglass.matrixWorld)
    const viewX = (v: Vector3) => point.copy(v).applyMatrix4(toView).x
    let n = 0
    const put = (v: Vector3) => outlinePositions.setXYZ(n++, v.x, v.y, v.z)
    for (const { a, b } of outlineEdges(glass, cameraLocal)) {
      const halfA = strokeWidth(a.y, viewX(a), LINE_WEIGHT) / 2
      const halfB = strokeWidth(b.y, viewX(b), LINE_WEIGHT) / 2
      // A thin strip facing the camera, stretched a little past each end so
      // neighbouring strips overlap without gaps at the joins.
      direction.subVectors(b, a).normalize()
      side.crossVectors(direction, point.subVectors(cameraLocal, a)).normalize()
      const corners = [
        [a, -halfA, halfA],
        [a, -halfA, -halfA],
        [b, halfB, halfB],
        [b, halfB, halfB],
        [a, -halfA, -halfA],
        [b, halfB, -halfB],
      ] as const
      for (const [end, along, across] of corners) {
        put(
          corner
            .copy(end)
            .addScaledVector(direction, along)
            .addScaledVector(side, across),
        )
      }
    }
    outlinePositions.needsUpdate = true
    outlineGeometry.setDrawRange(0, n)
  }

  function drawSparks(frame: SceneFrame) {
    while (sparks.length < frame.sparks.length) sparkSprite()
    sparks.forEach((sprite, i) => {
      const spark = frame.sparks[i]
      sprite.visible = spark !== undefined
      if (!spark) return
      sprite.position.copy(
        sparkPosition(spark.share, 1 - frame.lived, spark.seed),
      )
      sprite.material.opacity =
        0.35 + 0.65 * Math.abs(Math.sin(frame.time * 1.4 + spark.seed * 6))
    })
  }

  function drawStream(frame: SceneFrame, dt: number, pileTop: number) {
    if (!frame.streaming) {
      for (const grain of grains) grain.visible = false
      return
    }
    neck.set(0, 0, 0).applyMatrix4(hourglass.matrixWorld)
    const release = (heartbeat: boolean) => {
      const grain = grains.find((g) => !g.visible)
      if (!grain) return
      grain.visible = true
      grain.scale.setScalar(heartbeat ? 2 : 1)
      grain.position.set(
        neck.x + (heartbeat ? 0 : (Math.random() - 0.5) * 0.02),
        neck.y - 0.02,
        neck.z,
      )
      grain.userData.velocity = 0.2
    }
    // A fine trickle, plus a larger grain at the start of every second.
    untilNextGrain -= dt
    if (untilNextGrain <= 0) {
      untilNextGrain = 0.06
      release(false)
    }
    const second = Math.floor(frame.time)
    if (second !== lastSecond) {
      lastSecond = second
      release(true)
    }
    for (const grain of grains) {
      if (!grain.visible) continue
      grain.userData.velocity += 3.5 * dt
      grain.position.y -= grain.userData.velocity * dt
      if (grain.position.y < pileTop) grain.visible = false
    }
  }

  return {
    resize(width, height, pixelRatio) {
      renderer.setPixelRatio(Math.min(pixelRatio, 2))
      renderer.setSize(width, height, false)
      const aspect = width / Math.max(height, 1)
      camera.aspect = aspect
      // Step back on narrow screens so the whole hourglass stays in view.
      camera.position.z = aspect < 0.6 ? 7.2 * (0.6 / aspect) : 7.2
      camera.updateProjectionMatrix()
    },

    render(frame, dt) {
      const { spin, tiltX, tiltZ } = frame.motion
      hourglass.rotation.set(tiltX, spin, tiltZ, 'XZY')
      hourglass.updateMatrixWorld()

      topPlane.constant = levelInWorld(topSandLevel(1 - frame.lived))
      const pileTop = levelInWorld(pileSandLevel(frame.lived))
      pilePlane.constant = pileTop

      drawOutline()
      drawSparks(frame)
      drawStream(frame, dt, pileTop)
      renderer.render(scene, camera)
    },

    dispose() {
      for (const item of disposables) item.dispose()
      renderer.dispose()
    },
  }
}
