import type { CSSProperties } from 'react'
import { SESSION_COLUMNS } from '../config'
import type { Messages } from '../i18n'
import type { Language, Session } from '../types'
import { formatSessionTime } from './format'
import { FieldMessage, GroupHeader, RadioMark } from './FormParts'

interface SessionSelectorProps {
  sessions: Session[]
  selectedCodes: string[]
  multiple: boolean
  onSelect: (code: string) => void
  error?: string
  language: Language
  showTime: boolean
  showDescription: boolean
  t: Messages
}

export function SessionSelector({
  sessions,
  selectedCodes,
  multiple,
  onSelect,
  error,
  language,
  showTime,
  showDescription,
  t,
}: SessionSelectorProps) {
  const errorId = 'rp-session-error'
  // The first row takes the leftovers, so every later row is full: 2 + 3 for five sessions.
  const firstFullRow = sessions.length % SESSION_COLUMNS

  return (
    <fieldset aria-describedby={error ? errorId : undefined} data-group="session" tabIndex={-1}>
      <GroupHeader
        title={t.sessionLegend}
        hint={multiple ? t.sessionHintMultiple : t.sessionHint}
        done={selectedCodes.length > 0}
      />

      <div className="rp-session-grid" style={{ '--rp-session-columns': SESSION_COLUMNS } as CSSProperties}>
        {sessions.map((session, index) => {
          const checked = selectedCodes.includes(session.session_code)
          const time = showTime && formatSessionTime(session.start_time, session.end_time, language)
          return (
            <label
              key={session.id}
              className="rp-session rp-choice"
              data-row-start={firstFullRow > 0 && index === firstFullRow}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name="rp-session"
                className="sr-only"
                value={session.session_code}
                checked={checked}
                data-field="session"
                onChange={() => onSelect(session.session_code)}
              />
              <RadioMark checked={checked} />
              <span className="min-w-0">
                <span className="block leading-snug">{session.name}</span>
                {time && (
                  <span className="block text-[0.8125rem] leading-snug text-(--rp-text-soft) tabular-nums">
                    {time}
                  </span>
                )}
                {showDescription && session.description && (
                  <span className="block text-[0.8125rem] leading-snug text-(--rp-text-soft)">
                    {session.description}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>

      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </fieldset>
  )
}
