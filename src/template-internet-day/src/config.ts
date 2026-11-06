import type { Language } from './types'

/** Rules shared across the template. Event content belongs in schema.json, not here. */

/** Language used when a requested one has no copy. */
export const DEFAULT_LANGUAGE: Language = 'vi'

/** Intl locale for counts and dates in each page language. */
export const LOCALE_BY_LANGUAGE: Record<Language, string> = { vi: 'vi-VN', en: 'en-GB' }

export const SESSION_DATE_FORMAT: Record<Language, Intl.DateTimeFormatOptions> = {
  vi: { day: '2-digit', month: '2-digit', year: 'numeric' },
  en: { day: 'numeric', month: 'short', year: 'numeric' },
}

/** Prices read the same in every language, as the brief requires. */
export const PRICE_FORMAT = { locale: 'vi-VN', suffix: ' đ' }

/** Each submission registers one ticket for one person. */
export const TICKET_QUANTITY = 1

/** With fewer sessions than this there is nothing to choose, so the selector stays hidden. */
export const MIN_SESSIONS_TO_CHOOSE = 2

/** Below this width the form uses the portrait page of the print form. Keep in step with index.css. */
export const PORTRAIT_POSTER_MEDIA = '(max-width: 1023px)'

/** Session choices per row; a short first row keeps the rest aligned, as on the print form. */
export const SESSION_COLUMNS = 3

/** Joins the names of several chosen sessions. */
export const LIST_SEPARATOR = ', '

/** Shared by the form heading and the hero link that jumps to it. */
export const FORM_HEADING_ID = 'rp-form-heading'

/** Keep in step with the 640px breakpoint used by Tailwind and index.css. */
export const MOBILE_BANNER_MEDIA = '(max-width: 639px)'

export const THEME_DEFAULTS = {
  // Neutral values used only when an event has not set its own colors.
  colors: { primary: '#0f766e', secondary: '#1d4ed8', background: '#ffffff' },
  // Backgrounds brighter than this get dark text.
  lightBackgroundLuminance: 0.4,
  inkOnLight: '#04191a',
  inkOnDark: '#ffffff',
}
