import { LOCALE_BY_LANGUAGE, PRICE_FORMAT, SESSION_DATE_FORMAT } from '../config'
import type { Language, TicketType } from '../types'

const numberFormat = new Intl.NumberFormat(PRICE_FORMAT.locale)

export function toAmount(value: string | number | null | undefined): number {
  const amount = Number.parseFloat(String(value ?? '0'))
  return Number.isFinite(amount) ? amount : 0
}

/** Formats as "0 đ" / "150.000 đ" in both languages, as the brief requires. */
export function formatPrice(value: string | number | null | undefined): string {
  return `${numberFormat.format(toAmount(value))}${PRICE_FORMAT.suffix}`
}

export type TicketStatus = 'open' | 'soldOut' | 'notOpen'

export function getTicketStatus(ticket: TicketType, now: number): TicketStatus {
  const start = Date.parse(ticket.sale_start_time)
  const end = Date.parse(ticket.sale_end_time)
  if (Number.isFinite(start) && now < start) return 'notOpen'
  if (ticket.available_quantity <= 0) return 'soldOut'
  if (Number.isFinite(end) && now > end) return 'soldOut'
  return 'open'
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/

/**
 * Reads the local time written in the ISO string instead of converting it, so a session
 * shows the venue's time whatever time zone the visitor is in.
 */
export function formatSessionTime(start: string, end: string, language: Language): string {
  const from = WALL_CLOCK.exec(start ?? '')
  const to = WALL_CLOCK.exec(end ?? '')
  if (!from) return ''

  const day = new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    ...SESSION_DATE_FORMAT[language],
    timeZone: 'UTC',
  }).format(Date.UTC(Number(from[1]), Number(from[2]) - 1, Number(from[3])))

  const startTime = `${from[4]}:${from[5]}`
  return to ? `${day}, ${startTime}–${to[4]}:${to[5]}` : `${day}, ${startTime}`
}
