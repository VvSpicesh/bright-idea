import { Solar } from 'lunar-typescript'

export type DivinationMethod = 'number' | 'character' | 'random' | 'time'

export interface TimeDivinationValues {
  readonly date: Date
  readonly solarText: string
  readonly lunarYear: number
  readonly lunarMonth: number
  readonly lunarDay: number
  readonly leapMonth: boolean
  readonly lunarText: string
  readonly shichenName: string
  readonly shichenIndex: number
  readonly inputs: readonly [number, number, number]
}

const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

function getSecureRandomUint32(): number {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) throw new Error('当前环境不支持安全随机数')
  const value = new Uint32Array(1)
  cryptoApi.getRandomValues(value)
  return value[0]
}

export function randomInteger(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) throw new RangeError('随机数范围无效')
  const range = max - min + 1
  const limit = Math.floor(0x100000000 / range) * range
  let value = getSecureRandomUint32()
  while (value >= limit) value = getSecureRandomUint32()
  return min + (value % range)
}

export function generateRandomInputs(): [number, number, number] {
  return [randomInteger(1, 18), randomInteger(1, 18), randomInteger(1, 18)]
}

export function formatDateTimeLocal(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError('日期时间无效')
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDateTimeLocal(value: string): Date {
  const match = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) throw new RangeError('请输入有效的日期时间')
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] = match
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText), Number(hourText), Number(minuteText), Number(secondText))
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== Number(yearText) || date.getMonth() !== Number(monthText) - 1 || date.getDate() !== Number(dayText) || date.getHours() !== Number(hourText) || date.getMinutes() !== Number(minuteText) || date.getSeconds() !== Number(secondText)) {
    throw new RangeError('请输入有效的日期时间')
  }
  return date
}

export function getShichen(hour: number): { name: string; index: number } {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError('小时无效')
  const index = hour >= 23 || hour < 1 ? 1 : Math.floor((hour - 1) / 2) + 2
  return { name: SHICHEN_NAMES[index - 1], index }
}

export function convertTimeDivination(value: string | Date): TimeDivinationValues {
  const date = typeof value === 'string' ? parseDateTimeLocal(value) : new Date(value.getTime())
  if (Number.isNaN(date.getTime())) throw new RangeError('日期时间无效')
  const lunar = Solar.fromDate(date).getLunar()
  const lunarMonth = Math.abs(lunar.getMonth())
  const lunarDay = lunar.getDay()
  const shichen = getShichen(date.getHours())
  return {
    date,
    solarText: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
    lunarYear: lunar.getYear(),
    lunarMonth,
    lunarDay,
    leapMonth: lunar.getMonth() < 0,
    lunarText: `${lunar.getYear()}年${lunar.getMonth() < 0 ? '闰' : ''}${lunarMonth}月${lunarDay}日`,
    shichenName: shichen.name,
    shichenIndex: shichen.index,
    inputs: [lunarMonth, lunarDay, shichen.index],
  }
}
