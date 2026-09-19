import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

const background = '#000000'

// The rendered icon already has its own black background. Maskable and Apple
// icons get extra black padding so the hourglass stays inside their safe zones.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.1,
      resizeOptions: { background },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.1,
      resizeOptions: { background },
    },
  },
  images: ['public/icon.png'],
})
