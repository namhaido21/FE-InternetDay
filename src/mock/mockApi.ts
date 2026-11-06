import type {
  ApiResult,
  DiscountRequest,
  DiscountResult,
  Language,
  RegistrationApi,
  RegistrationRequest,
  RegistrationResult,
  TicketType,
} from '../template-internet-day/src/types'

const LATENCY_MS = 800

const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

const MESSAGES = {
  vi: {
    discount: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
    trung: 'Chưa thể hoàn tất đăng ký. Nếu bạn đã đăng ký sự kiện này trước đó, vui lòng kiểm tra hộp thư email.',
    hetve: 'Loại vé này hiện không còn đủ số lượng. Vui lòng chọn loại vé khác.',
    nhanh: 'Bạn thao tác hơi nhanh, vui lòng thử lại sau ít phút.',
    matmang: 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.',
  },
  en: {
    discount: 'This discount code is invalid or has expired.',
    trung: 'We could not complete your registration. If you have already registered for this event, please check your inbox.',
    hetve: 'There are not enough tickets of this type left. Please choose another ticket type.',
    nhanh: 'You are going a little fast. Please try again in a few minutes.',
    matmang: 'We could not reach the system. Please check your connection and try again.',
  },
} as const

const REGISTER_ERRORS = ['trung', 'hetve', 'nhanh', 'matmang'] as const

/** Builds the fake API for one page language, matching the scenario table in the brief. */
export function createMockApi(language: Language, ticketTypes: TicketType[]): RegistrationApi {
  const messages = MESSAGES[language]

  return {
    async checkDiscount(req: DiscountRequest): Promise<ApiResult<DiscountResult>> {
      console.info('[mock] checkDiscount', req)
      await wait()
      if (req.discount_code.trim().toUpperCase() !== 'SALE10') {
        return { ok: false, message: messages.discount }
      }
      const total = req.ticket_types.reduce((sum, line) => {
        const ticket = ticketTypes.find((item) => item.ticket_code === line.ticket_type)
        return sum + Number.parseFloat(ticket?.price ?? '0') * line.quantity
      }, 0)
      const discount = total * 0.1
      return {
        ok: true,
        data: {
          original_total_price: total,
          discount_total_amount: discount,
          discounted_total_price: total - discount,
        },
      }
    },

    async register(req: RegistrationRequest): Promise<ApiResult<RegistrationResult>> {
      console.info('[mock] register', req)
      await wait()
      const email = req.order_issuer_email.toLowerCase()
      const failure = REGISTER_ERRORS.find((prefix) => email.startsWith(prefix))
      if (failure) {
        return { ok: false, message: messages[failure] }
      }
      return {
        ok: true,
        data: {
          ticket_code: ['R6DGN4DR'],
          qrcode_url: ['https://picsum.photos/seed/qr/240'],
          order: { reference_id: '8QJ3TY9V' },
        },
      }
    },
  }
}
