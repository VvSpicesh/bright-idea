import { describe, expect, it } from 'vitest'
import { convertCharacters, createCharacterEntries, normalizeCharacters, validateCharacters } from './characterInput'

describe('三字转换与笔画数据', () => {
  it('converts a phrase before looking up strokes', async () => {
    expect(await convertCharacters('发展顺')).toBe('發展順')
    const entries = await createCharacterEntries('发展顺')
    expect(entries.map((entry) => entry.dataStrokeCount)).toEqual([12, 10, 12])
  })

  it('handles unchanged traditional characters and spaces', async () => {
    expect(normalizeCharacters('  天  地 人\n')).toBe('天地人')
    expect(await convertCharacters('天地人')).toBe('天地人')
    expect(validateCharacters('  天 地 人 ')).toBeNull()
  })

  it.each(['天地!', '天1地', '天a地', '天地', '天地人和', '天 地 !'])('rejects invalid character content: %s', (value) => {
    expect(validateCharacters(value)).not.toBeNull()
  })

  it('counts Unicode code points without splitting extension characters', () => {
    expect([...normalizeCharacters('𠀀天地')]).toHaveLength(3)
    expect(validateCharacters('𠀀天地')).toBeNull()
  })

  it('returns no guessed count for an unavailable character', async () => {
    const entries = await createCharacterEntries(`${String.fromCodePoint(0x31350)}天地`)
    expect(entries[0].dataStrokeCount).toBeUndefined()
    expect(entries[1].dataStrokeCount).toBeGreaterThan(0)
  })
})
