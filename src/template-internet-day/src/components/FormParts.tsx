import { motion } from 'framer-motion'
import { Check, CircleAlert, CircleCheckBig, Minus } from 'lucide-react'
import type { ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode } from 'react'
import { useId } from 'react'

export function FieldMessage({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <motion.p
      id={id}
      className="rp-error"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <CircleAlert aria-hidden="true" size={16} strokeWidth={2.25} />
      <span>{children}</span>
    </motion.p>
  )
}

interface GroupHeaderProps {
  title: string
  hint: string
  done: boolean
}

/** One line in the wording of the print form; its tick lights up once the choice is made. */
export function GroupHeader({ title, hint, done }: GroupHeaderProps) {
  return (
    <legend className="rp-group-header">
      <span>
        {title}: {hint}:
      </span>
      <motion.span
        key={String(done)}
        className="rp-group-header__tick"
        data-done={done}
        initial={{ scale: done ? 0.7 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      >
        <CircleCheckBig aria-hidden="true" size={26} strokeWidth={2.5} />
      </motion.span>
    </legend>
  )
}

/** Holds content that has no side label; see .rp-field-row__slot for where it sits. */
export function FormSlot({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className="rp-field-row">
      <div className={`rp-field-row__slot min-w-0 ${className}`}>{children}</div>
    </div>
  )
}

export function RadioMark({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  return (
    <span className="rp-mark" data-checked={checked} data-disabled={disabled} aria-hidden="true">
      {checked && <Check size={18} strokeWidth={3} />}
      {disabled && <Minus size={16} strokeWidth={2.5} />}
    </span>
  )
}

interface FieldRowProps {
  label: string
  error?: string
  help?: string
  children: (describedBy: string | undefined, inputId: string, errorId: string) => ReactNode
}

function FieldRow({ label, error, help, children }: FieldRowProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const helpId = `${inputId}-help`
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="rp-field-row">
      <label htmlFor={inputId} className="rp-field-row__label">
        <span>{label}</span>
      </label>
      <div className="rp-field-row__control min-w-0">
        {children(describedBy, inputId, errorId)}
        {help && !error && (
          <p id={helpId} className="mt-1.5 pl-[1.375rem] text-[0.8125rem] leading-snug text-(--rp-text-soft)">
            {help}
          </p>
        )}
        {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
      </div>
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  type?: HTMLInputTypeAttribute
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel'
  required?: boolean
  error?: string
  help?: string
  fieldKey?: string
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  autoComplete,
  inputMode,
  required = false,
  error,
  help,
  fieldKey,
}: TextFieldProps) {
  return (
    <FieldRow label={label} error={error} help={help}>
      {(describedBy, inputId) => (
        <input
          id={inputId}
          className="rp-input"
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          data-field={fieldKey}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      )}
    </FieldRow>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder: string
  onChange: (value: string) => void
  error?: string
  fieldKey?: string
}

export function SelectField({ label, value, options, placeholder, onChange, error, fieldKey }: SelectFieldProps) {
  return (
    <FieldRow label={label} error={error}>
      {(describedBy, inputId) => (
        <select
          id={inputId}
          className="rp-input rp-select"
          value={value}
          data-empty={!value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          data-field={fieldKey}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldRow>
  )
}
