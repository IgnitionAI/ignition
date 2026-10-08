// Vérifie que les locales fr/en ont exactement les mêmes clés.
import { readFileSync } from 'node:fs'

const keys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  )

const fr = keys(JSON.parse(readFileSync(new URL('../src/locales/fr.json', import.meta.url))))
const en = keys(JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url))))

const missing = fr.filter((k) => !en.includes(k)).concat(en.filter((k) => !fr.includes(k)))
if (missing.length > 0) {
  console.error(`Clés désynchronisées fr/en : ${missing.join(', ')}`)
  process.exit(1)
}
console.log(`OK — ${fr.length} clés identiques dans fr et en.`)
