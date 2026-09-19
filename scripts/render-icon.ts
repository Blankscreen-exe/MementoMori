/**
 * Renders the app icon from the real 3D hourglass: serves scripts/icon with
 * Vite, opens it in headless Chrome, and saves the still frame to
 * public/icon.png. `pwa-assets-generator` then makes every size from it (see
 * pwa-assets.config.ts). Run both with `bun run icons`.
 *
 * Needs Chrome. Set CHROME_PATH if it isn't in the usual place.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const OUTPUT = new URL('../public/icon.png', import.meta.url)
const SIZE = 1024
const CHROME =
  process.env.CHROME_PATH ??
  {
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    linux: 'google-chrome',
  }[process.platform as 'win32' | 'darwin' | 'linux']

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const server = await createServer({
  root: new URL('./icon', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'),
  configFile: false,
  logLevel: 'error',
  server: { port: 5199, strictPort: true },
})
await server.listen()

const debugPort = 9420
const chrome = spawn(CHROME, [
  '--headless=new',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'icon-'))}`,
  'about:blank',
])

try {
  let targets: Array<{ type: string; webSocketDebuggerUrl: string }> = []
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`)
      targets = (await response.json()) as typeof targets
    } catch {
      await sleep(200)
    }
  }
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('Chrome did not start.')

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve) => socket.addEventListener('open', resolve))
  let nextId = 0
  const pending = new Map<number, (result: unknown) => void>()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    pending.get(message.id)?.(message.result)
    pending.delete(message.id)
  })
  const send = <T>(method: string, params: object = {}) =>
    new Promise<T>((resolve) => {
      const id = ++nextId
      pending.set(id, resolve as (result: unknown) => void)
      socket.send(JSON.stringify({ id, method, params }))
    })

  await send('Emulation.setDeviceMetricsOverride', {
    width: SIZE,
    height: SIZE,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', { url: 'http://localhost:5199/' })
  for (let i = 0; i < 50; i++) {
    const { result } = await send<{ result: { value: boolean } }>(
      'Runtime.evaluate',
      {
        expression: 'document.body.dataset.ready === "true"',
        returnByValue: true,
      },
    )
    if (result.value) break
    await sleep(200)
  }
  const { data } = await send<{ data: string }>('Page.captureScreenshot', {
    format: 'png',
  })
  writeFileSync(OUTPUT, Buffer.from(data, 'base64'))
  console.log('Wrote public/icon.png')
  socket.close()
} finally {
  chrome.kill()
  await server.close()
}
