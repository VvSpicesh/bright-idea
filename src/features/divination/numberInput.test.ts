import { describe, expect, it } from 'vitest'
import { isParsedNumber, parsePositiveInteger } from './numberInput'

describe('三数输入校验', () => {
  it.each(['', '0', '-1', '1.5', '1e3', 'abc', '１２'])('rejects %s', (value) => {
    expect(parsePositiveInteger(value)).not.toSatisfy(isParsedNumber)
  })

  it('accepts positive integers as bigint, including values beyond safe number range', () => {
    const value = '900719925474099312345678901234567890'
    const parsed = parsePositiveInteger(value)
    expect(isParsedNumber(parsed)).toBe(true)
    expect(parsed).toBe(BigInt(value))
  })
})
