import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

const background = '#000000'

// The source icon already has its own dark background. Maskable and Apple
// icons get extra dark padding so the glass stays inside their safe zones.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.3,
      resizeOptions: { background },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.3,
      resizeOptions: { background },
    },
  },
  images: ['public/favicon.svg'],
})
