import { motion } from 'framer-motion'
import type { Messages } from '../i18n'
import { formatPrice } from './format'
import { SafeImage } from './SafeImage'

interface TicketStubProps {
  eventTitle: string
  dateText: string
  location: string
  attendee: string
  ticketName: string | null
  sessionName: string | null
  showSession: boolean
  /** False when the visitor never chose a ticket: its name and price mean nothing to them. */
  showTicket?: boolean
  subtotal: number
  discount: { code: string; amount: string | number; total: string | number } | null
  issued?: { code: string; qrUrl: string | null; reference: string }
  t: Messages
}

function StubRow({ term, value, empty, wide = false }: { term: string; value: string | null; empty: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="rp-ticket__term">{term}</dt>
      <dd className="rp-ticket__value" data-empty={!value}>
        {value ? (
          <motion.span key={value} initial={{ opacity: 0.25 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {value}
          </motion.span>
        ) : (
          empty
        )}
      </dd>
    </div>
  )
}

/** The summary is drawn as the ticket itself: it fills in as the visitor types, then gets issued. */
export function TicketStub({
  eventTitle,
  dateText,
  location,
  attendee,
  ticketName,
  sessionName,
  showSession,
  showTicket = true,
  subtotal,
  discount,
  issued,
  t,
}: TicketStubProps) {
  const total = discount ? discount.total : subtotal

  return (
    <div className="rp-ticket">
      <div className="rp-ticket__top">
        <p className="rp-ticket__title">{eventTitle}</p>
        {(dateText || location) && (
          <p className="mt-1.5 text-[0.8125rem] leading-snug font-medium text-(--rp-ink-soft)">
            {dateText && <span className="block">{dateText}</span>}
            {location && <span className="block">{location}</span>}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <dt className="rp-ticket__term">{t.stubAttendee}</dt>
            <dd className="rp-ticket__value" data-empty={!attendee.trim()}>
              {attendee.trim() || t.stubNotFilled}
            </dd>
          </div>
          {showTicket && <StubRow term={t.stubTicket} value={ticketName} empty={t.stubNotChosen} />}
          {showSession && (
            <StubRow term={t.stubSession} value={sessionName} empty={t.stubNotChosen} wide={!showTicket} />
          )}
        </dl>
      </div>

      <div className="rp-ticket__bottom">
        {discount && (
          <dl className="mb-3 grid gap-1 text-sm font-medium tabular-nums">
            <div className="flex justify-between gap-4">
              <dt className="text-(--rp-ink-soft)">{t.stubSubtotal}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--rp-ink-soft)">
                {t.stubDiscount} ({discount.code})
              </dt>
              <dd>−{formatPrice(discount.amount)}</dd>
            </div>
          </dl>
        )}

        {showTicket && (
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold">{t.stubTotal}</span>
            <span className="rp-ticket__total whitespace-nowrap">{formatPrice(total)}</span>
          </div>
        )}

        {issued && (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-4 border-t border-(--rp-ticket-line) pt-5 first:mt-0 first:border-t-0 first:pt-0">
            <SafeImage
              src={issued.qrUrl ?? ''}
              alt={t.stubQrAlt(issued.code)}
              width={132}
              height={132}
              className="size-[8.25rem] shrink-0 rounded-lg bg-(--rp-ticket-placeholder) object-cover"
            />
            <div className="min-w-0">
              <p className="rp-ticket__term">{t.stubCode}</p>
              <p className="rp-ticket__code">{issued.code}</p>
              <p className="rp-ticket__term mt-3">{t.stubReference}</p>
              <p className="text-[0.9375rem] font-semibold tracking-wide">{issued.reference}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
