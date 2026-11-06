import { motion } from 'framer-motion'
import { MailCheck, RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { LIST_SEPARATOR } from '../config'
import type { Messages } from '../i18n'
import type { ServerData } from '../types'
import type { ResolvedContent } from './content'
import { ATTENDEE_FIELDS, fieldAnswer, onlySession } from './form-model'
import type { RegistrationSnapshot } from './RegistrationForm'
import { TicketStub } from './TicketStub'

interface ConfirmationScreenProps {
  snapshot: RegistrationSnapshot
  content: ResolvedContent
  eventTitle: string
  serverData?: ServerData
  t: Messages
  onRestart: () => void
}

export function ConfirmationScreen({
  snapshot,
  content,
  eventTitle,
  serverData,
  t,
  onRestart,
}: ConfirmationScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { form, result, ticketCode, showTicket, sessionCodes } = snapshot

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'start' })
  }, [])

  // Names are looked up again so they follow the page language if it changes on this screen.
  const ticketName =
    serverData?.ticket_types.find((item) => item.ticket_code === ticketCode)?.ticket_name ?? ticketCode
  const sessions = serverData?.sessions ?? []
  const sessionName =
    sessions
      .filter((item) => sessionCodes.includes(item.session_code))
      .map((item) => item.name)
      .join(LIST_SEPARATOR) ||
    onlySession(sessions)?.name ||
    null

  const rows = [
    ...ATTENDEE_FIELDS.map((field) => ({ term: t[field.labelKey], value: fieldAnswer(field, form, content.form) })),
    { term: t.stubTicket, value: showTicket ? ticketName : '' },
    { term: t.stubSession, value: sessionName ?? '' },
  ].filter((row) => row.value)

  const code = result.ticket_code?.[0] ?? ''

  return (
    <motion.section
      aria-labelledby="rp-confirmation-heading"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_23rem]"
    >
      <div className="min-w-0">
        <h2
          id="rp-confirmation-heading"
          ref={headingRef}
          tabIndex={-1}
          className="rp-form-title scroll-mt-6 text-balance"
        >
          {content.confirmation.thankYouTitle || t.confirmationTitleFallback}
        </h2>
        {content.confirmation.thankYouMessage && (
          <p className="mt-4 max-w-[38rem] text-[1.0625rem]">{content.confirmation.thankYouMessage}</p>
        )}
        <p className="rp-success mt-4 flex items-start gap-2.5 font-semibold">
          <MailCheck aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{t.emailSent(form.email.trim())}</span>
        </p>
      </div>

      <div className="min-w-0 lg:row-span-2">
        <TicketStub
          eventTitle={eventTitle}
          dateText={content.hero.dateText}
          location={content.hero.location}
          attendee={form.fullName}
          ticketName={ticketName}
          sessionName={sessionName}
          showSession={Boolean(sessionName)}
          showTicket={showTicket}
          subtotal={snapshot.subtotal}
          discount={snapshot.discount}
          issued={{
            code,
            qrUrl: result.qrcode_url?.[0] ?? null,
            reference: result.order?.reference_id ?? '',
          }}
          t={t}
        />
      </div>

      <div className="min-w-0">
        <h3 className="rp-group-title">{t.summaryHeading}</h3>
        <dl className="mt-3 border-t border-(--rp-line)">
          {rows.map((row) => (
            <div
              key={row.term}
              className="grid gap-x-5 border-b border-(--rp-line) py-2.5 sm:grid-cols-[13rem_minmax(0,1fr)]"
            >
              <dt className="text-[0.9375rem] text-(--rp-text-soft)">{row.term}</dt>
              <dd className="font-semibold [overflow-wrap:anywhere]">{row.value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="rp-button rp-button--quiet mt-6" onClick={onRestart}>
          <RotateCcw aria-hidden="true" size={18} strokeWidth={2.25} />
          {t.registerAgain}
        </button>
      </div>
    </motion.section>
  )
}
