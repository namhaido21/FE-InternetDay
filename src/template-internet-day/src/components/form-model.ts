import { MIN_SESSIONS_TO_CHOOSE, TICKET_QUANTITY } from '../config'
import type { ErrorKey, TextKey } from '../i18n'
import type { Language, RegistrationRequest, Session, TicketType } from '../types'
import type { ResolvedContent } from './content'
import { getTicketStatus, toAmount } from './format'

type FormFlags = ResolvedContent['form']

/** Add a key here, a row in ATTENDEE_FIELDS and a label in i18n.ts to get a new field. */
export type AttendeeFieldKey =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'position'
  | 'workplace'
  | 'company'
  | 'industry'
  | 'role'

export interface AttendeeFieldConfig {
  key: AttendeeFieldKey
  labelKey: TextKey
  helpKey?: TextKey
  type?: 'text' | 'email' | 'tel'
  inputMode?: 'text' | 'email' | 'tel'
  autoComplete?: string
  /** Having this makes the field required. */
  requiredError?: ErrorKey
  format?: { pattern: RegExp; error: ErrorKey; normalize?: (value: string) => string }
  /** The Form flag in schema.json that switches this field on or off. */
  toggle?: 'showCompany' | 'showPosition' | 'showWorkplace' | 'showIndustry' | 'showRole'
  /** Makes the field a drop-down fed by this list in schema.json; an empty list hides it. */
  options?: 'industryOptions' | 'roleOptions'
  /** Places the field under the session choice, as on the print form. */
  afterSession?: boolean
  /**
   * Where an optional field travels in RegistrationRequest. Without it the answer stays on this
   * page, because the agreed request has no slot for it yet.
   */
  request?: {
    issuer: 'order_issuer_company' | 'order_issuer_position'
    holder: 'company' | 'position'
  }
}

/** Visitors often type spaces in phone numbers; they carry no meaning, so they are dropped. */
export const normalizePhone = (value: string) => value.replace(/\s+/g, '')

/** One row per field, in page order. The form, validation, confirmation and request all read this. */
export const ATTENDEE_FIELDS: AttendeeFieldConfig[] = [
  { key: 'fullName', labelKey: 'fullName', autoComplete: 'name', requiredError: 'fullNameRequired' },
  {
    key: 'email',
    labelKey: 'email',
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    requiredError: 'emailRequired',
    format: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, error: 'emailInvalid' },
  },
  {
    key: 'phone',
    labelKey: 'phone',
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    requiredError: 'phoneRequired',
    format: { pattern: /^\+?\d{9,11}$/, error: 'phoneInvalid', normalize: normalizePhone },
  },
  {
    key: 'position',
    labelKey: 'position',
    autoComplete: 'organization-title',
    toggle: 'showPosition',
    request: { issuer: 'order_issuer_position', holder: 'position' },
  },
  { key: 'workplace', labelKey: 'workplace', toggle: 'showWorkplace' },
  {
    key: 'company',
    labelKey: 'company',
    autoComplete: 'organization',
    toggle: 'showCompany',
    request: { issuer: 'order_issuer_company', holder: 'company' },
  },
  { key: 'industry', labelKey: 'industry', toggle: 'showIndustry', options: 'industryOptions' },
  { key: 'role', labelKey: 'role', toggle: 'showRole', options: 'roleOptions', afterSession: true },
]

export type AttendeeForm = Record<AttendeeFieldKey, string> & { termsAccepted: boolean }

export const EMPTY_FORM = {
  ...Object.fromEntries(ATTENDEE_FIELDS.map((field) => [field.key, ''])),
  termsAccepted: false,
} as AttendeeForm

export type FieldKey = 'ticket' | 'session' | 'terms' | AttendeeFieldKey
export type FormErrors = Partial<Record<FieldKey, ErrorKey>>

/** Same order as the page, so focus lands on the topmost invalid field. */
export const FIELD_ORDER: FieldKey[] = [
  ...ATTENDEE_FIELDS.filter((field) => !field.afterSession).map((field) => field.key),
  'session',
  ...ATTENDEE_FIELDS.filter((field) => field.afterSession).map((field) => field.key),
  'ticket',
  'terms',
]

export const isFieldEnabled = (field: AttendeeFieldConfig, flags: FormFlags) =>
  (!field.toggle || flags[field.toggle]) && (!field.options || flags[field.options].length > 0)

/** The answer as the visitor saw it: drop-downs store a value but show its label. */
export function fieldAnswer(field: AttendeeFieldConfig, form: AttendeeForm, flags: FormFlags) {
  const value = form[field.key].trim()
  const option = field.options && flags[field.options].find((item) => item.value === value)
  return option ? option.label : value
}

export const requiresSessionChoice = (sessionsCount: number) => sessionsCount >= MIN_SESSIONS_TO_CHOOSE

/** The one session of a single-session event; there is nothing to choose, but it is still shown. */
export const onlySession = (sessions: Session[]) => (sessions.length === 1 ? sessions[0] : null)

/**
 * When every ticket is free there is nothing to weigh up, so the first one on sale is taken for
 * the visitor. Returns null when a choice is still needed, or when nothing is on sale and the
 * visitor has to be told why.
 */
export function automaticTicket(tickets: TicketType[], now: number): TicketType | null {
  if (tickets.some((ticket) => toAmount(ticket.price) > 0)) return null
  return tickets.find((ticket) => getTicketStatus(ticket, now) === 'open') ?? null
}

/** True when a's time range holds all of b's and is longer, as a full day does with a morning. */
function covers(a: Session, b: Session) {
  const [aStart, aEnd, bStart, bEnd] = [a.start_time, a.end_time, b.start_time, b.end_time].map((time) => Date.parse(time))
  return aStart <= bStart && aEnd >= bEnd && (aStart < bStart || aEnd > bEnd)
}

/**
 * The choice after one session is clicked. Picking a session drops any it contains or is contained
 * by, so a visitor cannot hold both the full day and part of it.
 */
export function nextSessionChoice(current: string[], code: string, sessions: Session[], multiple: boolean): string[] {
  if (!multiple) return [code]
  if (current.includes(code)) return current.filter((item) => item !== code)
  const find = (target: string) => sessions.find((session) => session.session_code === target)
  const picked = find(code)
  const kept = current.filter((item) => {
    const other = find(item)
    return !(picked && other && (covers(picked, other) || covers(other, picked)))
  })
  return [...kept, code]
}

export function validateTextField(key: AttendeeFieldKey, value: string): ErrorKey | undefined {
  const field = ATTENDEE_FIELDS.find((item) => item.key === key)
  const trimmed = value.trim()
  if (!trimmed) return field?.requiredError
  if (!field?.format) return undefined
  const { pattern, normalize, error } = field.format
  return pattern.test(normalize ? normalize(trimmed) : trimmed) ? undefined : error
}

export function validateForm(
  form: AttendeeForm,
  ticketCode: string | null,
  hasSession: boolean,
  sessionsCount: number,
  flags: FormFlags,
): FormErrors {
  const errors: FormErrors = {
    ticket: ticketCode ? undefined : 'ticketRequired',
    session: requiresSessionChoice(sessionsCount) && !hasSession ? 'sessionRequired' : undefined,
    terms: flags.showTerms && !form.termsAccepted ? 'termsRequired' : undefined,
  }
  // A switched-off field cannot be filled in, so it must not block the form.
  for (const field of ATTENDEE_FIELDS) {
    if (isFieldEnabled(field, flags)) errors[field.key] = validateTextField(field.key, form[field.key])
  }
  // Keep only real errors, so the key count equals the number of problems.
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value)) as FormErrors
}

/** Optional answers for one side of the request, keyed by that side's field names. */
function optionalAnswers(form: AttendeeForm, flags: FormFlags, side: 'issuer' | 'holder') {
  return Object.fromEntries(
    ATTENDEE_FIELDS.flatMap((field) => {
      const answer = form[field.key].trim()
      return field.request && answer && isFieldEnabled(field, flags) ? [[field.request[side], answer]] : []
    }),
  ) as Record<string, string>
}

interface BuildRequestInput {
  form: AttendeeForm
  ticket: TicketType
  sessions: Session[]
  language: Language
  discountCode: string | null
  fields: FormFlags
}

export function buildRegistrationRequest({
  form,
  ticket,
  sessions,
  language,
  discountCode,
  fields,
}: BuildRequestInput): RegistrationRequest {
  const displayName = form.fullName.trim()
  const email = form.email.trim()
  const phone = normalizePhone(form.phone.trim())

  return {
    order_issuer_display_name: displayName,
    order_issuer_email: email,
    order_issuer_phone: phone,
    ...optionalAnswers(form, fields, 'issuer'),
    ticket_type: { [ticket.ticket_code]: TICKET_QUANTITY },
    ticket_holder_infos: {
      [ticket.ticket_code]: [
        {
          display_name: displayName,
          email,
          phone,
          ...optionalAnswers(form, fields, 'holder'),
        },
      ],
    },
    registered_session: sessions.map((session) => session.session_code),
    language_code: language,
    ...(discountCode ? { discount_code: discountCode } : {}),
  }
}
