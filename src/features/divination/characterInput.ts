export const STROKE_DATA_SOURCE = 'breezyreeds/kangxi-strokecount'
export const STROKE_DATA_COMMIT = '778d23d0566066ab19906557755b882818ec0a06'
export const STROKE_DATA_VERSION = `commit ${STROKE_DATA_COMMIT.slice(0, 7)}`

const strokeChunks = import.meta.glob('./stroke-data/*.json', {
  eager: false,
  import: 'default',
}) as Record<string, () => Promise<Record<string, number>>>

export type CharacterInputError = 'required' | 'characterCount' | 'invalidCharacter'

export interface CharacterEntry {
  readonly original: string
  readonly traditional: string
  readonly dataStrokeCount?: number
  readonly finalStrokeCount?: number
  readonly manualStrokeCount?: number
}

export function normalizeCharacters(value: string): string {
  return value.replace(/\s/g, '')
}

export function validateCharacters(value: string): CharacterInputError | null {
  if (value.length === 0) return 'required'
  const characters = [...normalizeCharacters(value)]
  if (characters.length !== 3) return 'characterCount'
  if (characters.some((character) => !/^\p{Script=Han}$/u.test(character))) return 'invalidCharacter'
  return null
}

export async function convertCharacters(value: string): Promise<string> {
  const { default: OpenCC } = await import('opencc-js/cn2t')
  return OpenCC.Converter({ from: 'cn', to: 'tw' })(normalizeCharacters(value))
}

function chunkPath(character: string): string {
  const codePoint = character.codePointAt(0)!
  return `./stroke-data/${Math.floor(codePoint / 4096).toString(16).toUpperCase()}.json`
}

export async function lookupStrokeCount(character: string): Promise<number | undefined> {
  const loadChunk = strokeChunks[chunkPath(character)]
  if (!loadChunk) return undefined
  const data = await loadChunk()
  return data[character]
}

export async function createCharacterEntries(value: string): Promise<CharacterEntry[]> {
  const originalCharacters = [...normalizeCharacters(value)]
  const traditionalCharacters = [...await convertCharacters(value)]
  return Promise.all(originalCharacters.map(async (original, index) => {
    const traditional = traditionalCharacters[index] ?? original
    const dataStrokeCount = await lookupStrokeCount(traditional)
    return { original, traditional, dataStrokeCount, finalStrokeCount: dataStrokeCount }
  }))
}
