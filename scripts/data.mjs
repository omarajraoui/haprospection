import { copyFileSync, existsSync, renameSync, rmSync, constants } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { dataDirectory, databasePath } from './paths.mjs'
import { lockDataDirectory } from './data-lock.mjs'

function validate(path) {
  if (!existsSync(path)) throw new Error(`Database file does not exist: ${path}`)
  const database = new DatabaseSync(path, { readOnly: true })
  try {
    if (database.prepare('PRAGMA quick_check').get().quick_check !== 'ok'
      || !database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'sessions'").get()
      || !database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'reviews'").get()) {
      throw new Error('The file is not a valid HA Prospection database.')
    }
  } finally {
    database.close()
  }
}

function snapshot(input, output) {
  validate(input)
  const database = new DatabaseSync(input, { readOnly: true })
  const draft = `${output}.${randomUUID()}.tmp`
  try {
    database.prepare('VACUUM INTO ?').run(draft)
    copyFileSync(draft, output, constants.COPYFILE_EXCL)
  } finally {
    database.close()
    rmSync(draft, { force: true })
  }
}

try {
  const [action, file] = process.argv.slice(2)
  if (!file || !['backup', 'restore'].includes(action)) {
    throw new Error('Usage: npm run backup -- <file.sqlite> or npm run restore -- <file.sqlite>')
  }
  const path = resolve(file)
  if (path === databasePath) throw new Error('Choose a path outside the active database file.')
  if (action === 'backup') {
    snapshot(databasePath, path)
    console.log(`Backup created: ${path}`)
  } else {
    lockDataDirectory()
    const pending = join(dataDirectory, `restore-${randomUUID()}.sqlite`)
    try {
      snapshot(path, pending)
      if (existsSync(databasePath)) {
        const before = join(dataDirectory, `before-restore-${randomUUID()}.sqlite`)
        snapshot(databasePath, before)
        console.log(`Previous data saved: ${before}`)
      }
      for (const suffix of ['-wal', '-shm', '-journal']) {
        if (existsSync(databasePath + suffix)) {
          throw new Error('Close all app windows and stop the server cleanly before restoring.')
        }
      }
      renameSync(pending, databasePath)
      console.log(`Restored: ${databasePath}`)
    } finally {
      rmSync(pending, { force: true })
    }
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
