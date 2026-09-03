export type NumberInputError = 'required' | 'positiveInteger'

export function parsePositiveInteger(value: string): bigint | NumberInputError {
  if (value.length === 0) return 'required'
  if (!/^[1-9][0-9]*$/.test(value)) return 'positiveInteger'
  return BigInt(value)
}

export function isParsedNumber(value: bigint | NumberInputError): value is bigint {
  return typeof value === 'bigint'
}
