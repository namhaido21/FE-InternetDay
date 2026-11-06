import { motion } from 'framer-motion'
import { Check, CircleCheckBig, LoaderCircle } from 'lucide-react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FORM_HEADING_ID, LIST_SEPARATOR, TICKET_QUANTITY } from '../config'
import type { ErrorKey, Messages } from '../i18n'
import type { DiscountResult, Language, RegistrationApi, RegistrationResult, ServerData } from '../types'
import type { ResolvedContent } from './content'
import { formatPrice, toAmount } from './format'
import {
  ATTENDEE_FIELDS,
  type AttendeeFieldConfig,
  type AttendeeFieldKey,
  type AttendeeForm,
  automaticTicket,
  buildRegistrationRequest,
  EMPTY_FORM,
  FIELD_ORDER,
  type FormErrors,
  isFieldEnabled,
  nextSessionChoice,
  onlySession,
  requiresSessionChoice,
  validateForm,
  validateTextField,
} from './form-model'
import { FieldMessage, FormSlot, SelectField, TextField } from './FormParts'
import { PosterArt } from './PosterArt'
import { SafeImage } from './SafeImage'
import { SessionSelector } from './SessionSelector'
import { TicketSelector } from './TicketSelector'
import { TicketStub } from './TicketStub'

export interface RegistrationSnapshot {
  form: AttendeeForm
  ticketCode: string
  /** Whether the visitor chose the ticket themselves, so its name and price are worth showing. */
  showTicket: boolean
  sessionCodes: string[]
  subtotal: number
  discount: { code: string; amount: string | number; total: string | number } | null
  result: RegistrationResult
}

interface RegistrationFormProps {
  content: ResolvedContent
  eventTitle: string
  serverData?: ServerData
  isPreview: boolean
  api: RegistrationApi
  language: Language
  t: Messages
  moveFocusOnMount: boolean
  onRegistered: (snapshot: RegistrationSnapshot) => void
}

/** A message from the API is already worded in one language, so it is dropped if the page switches. */
interface ApiMessage {
  message: string
  language: Language
}

export function RegistrationForm({
  content,
  eventTitle,
  serverData,
  isPreview,
  api,
  language,
  t,
  moveFocusOnMount,
  onRegistered,
}: RegistrationFormProps) {
  const tickets = serverData?.ticket_types ?? []
  const sessions = serverData?.sessions ?? []
  const fields = content.form
  const showSessions = requiresSessionChoice(sessions.length)

  const [now] = useState(() => Date.now())
  const [form, setForm] = useState<AttendeeForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [sessionCodes, setSessionCodes] = useState<string[]>([])

  const [discountInput, setDiscountInput] = useState('')
  const [discountPending, setDiscountPending] = useState(false)
  const [discountHint, setDiscountHint] = useState<ErrorKey | null>(null)
  const [discountError, setDiscountError] = useState<ApiMessage | null>(null)
  const [applied, setApplied] = useState<{ code: string; result: DiscountResult } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<ApiMessage | null>(null)
  const [previewBlocked, setPreviewBlocked] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // A ref, not state: two clicks in the same tick must not both pass the guard.
  const submitLock = useRef(false)
  // Lets a slow discount reply be ignored if the code or ticket changed while it was on its way.
  const discountRequest = useRef(0)

  useEffect(() => {
    if (!moveFocusOnMount) return
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'start' })
  }, [moveFocusOnMount])

  const autoTicket = fields.hideFreeTicketChoice ? automaticTicket(tickets, now) : null
  const ticket = autoTicket ?? tickets.find((item) => item.ticket_code === ticketCode) ?? null
  // Filtered from the event's list, so the request follows page order rather than click order.
  const chosenSessions = sessions.filter((item) => sessionCodes.includes(item.session_code))
  const subtotal = toAmount(ticket?.price)
  const discount = applied
    ? {
        code: applied.code,
        amount: applied.result.discount_total_amount,
        total: applied.result.discounted_total_price,
      }
    : null

  const message = (key: ErrorKey | undefined) => (key ? t.errors[key] : undefined)
  const errorCount = Object.keys(errors).length

  function clearError(field: keyof FormErrors) {
    setErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...rest } = current
      return rest
    })
  }

  function setText(field: AttendeeFieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    // Clear as soon as the value is fixed, but never add a new error while the visitor is typing.
    if (errors[field] && !validateTextField(field, value)) clearError(field)
    else if (errors[field]) setErrors((current) => ({ ...current, [field]: validateTextField(field, value) }))
  }

  function checkOnBlur(field: AttendeeFieldKey) {
    if (!form[field].trim()) return
    const error = validateTextField(field, form[field])
    setErrors((current) => {
      if (error) return { ...current, [field]: error }
      const { [field]: _removed, ...rest } = current
      return rest
    })
  }

  function dropAppliedDiscount() {
    discountRequest.current += 1
    setApplied(null)
    setDiscountPending(false)
    setDiscountError(null)
    setDiscountHint(null)
  }

  function selectTicket(code: string) {
    setTicketCode(code)
    clearError('ticket')
    setSubmitError(null)
    dropAppliedDiscount()
  }

  function selectSession(code: string) {
    setSessionCodes((current) => nextSessionChoice(current, code, sessions, fields.multipleSessions))
    clearError('session')
  }

  function changeDiscountInput(value: string) {
    setDiscountInput(value)
    dropAppliedDiscount()
  }

  async function applyDiscount() {
    if (discountPending) return
    const code = discountInput.trim()
    setDiscountError(null)
    if (!code) return setDiscountHint('discountEmpty')
    if (!ticket) return setDiscountHint('discountNeedsTicket')
    setDiscountHint(null)

    const requestId = ++discountRequest.current
    setDiscountPending(true)
    const response = await api.checkDiscount({
      discount_code: code,
      ticket_types: [{ ticket_type: ticket.ticket_code, quantity: TICKET_QUANTITY }],
    })
    if (requestId !== discountRequest.current) return

    setDiscountPending(false)
    if (response.ok) setApplied({ code, result: response.data })
    else setDiscountError({ message: response.message, language })
  }

  function onDiscountKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter here means "apply this code", not "send the whole form".
    if (event.key === 'Enter') {
      event.preventDefault()
      void applyDiscount()
    }
  }

  function focusFirstError(found: FormErrors) {
    const first = FIELD_ORDER.find((field) => found[field])
    if (!first || !formRef.current) return
    const target =
      formRef.current.querySelector<HTMLElement>(`[data-field="${first}"]:not(:disabled)`) ??
      formRef.current.querySelector<HTMLElement>(`[data-group="${first}"]`)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'center' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current || discountPending) return

    const found = validateForm(form, ticket?.ticket_code ?? null, chosenSessions.length > 0, sessions.length, fields)
    setErrors(found)
    setAttempted(true)
    setSubmitError(null)
    setPreviewBlocked(false)

    if (Object.keys(found).length > 0 || !ticket) {
      focusFirstError(found)
      return
    }
    if (isPreview) {
      setPreviewBlocked(true)
      return
    }

    submitLock.current = true
    setSubmitting(true)
    try {
      const response = await api.register(
        buildRegistrationRequest({
          form,
          ticket,
          sessions: showSessions ? chosenSessions : [],
          language,
          discountCode: applied?.code ?? null,
          fields,
        }),
      )
      if (response.ok) {
        onRegistered({
          form,
          ticketCode: ticket.ticket_code,
          showTicket: !autoTicket,
          sessionCodes: chosenSessions.map((item) => item.session_code),
          subtotal,
          discount,
          result: response.data,
        })
      } else {
        setSubmitError({ message: response.message, language })
      }
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  const singleSessionName = onlySession(sessions)?.name ?? null
  const visibleSubmitError = submitError?.language === language ? submitError.message : null
  const visibleDiscountError =
    discountHint !== null
      ? t.errors[discountHint]
      : discountError?.language === language
        ? discountError.message
        : null

  const enabledFields = ATTENDEE_FIELDS.filter((field) => isFieldEnabled(field, fields))

  function renderField(field: AttendeeFieldConfig) {
    if (field.options) {
      return (
        <SelectField
          key={field.key}
          label={t[field.labelKey]}
          value={form[field.key]}
          options={fields[field.options]}
          placeholder={t.selectPlaceholder}
          fieldKey={field.key}
          error={message(errors[field.key])}
          onChange={(value) => setText(field.key, value)}
        />
      )
    }
    return (
      <TextField
        key={field.key}
        label={t[field.labelKey]}
        type={field.type}
        inputMode={field.inputMode}
        value={form[field.key]}
        required={Boolean(field.requiredError)}
        autoComplete={field.autoComplete}
        fieldKey={field.key}
        help={field.helpKey && t[field.helpKey]}
        error={message(errors[field.key])}
        onChange={(value) => setText(field.key, value)}
        onBlur={() => checkOnBlur(field.key)}
      />
    )
  }

  return (
    <motion.section
      className="rp-form-shell"
      aria-labelledby={FORM_HEADING_ID}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <form ref={formRef} noValidate onSubmit={handleSubmit}>
        <div className="rp-poster" data-logos={fields.showPosterLogos}>
          <PosterArt src={fields.backgroundImage} mobileSrc={fields.backgroundImageMobile} />

          <div className="rp-poster__head">
            {/* The hero already names these logos for screen readers, so here they are decorative. */}
            {fields.showPosterLogos && <SafeImage src={content.hero.logo} alt="" className="rp-poster__logo" />}
            <h2 id={FORM_HEADING_ID} ref={headingRef} tabIndex={-1} className="rp-form-title rp-poster__title">
              {t.formHeading}
            </h2>
            {fields.showPosterLogos && (
              <SafeImage src={content.hero.partnerLogo} alt="" className="rp-poster__partner" />
            )}
          </div>

          <div className="rp-poster__body">
            <fieldset className="rp-field-stack">
              <legend className="sr-only">{t.detailsLegend}</legend>
              {enabledFields.filter((field) => !field.afterSession).map(renderField)}
            </fieldset>

            {showSessions && (
              <FormSlot className="rp-field-row__slot--wide">
                <SessionSelector
                  sessions={sessions}
                  selectedCodes={sessionCodes}
                  multiple={fields.multipleSessions}
                  onSelect={selectSession}
                  error={message(errors.session)}
                  language={language}
                  showTime={fields.showSessionTime}
                  showDescription={fields.showSessionDescription}
                  t={t}
                />
              </FormSlot>
            )}

            {enabledFields.filter((field) => field.afterSession).map(renderField)}
          </div>
        </div>

        {/* Required by the brief but absent from the print form, so they follow it. */}
        <div className="rp-form-extras">
          {!autoTicket && (
            <FormSlot>
              <TicketSelector
                tickets={tickets}
                selectedCode={ticketCode}
                now={now}
                onSelect={selectTicket}
                error={message(errors.ticket)}
                t={t}
              />
            </FormSlot>
          )}

          {fields.showDiscount && (
            <div className="rp-field-row">
              <label htmlFor="rp-discount" className="rp-field-row__label">
                <span>{t.discountLabel}</span>
              </label>
              <div className="rp-field-row__control min-w-0">
                <div className="flex flex-wrap gap-2">
                  <input
                    id="rp-discount"
                    className="rp-input min-w-[7rem] flex-1 basis-[7rem]"
                    value={discountInput}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={Boolean(visibleDiscountError)}
                    aria-describedby="rp-discount-status"
                    onChange={(event) => changeDiscountInput(event.target.value)}
                    onKeyDown={onDiscountKeyDown}
                  />
                  <button
                    type="button"
                    className="rp-button rp-button--quiet"
                    disabled={discountPending}
                    aria-busy={discountPending}
                    onClick={() => void applyDiscount()}
                  >
                    {discountPending ? t.processing : t.discountApply}
                  </button>
                </div>
                <div id="rp-discount-status" aria-live="polite">
                  {visibleDiscountError && <FieldMessage>{visibleDiscountError}</FieldMessage>}
                  {discount && (
                    <p className="rp-success mt-2 flex gap-2 text-sm font-semibold">
                      <CircleCheckBig aria-hidden="true" size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                      <span>
                        {t.discountApplied(discount.code, formatPrice(discount.amount), formatPrice(discount.total))}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {fields.showTerms && (
            <FormSlot>
              <div>
                <label className="rp-choice relative flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.termsAccepted}
                    required
                    aria-invalid={Boolean(errors.terms)}
                    aria-describedby={errors.terms ? 'rp-terms-error' : undefined}
                    data-field="terms"
                    onChange={(event) => {
                      const termsAccepted = event.target.checked
                      setForm((current) => ({ ...current, termsAccepted }))
                      if (termsAccepted) clearError('terms')
                    }}
                  />
                  <span
                    className="rp-checkbox"
                    data-checked={form.termsAccepted}
                    data-invalid={Boolean(errors.terms)}
                    aria-hidden="true"
                  >
                    {form.termsAccepted && <Check size={18} strokeWidth={3} />}
                  </span>
                  <span className="text-[0.9375rem] leading-snug">
                    {fields.termsText || t.termsFallback}
                  </span>
                </label>
                {errors.terms && <FieldMessage id="rp-terms-error">{message(errors.terms)}</FieldMessage>}
                {fields.termsDetail && (
                  <details className="rp-details mt-2 pl-10">
                    <summary>{t.termsDetailToggle}</summary>
                    <p className="mt-2 text-[0.875rem] leading-relaxed text-(--rp-text-soft)">{fields.termsDetail}</p>
                  </details>
                )}
              </div>
            </FormSlot>
          )}

          <FormSlot>
            <div className="grid gap-5">
              {fields.showSummary && (
                <aside aria-label={t.ticketCardLabel}>
                  <TicketStub
                    eventTitle={eventTitle}
                    dateText={content.hero.dateText}
                    location={content.hero.location}
                    attendee={form.fullName}
                    ticketName={ticket?.ticket_name ?? null}
                    sessionName={chosenSessions.map((item) => item.name).join(LIST_SEPARATOR) || singleSessionName}
                    showSession={sessions.length > 0}
                    showTicket={!autoTicket}
                    subtotal={subtotal}
                    discount={discount}
                    t={t}
                  />
                </aside>
              )}

              <div>
                <button
                  type="submit"
                  className="rp-button rp-button--primary"
                  disabled={submitting || discountPending}
                  aria-busy={submitting}
                >
                  {submitting && <LoaderCircle aria-hidden="true" size={20} className="animate-spin" />}
                  {submitting ? t.processing : t.submit}
                </button>
                <div aria-live="polite">
                  {visibleSubmitError && <FieldMessage>{visibleSubmitError}</FieldMessage>}
                  {attempted && errorCount > 0 && <FieldMessage>{t.pendingFixes(errorCount)}</FieldMessage>}
                  {previewBlocked && (
                    <p className="mt-2 text-sm font-medium text-(--rp-text-soft)">{t.previewNotice}</p>
                  )}
                </div>
              </div>
            </div>
          </FormSlot>
        </div>
      </form>
    </motion.section>
  )
}
