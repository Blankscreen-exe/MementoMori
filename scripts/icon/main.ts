// Renders one still frame of the app's 3D hourglass for the icon.
import { createHourglassScene } from '../../src/features/hourglass/scene3d'

const SIZE = 1024
const canvas = document.getElementById('icon') as HTMLCanvasElement
const scene = createHourglassScene(canvas, {
  canvas: '#000000',
  glass: '#ffffff',
  sand: '#ffffff',
  glint: '#000000',
  unrecorded: '#ffffff',
  missed: '#ffffff',
})
scene.resize(SIZE, SIZE, 1)
scene.render(
  {
    lived: 0.4,
    sparks: [],
    motion: { spin: 0.35, tiltX: 0, tiltZ: 0 },
    streaming: false,
    time: 0,
  },
  0,
)
document.body.dataset.ready = 'true'
