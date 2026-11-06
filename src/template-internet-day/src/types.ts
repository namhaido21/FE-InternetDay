/* -------------------------------------------------------------------------- */
/* Contract types, copied unchanged from the integration brief.                */
/* -------------------------------------------------------------------------- */

export type Language = 'vi' | 'en'
export type LocalizedText = { vi: string; en: string }

export interface TicketType {
  id: number
  ticket_name: string
  ticket_code: string // sent to the API
  price: string // numeric string, e.g. "0.00", "150000.00"
  total_quantity: number
  available_quantity: number
  sold_quantity: number
  sale_start_time: string // ISO 8601
  sale_end_time: string
  description: string | null
}

export interface Session {
  id: number
  name: string
  session_code: string // sent to the API
  start_time: string
  end_time: string
  description: string | null
}

export interface ServerData {
  event_name: string
  ticket_types: TicketType[]
  sessions: Session[]
}

export interface RegistrationPageProps {
  content: { defaultData: RegistrationContent } // defaultData of schema.json
  language: Language
  serverData?: ServerData // may be missing in preview
  isPreview?: boolean
  api: RegistrationApi
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string }

export interface DiscountRequest {
  discount_code: string
  ticket_types: { ticket_type: string; quantity: number }[] // ticket_type = ticket_code
}

export interface DiscountResult {
  original_total_price: string | number
  discount_total_amount: string | number
  discounted_total_price: string | number
}

export interface HolderInfo {
  display_name: string
  email: string
  phone: string
  company?: string
  position?: string
}

export interface RegistrationRequest {
  order_issuer_display_name: string
  order_issuer_email: string
  order_issuer_phone: string
  order_issuer_company?: string
  order_issuer_position?: string
  ticket_type: Record<string, number> // { [ticket_code]: 1 }
  ticket_holder_infos: Record<string, HolderInfo[]> // { [ticket_code]: [holder] }
  registered_session: string[] // [session_code] or []
  language_code: Language
  discount_code?: string // only once applied successfully
}

export interface RegistrationResult {
  ticket_code: string[]
  qrcode_url: (string | null)[]
  order: { reference_id: string }
}

export interface RegistrationApi {
  checkDiscount(req: DiscountRequest): Promise<ApiResult<DiscountResult>>
  register(req: RegistrationRequest): Promise<ApiResult<RegistrationResult>>
}

/* -------------------------------------------------------------------------- */
/* Template-specific types.                                                    */
/* -------------------------------------------------------------------------- */

/** Text as stored in defaultData; either language may be missing at runtime. */
export type ContentText = Partial<LocalizedText>

/** Shape of schema.json defaultData. Every key is optional: the page must survive missing fields. */
export interface RegistrationContent {
  customCSS?: string
  metadata?: {
    title?: ContentText
    description?: ContentText
    icon?: string
  }
  Theme?: {
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    fontUrl?: string
    headingFont?: string
    bodyFont?: string
  }
  Hero?: {
    bannerImage?: string
    bannerImageMobile?: string
    logo?: string
    logoAlt?: ContentText
    partnerLogo?: string
    partnerLogoAlt?: ContentText
    title?: ContentText
    tagline?: ContentText
    dateText?: ContentText
    location?: ContentText
    description?: ContentText
  }
  Agenda?: { time?: string; label?: ContentText }[]
  /** Replaces any plain string in i18n.ts, by key. */
  Labels?: Record<string, ContentText>
  Form?: {
    showDiscount?: boolean
    showTerms?: boolean
    showSummary?: boolean
    showCompany?: boolean
    showPosition?: boolean
    showWorkplace?: boolean
    showIndustry?: boolean
    showRole?: boolean
    showPosterLogos?: boolean
    showSessionTime?: boolean
    showSessionDescription?: boolean
    multipleSessions?: boolean
    hideFreeTicketChoice?: boolean
    industryOptions?: FormOption[]
    roleOptions?: FormOption[]
    backgroundImage?: string
    backgroundImageMobile?: string
    termsText?: ContentText
    termsDetail?: ContentText
  }
  Confirmation?: {
    thankYouTitle?: ContentText
    thankYouMessage?: ContentText
  }
  Footer?: {
    note?: ContentText
  }
}

/** One answer of a drop-down field in schema.json. */
export interface FormOption {
  value?: string
  label?: ContentText
}
