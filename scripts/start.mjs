import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as wait } from 'node:timers/promises'
import { dataDirectory, logPath, root } from './paths.mjs'
import { lockDataDirectory } from './data-lock.mjs'

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const port = Number(process.env.HAPROSPECTION_PORT || '4173')
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('HAPROSPECTION_PORT must be an integer between 1024 and 65535.')
  process.exit(1)
}

const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
if (!existsSync(vite) || !existsSync(join(root, 'dist', 'index.html'))) {
  console.error('Run npm ci and npm run build before starting HA Prospection.')
  process.exit(1)
}

try {
  lockDataDirectory()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
const url = `http://127.0.0.1:${port}/`
console.log(`HA Prospection ${version}\nData: ${dataDirectory}\nLog: ${logPath}`)

function log(message) {
  try {
    appendFileSync(logPath, message)
  } catch (error) {
    console.error('Could not write the application log:', error.message)
  }
}

log(`\n${new Date().toISOString()} Starting HA Prospection ${version}\n`)
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: root,
  env: { ...process.env, HAPROSPECTION_DATA_DIR: dataDirectory, HAPROSPECTION_LOG_PATH: logPath },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let stopping = false
let announced = false
for (const [stream, output] of [[server.stdout, process.stdout], [server.stderr, process.stderr]]) {
  stream.on('data', chunk => {
    log(chunk)
    output.write(chunk)
    if (stream === server.stdout && String(chunk).includes(url)) announced = true
  })
}
server.on('error', error => {
  console.error(error.message)
  log(error.message + '\n')
  process.exitCode = 1
})
server.on('exit', code => {
  stopping = true
  if (code !== 0 && !process.exitCode && !server.signalCode) process.exitCode = code ?? 1
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stopping = true
    server.kill()
  })
}

async function openWhenReady() {
  for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
    if (announced) {
      try {
        const response = await fetch(new URL('api/discovery', url), { signal: AbortSignal.timeout(500) })
        if (response.ok) {
          console.log(`Open ${url} in your browser. Press Ctrl+C here to stop.\n`)
          if (!process.argv.includes('--no-browser')) {
            const [command, args] = process.platform === 'win32'
              ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
              : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]]
            const browser = spawn(command, args, { stdio: 'ignore', windowsHide: true })
            browser.on('error', () => console.log(`Open ${url} manually.`))
            browser.unref()
          }
          return
        }
      } catch {
        // Wait for the local server to finish starting.
      }
    }
    await wait(250)
  }
  if (!stopping && !server.killed) {
    console.error('The local app did not start. See the log path above.')
    process.exitCode = 1
    server.kill()
  }
}

void openWhenReady()
