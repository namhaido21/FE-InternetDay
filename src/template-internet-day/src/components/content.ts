import type { CSSProperties } from 'react'
import { THEME_DEFAULTS } from '../config'
import type { ContentText, FormOption, Language, RegistrationContent } from '../types'

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function text(value: ContentText | undefined, language: Language): string {
  // Any other language beats an empty slot, however many languages an event carries.
  const candidates = [value?.[language], ...Object.values(value ?? {})]
  return candidates.find((item) => item?.trim())?.trim() ?? ''
}

function color(value: string | undefined, fallback: string): string {
  return value && HEX.test(value) ? value : fallback
}

/** A font name goes into a CSS value, so anything that could end the value is removed. */
function fontName(value: string | undefined): string {
  return value?.replace(/['";{}\\]/g, '').trim() ?? ''
}

/** Answers keep a stable value, so a choice survives a change of page language. */
function options(list: FormOption[] | undefined, language: Language) {
  return (Array.isArray(list) ? list : [])
    .map((item) => ({ value: item?.value?.trim() ?? '', label: text(item?.label, language) }))
    .filter((item) => item.value && item.label)
}

/** Flattens defaultData for one language and fills every gap, so components never see undefined. */
export function resolveContent(raw: RegistrationContent | undefined, language: Language) {
  const { Theme, Hero, Agenda, Labels, Form, Confirmation, Footer, customCSS } = raw ?? {}

  return {
    customCSS: typeof customCSS === 'string' ? customCSS : '',
    theme: {
      primary: color(Theme?.primaryColor, THEME_DEFAULTS.colors.primary),
      secondary: color(Theme?.secondaryColor, THEME_DEFAULTS.colors.secondary),
      background: color(Theme?.backgroundColor, THEME_DEFAULTS.colors.background),
      // Stylesheets are only taken from secure addresses.
      fontUrl: Theme?.fontUrl?.startsWith('https://') ? Theme.fontUrl : '',
      headingFont: fontName(Theme?.headingFont),
      bodyFont: fontName(Theme?.bodyFont),
    },
    hero: {
      bannerImage: Hero?.bannerImage ?? '',
      bannerImageMobile: Hero?.bannerImageMobile ?? '',
      logo: Hero?.logo ?? '',
      logoAlt: text(Hero?.logoAlt, language),
      partnerLogo: Hero?.partnerLogo ?? '',
      partnerLogoAlt: text(Hero?.partnerLogoAlt, language),
      title: text(Hero?.title, language),
      tagline: text(Hero?.tagline, language),
      dateText: text(Hero?.dateText, language),
      location: text(Hero?.location, language),
      description: text(Hero?.description, language),
    },
    agenda: (Array.isArray(Agenda) ? Agenda : [])
      .map((item) => ({ time: item?.time?.trim() ?? '', label: text(item?.label, language) }))
      .filter((item) => item.time || item.label),
    labels: Object.fromEntries(
      Object.entries(Labels ?? {})
        .map(([key, value]) => [key, text(value, language)])
        .filter(([, value]) => value),
    ) as Record<string, string>,
    form: {
      showDiscount: Form?.showDiscount !== false,
      showTerms: Form?.showTerms !== false,
      showSummary: Form?.showSummary !== false,
      showCompany: Form?.showCompany !== false,
      showPosition: Form?.showPosition !== false,
      showWorkplace: Form?.showWorkplace !== false,
      showIndustry: Form?.showIndustry !== false,
      showRole: Form?.showRole !== false,
      showPosterLogos: Form?.showPosterLogos === true,
      showSessionTime: Form?.showSessionTime === true,
      showSessionDescription: Form?.showSessionDescription === true,
      multipleSessions: Form?.multipleSessions !== false,
      hideFreeTicketChoice: Form?.hideFreeTicketChoice !== false,
      industryOptions: options(Form?.industryOptions, language),
      roleOptions: options(Form?.roleOptions, language),
      backgroundImage: Form?.backgroundImage ?? '',
      backgroundImageMobile: Form?.backgroundImageMobile ?? '',
      termsText: text(Form?.termsText, language),
      termsDetail: text(Form?.termsDetail, language),
    },
    confirmation: {
      thankYouTitle: text(Confirmation?.thankYouTitle, language),
      thankYouMessage: text(Confirmation?.thankYouMessage, language),
    },
    footerNote: text(Footer?.note, language),
  }
}

export type ResolvedContent = ReturnType<typeof resolveContent>

function luminance(hex: string): number {
  const full = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, '$&$&') : hex
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(full.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function readableOn(hex: string): string {
  const level = luminance(hex)
  // Pick whichever ink has the higher WCAG contrast against this color.
  return (level + 0.05) / 0.05 > 1.05 / (level + 0.05) ? THEME_DEFAULTS.inkOnLight : THEME_DEFAULTS.inkOnDark
}

/** Text colors follow the background, so organizers can pick any color without losing legibility. */
export function themeAttributes(theme: ResolvedContent['theme']) {
  return {
    scheme: luminance(theme.background) > THEME_DEFAULTS.lightBackgroundLuminance ? ('light' as const) : ('dark' as const),
    style: {
      '--rp-primary': theme.primary,
      '--rp-secondary': theme.secondary,
      '--rp-bg': theme.background,
      '--rp-on-primary': readableOn(theme.primary),
      // Unset fonts fall back to the system stacks defined in index.css.
      ...(theme.bodyFont ? { '--rp-font-body': `'${theme.bodyFont}', system-ui, sans-serif` } : {}),
      ...(theme.headingFont ? { '--rp-font-display': `'${theme.headingFont}', var(--rp-font-body)` } : {}),
    } as CSSProperties,
  }
}
