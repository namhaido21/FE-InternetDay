import type { Messages } from '../i18n'
import type { TicketType } from '../types'
import { formatPrice, getTicketStatus } from './format'
import { FieldMessage, GroupHeader, RadioMark } from './FormParts'

interface TicketSelectorProps {
  tickets: TicketType[]
  selectedCode: string | null
  now: number
  onSelect: (code: string) => void
  error?: string
  t: Messages
}

export function TicketSelector({ tickets, selectedCode, now, onSelect, error, t }: TicketSelectorProps) {
  const errorId = 'rp-ticket-error'

  return (
    <fieldset aria-describedby={error ? errorId : undefined} data-group="ticket" tabIndex={-1}>
      <GroupHeader title={t.ticketLegend} hint={t.ticketHint} done={Boolean(selectedCode)} />

      {tickets.length === 0 ? (
        <p className="rounded-[1.125rem] border border-dashed border-(--rp-line) px-[1.125rem] py-4 font-medium">
          {t.ticketEmpty}
        </p>
      ) : (
        <div className="grid gap-2.5">
          {tickets.map((ticket) => {
            const status = getTicketStatus(ticket, now)
            const disabled = status !== 'open'
            const checked = selectedCode === ticket.ticket_code
            const availability =
              status === 'soldOut'
                ? t.ticketSoldOut
                : status === 'notOpen'
                  ? t.ticketNotOpen
                  : t.ticketRemaining(ticket.available_quantity)

            return (
              <label
                key={ticket.id}
                className="rp-ticket-option rp-choice"
                data-checked={checked}
                data-disabled={disabled}
              >
                <input
                  type="radio"
                  name="rp-ticket"
                  className="sr-only"
                  value={ticket.ticket_code}
                  checked={checked}
                  disabled={disabled}
                  data-field="ticket"
                  onChange={() => onSelect(ticket.ticket_code)}
                />
                <RadioMark checked={checked} disabled={disabled} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{ticket.ticket_name}</span>
                  {ticket.description && (
                    <span className="block text-[0.9375rem] leading-snug text-(--rp-text-soft)">
                      {ticket.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold whitespace-nowrap tabular-nums">
                    {formatPrice(ticket.price)}
                  </span>
                  <span
                    className={`block text-[0.875rem] whitespace-nowrap ${disabled ? 'font-semibold' : 'text-(--rp-text-soft) tabular-nums'
                      }`}
                  >
                    {availability}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </fieldset>
  )
}
