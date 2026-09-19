import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reflectionForLaunch } from './features/reflection/launch'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App launchReflection={reflectionForLaunch()} />
  </StrictMode>,
)
