import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = dirname(dirname(fileURLToPath(import.meta.url)))
const platformDirectory = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'HA Prospection')
  : process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support', 'HA Prospection')
    : join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'ha-prospection')

export const dataDirectory = resolve(process.env.HAPROSPECTION_DATA_DIR || platformDirectory)
export const databasePath = join(dataDirectory, 'prospection.sqlite')
export const logPath = join(dataDirectory, 'app.log')
