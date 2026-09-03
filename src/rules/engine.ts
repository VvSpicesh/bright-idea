import type { CalculationStep, DivinationResult, RuleSystem } from './model'

function requirePositiveInteger(value: bigint, label: string): void {
  if (value < 1n) {
    throw new RangeError(`${label} 必须是正整数`)
  }
}

function calculateStep(startIndex: number, input: bigint, palaceCount: bigint): CalculationStep {
  const zeroBasedInput = input - 1n
  const rounds = zeroBasedInput / palaceCount
  const remainder = zeroBasedInput % palaceCount
  const endIndex = Number((BigInt(startIndex) + remainder) % palaceCount)

  return {
    startIndex,
    input: input.toString(10),
    rounds: rounds.toString(10),
    remainder: remainder.toString(10),
    endIndex,
  }
}

export function calculateThreePasses(
  ruleSystem: RuleSystem,
  inputs: readonly [bigint, bigint, bigint],
): DivinationResult {
  inputs.forEach((input, index) => requirePositiveInteger(input, `第${index + 1}个输入`))
  if (ruleSystem.palaces.length === 0) {
    throw new RangeError('规则体系至少需要一个宫位')
  }

  const palaceCount = BigInt(ruleSystem.palaces.length)
  const firstStep = calculateStep(0, inputs[0], palaceCount)
  const secondStep = calculateStep(firstStep.endIndex, inputs[1], palaceCount)
  const thirdStep = calculateStep(secondStep.endIndex, inputs[2], palaceCount)
  const steps = [firstStep, secondStep, thirdStep] as const

  return {
    ruleSystemId: ruleSystem.id,
    ruleVersion: ruleSystem.ruleVersion,
    inputs: inputs.map((input) => input.toString(10)) as [string, string, string],
    first: ruleSystem.palaces[firstStep.endIndex],
    second: ruleSystem.palaces[secondStep.endIndex],
    third: ruleSystem.palaces[thirdStep.endIndex],
    steps,
  }
}
