import { closeSync, mkdirSync, openSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { dataDirectory } from './paths.mjs'

export function lockDataDirectory() {
  mkdirSync(dataDirectory, { recursive: true })
  const path = join(dataDirectory, 'release.lock')
  try {
    closeSync(openSync(path, 'wx'))
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`Stop the launcher or restore operation using this data folder: ${dataDirectory}`)
    }
    throw error
  }
  process.once('exit', () => unlinkSync(path))
}
