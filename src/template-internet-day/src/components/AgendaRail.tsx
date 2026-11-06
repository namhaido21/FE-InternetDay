import type { ResolvedContent } from './content'

interface AgendaRailProps {
  heading: string
  items: ResolvedContent['agenda']
}

export function AgendaRail({ heading, items }: AgendaRailProps) {
  return (
    <section className="rp-container mt-4 sm:mt-6" aria-labelledby="rp-agenda-heading">
      <h2 id="rp-agenda-heading" className="rp-group-title mb-3">
        {heading}
      </h2>
      <ol className="rp-agenda">
        {items.map((item, index) => (
          <li key={`${item.time}-${index}`}>
            <span className="block font-bold tabular-nums">{item.time}</span>
            <span className="block text-[0.9375rem] leading-snug text-(--rp-text-soft)">
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
