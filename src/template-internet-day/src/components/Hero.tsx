import { ArrowDown, CalendarDays, MapPin } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useState } from 'react'
import { FORM_HEADING_ID, MOBILE_BANNER_MEDIA } from '../config'
import type { Messages } from '../i18n'
import type { ResolvedContent } from './content'
import { SafeImage } from './SafeImage'

interface HeroProps {
  hero: ResolvedContent['hero']
  title: string
  showJumpLink: boolean
  t: Messages
}

/** Scrolls without touching the URL hash, which belongs to the host page's router. */
function jumpToForm(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  const heading = document.getElementById(FORM_HEADING_ID)
  heading?.focus({ preventScroll: true })
  heading?.scrollIntoView({ block: 'start' })
}

export function Hero({ hero, title, showJumpLink, t }: HeroProps) {
  const fallbackArt = hero.bannerImage || hero.bannerImageMobile
  const [failedArt, setFailedArt] = useState('')
  const hasArt = Boolean(fallbackArt) && failedArt !== fallbackArt

  return (
    <header className="rp-hero">
      {hasArt && (
        <picture className="rp-hero__art">
          {hero.bannerImageMobile && (
            <source media={MOBILE_BANNER_MEDIA} srcSet={hero.bannerImageMobile} />
          )}
          <img src={fallbackArt} alt="" onError={() => setFailedArt(fallbackArt)} />
        </picture>
      )}

      <div className="rp-container flex flex-col pt-4 pb-12 sm:pt-6 sm:pb-16">
        <div className="rp-hero__logos flex items-start justify-between gap-4">
          <SafeImage
            src={hero.logo}
            alt={hero.logoAlt}
            className="h-auto w-[9.75rem] min-w-0 sm:w-[15rem] lg:w-[17rem]"
          />
          <SafeImage
            src={hero.partnerLogo}
            alt={hero.partnerLogoAlt}
            className="h-auto w-[8.5rem] min-w-0 sm:w-[11.5rem] lg:w-[13.5rem]"
          />
        </div>

        <div className="rp-hero__copy mt-10 max-w-[43rem] sm:mt-auto sm:max-w-[68%] sm:pt-10 lg:max-w-[47rem]">
          <h1 className="rp-hero__title">{title}</h1>

          {hero.tagline && (
            <p className="mt-3 text-lg leading-snug font-semibold text-balance sm:mt-4 sm:text-2xl">
              {hero.tagline}
            </p>
          )}

          {(hero.dateText || hero.location) && (
            <dl className="mt-5 grid gap-2 text-[0.9375rem] font-medium sm:mt-6 sm:text-base">
              {hero.dateText && (
                <div className="flex items-start gap-2.5">
                  <dt className="mt-0.5 shrink-0">
                    <CalendarDays aria-hidden="true" size={20} strokeWidth={1.75} />
                    <span className="sr-only">{t.dateLabel}</span>
                  </dt>
                  <dd>{hero.dateText}</dd>
                </div>
              )}
              {hero.location && (
                <div className="flex items-start gap-2.5">
                  <dt className="mt-0.5 shrink-0">
                    <MapPin aria-hidden="true" size={20} strokeWidth={1.75} />
                    <span className="sr-only">{t.locationLabel}</span>
                  </dt>
                  <dd>{hero.location}</dd>
                </div>
              )}
            </dl>
          )}

          {hero.description && (
            <p className="mt-4 max-w-[36rem] text-[0.9375rem] text-(--rp-text-soft) sm:text-base">
              {hero.description}
            </p>
          )}

          {showJumpLink && (
            <a
              href={`#${FORM_HEADING_ID}`}
              onClick={jumpToForm}
              className="rp-button rp-button--primary rp-button--jump mt-6"
            >
              {t.registerNow}
              <ArrowDown aria-hidden="true" size={18} strokeWidth={2.5} />
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
