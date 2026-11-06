import type {
  ApiResult,
  DiscountRequest,
  DiscountResult,
  Language,
  RegistrationApi,
  RegistrationRequest,
  RegistrationResult,
  ServerData,
} from '../template-internet-day/src/types'

/** Same origin by default: in development the Vite proxy forwards these paths to the server. */
const API_ROOT = `${import.meta.env.VITE_API_ORIGIN ?? ''}/api/v1/public`

const REQUEST_TIMEOUT_MS = 30_000

const TOKEN_REJECTED = { status: 401, code: 'PUBLIC_TOKEN_INVALID' }

const MESSAGES = {
  vi: {
    connection: 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.',
    unknown: 'Đã có lỗi xảy ra. Vui lòng thử lại sau ít phút.',
    payment: 'Loại vé này cần thanh toán trực tuyến, trang đăng ký hiện chưa hỗ trợ.',
  },
  en: {
    connection: 'We could not reach the system. Please check your connection and try again.',
    unknown: 'Something went wrong. Please try again in a few minutes.',
    payment: 'This ticket type needs online payment, which this page does not support yet.',
  },
} as const

export interface EventAddress {
  eventCode: string
  slug: string
}

interface ErrorBody {
  detail?: unknown
  code?: unknown
}

interface LandingPageResponse {
  data?: { server_data?: ServerData }
}

/** The response carries more than the template's contract; this is the one extra field acted on. */
type RegisterResponse = RegistrationResult & { payment_required?: boolean }

const segment = encodeURIComponent

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function timedFetch(url: string, init?: RequestInit) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

// One page talks to one event, so one token is shared by every request and language.
let tokenRequest: Promise<string> | null = null

function getToken(eventCode: string): Promise<string> {
  tokenRequest ??= timedFetch(`${API_ROOT}/token/${segment(eventCode)}`)
    .then(async (response) => {
      const body = (await readJson(response)) as { token?: unknown } | null
      if (!response.ok || typeof body?.token !== 'string') throw new Error('No public token')
      return body.token
    })
    .catch((error: unknown) => {
      // A failed attempt must not be remembered, or every later request would fail with it.
      tokenRequest = null
      throw error
    })
  return tokenRequest
}

async function post<T>(
  path: string,
  body: DiscountRequest | RegistrationRequest,
  eventCode: string,
  language: Language,
  retryToken = true,
): Promise<ApiResult<T>> {
  try {
    const response = await timedFetch(`${API_ROOT}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
        'X-Public-Token': await getToken(eventCode),
      },
      body: JSON.stringify(body),
    })
    const payload = await readJson(response)
    if (response.ok && payload) return { ok: true, data: payload as T }

    const error = (payload ?? {}) as ErrorBody
    // The server refused before doing any work, so sending the request again is safe.
    if (retryToken && response.status === TOKEN_REJECTED.status && error.code === TOKEN_REJECTED.code) {
      tokenRequest = null
      return post<T>(path, body, eventCode, language, false)
    }
    return { ok: false, message: typeof error.detail === 'string' ? error.detail : MESSAGES[language].unknown }
  } catch {
    return { ok: false, message: MESSAGES[language].connection }
  }
}

/**
 * Tickets and sessions of the event. Paid tickets are left out because online payment is outside
 * this page's scope, and an unpaid order must not end on the thank-you screen. Returns undefined on
 * failure: the template then shows its "no tickets yet" state.
 */
export async function fetchServerData({ eventCode, slug }: EventAddress): Promise<ServerData | undefined> {
  try {
    const response = await timedFetch(`${API_ROOT}/landing-page/data/${segment(eventCode)}/${segment(slug)}`)
    const body = (await readJson(response)) as LandingPageResponse | null
    const data = response.ok ? body?.data?.server_data : undefined
    if (!data) return undefined
    return {
      ...data,
      ticket_types: data.ticket_types.filter((ticket) => !(Number.parseFloat(ticket.price) > 0)),
    }
  } catch {
    return undefined
  }
}

/** The real counterpart of createMockApi. It never throws: every failure comes back as a message. */
export function createRealApi({ eventCode, slug }: EventAddress, language: Language): RegistrationApi {
  const address = `${segment(eventCode)}/${segment(slug)}`

  return {
    checkDiscount: (req) => post<DiscountResult>(`caculate-discount/${address}`, req, eventCode, language),

    async register(req) {
      const result = await post<RegisterResponse>(`register/${address}`, req, eventCode, language)
      if (result.ok && result.data.payment_required) {
        return { ok: false, message: MESSAGES[language].payment }
      }
      return result
    },
  }
}
