import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

const packageDir = path.resolve('node_modules', 'dictionary-fa')
const targetDir = path.resolve('public', 'dictionaries', 'fa')

function findFile(extension) {
  const candidates = [packageDir, path.join(packageDir, 'dist')]
  for (const directory of candidates) {
    if (!existsSync(directory)) continue
    const match = readdirSync(directory).find((name) => name.endsWith(extension))
    if (match) return path.join(directory, match)
  }
  return null
}

const aff = findFile('.aff')
const dic = findFile('.dic')

if (!aff || !dic) {
  console.error('[dictionary] dictionary-fa پیدا نشد. ابتدا اجرا کنید: pnpm add nspell dictionary-fa')
  process.exit(process.env.CI ? 1 : 0)
}

mkdirSync(targetDir, { recursive: true })
copyFileSync(aff, path.join(targetDir, 'fa.aff'))
copyFileSync(dic, path.join(targetDir, 'fa.dic'))
console.log('[dictionary] fa.aff و fa.dic در public/dictionaries/fa کپی شد.')
