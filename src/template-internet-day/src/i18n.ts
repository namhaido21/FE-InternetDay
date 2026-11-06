import { LOCALE_BY_LANGUAGE } from './config'
import type { Language } from './types'

const count = (language: Language, value: number) =>
  new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language]).format(value)

/**
 * Fixed interface copy. Event-specific copy lives in schema.json instead, and the Labels block
 * there can replace any plain string below without a code change.
 */
const vi = {
  eventFallback: 'Đăng ký tham dự sự kiện',
  dateLabel: 'Thời gian',
  locationLabel: 'Địa điểm',
  agendaHeading: 'Lịch trình',
  registerNow: 'Đăng ký ngay',
  formHeading: 'ĐĂNG KÝ THAM GIA',

  ticketLegend: 'Loại vé',
  ticketHint: 'Chọn một loại vé',
  ticketEmpty: 'Chưa có loại vé',
  ticketSoldOut: 'Hết vé',
  ticketNotOpen: 'Chưa mở bán',
  ticketRemaining: (value: number) => `Còn ${count('vi', value)} vé`,

  sessionLegend: 'Phiên tham dự',
  sessionHint: 'Chọn một trong số các lựa chọn sau',
  sessionHintMultiple: 'Chọn một hoặc nhiều lựa chọn sau',

  detailsLegend: 'Thông tin người tham dự',
  fullName: 'Họ và tên',
  email: 'Email',
  phone: 'Số điện thoại',
  position: 'Chức danh',
  workplace: 'Vị trí công tác',
  company: 'Đơn vị công tác',
  industry: 'Ngành/lĩnh vực công tác',
  role: 'Tham gia với vai trò',
  selectPlaceholder: 'Lựa chọn câu trả lời',
  termsFallback: 'Tôi đồng ý với điều khoản tham dự.',
  termsDetailToggle: 'Xem nội dung điều khoản',

  discountLabel: 'Mã ưu đãi (nếu có)',
  discountApply: 'Áp dụng',
  discountApplied: (code: string, amount: string, total: string) =>
    `Đã áp dụng mã ${code}: giảm ${amount}, tổng mới ${total}.`,

  ticketCardLabel: 'Vé của bạn',
  stubAttendee: 'Người tham dự',
  stubTicket: 'Loại vé',
  stubSession: 'Phiên',
  stubNotChosen: 'Chưa chọn',
  stubNotFilled: 'Chưa nhập',
  stubSubtotal: 'Tạm tính',
  stubDiscount: 'Ưu đãi',
  stubTotal: 'Tổng tiền',
  stubCode: 'Mã vé',
  stubReference: 'Mã đơn',
  stubQrAlt: (code: string) => `Mã QR của vé ${code}`,

  submit: 'Gửi đăng ký',
  processing: 'Đang xử lý…',
  previewNotice: 'Đây là bản xem trước nên đăng ký không được gửi đi.',
  pendingFixes: (count: number) =>
    `Còn ${count} mục cần sửa, vui lòng xem dòng báo lỗi ngay dưới từng mục.`,

  confirmationTitleFallback: 'Cảm ơn bạn đã đăng ký!',
  emailSent: (email: string) => `Đã gửi email xác nhận tới ${email}`,
  summaryHeading: 'Thông tin đã đăng ký',
  registerAgain: 'Đăng ký mới',

  errors: {
    fullNameRequired: 'Vui lòng nhập họ và tên của bạn.',
    emailRequired: 'Vui lòng nhập email để nhận vé, ví dụ ten@congty.com.',
    emailInvalid: 'Vui lòng nhập email đúng định dạng, ví dụ ten@congty.com.',
    phoneRequired: 'Vui lòng nhập số điện thoại, ví dụ 0901234567.',
    phoneInvalid: 'Vui lòng nhập số điện thoại từ 9 đến 11 chữ số, có thể thêm dấu + ở đầu, ví dụ 0901234567.',
    ticketRequired: 'Vui lòng chọn một loại vé còn mở bán.',
    sessionRequired: 'Vui lòng chọn ít nhất một phiên tham dự.',
    termsRequired: 'Vui lòng tick vào ô này để đồng ý với điều khoản trước khi gửi.',
    discountEmpty: 'Vui lòng nhập mã ưu đãi rồi bấm Áp dụng.',
    discountNeedsTicket: 'Vui lòng chọn loại vé trước khi áp mã.',
  },
}

export type Messages = typeof vi

// Typed as Messages so a key missing from this language fails the build.
const en: Messages = {
  eventFallback: 'Event registration',
  dateLabel: 'Date and time',
  locationLabel: 'Venue',
  agendaHeading: 'Schedule',
  registerNow: 'Register now',
  formHeading: 'REGISTER TO ATTEND',

  ticketLegend: 'Ticket type',
  ticketHint: 'Choose one ticket type',
  ticketEmpty: 'No ticket types yet',
  ticketSoldOut: 'Sold out',
  ticketNotOpen: 'Not on sale yet',
  ticketRemaining: (value: number) => `${count('en', value)} left`,

  sessionLegend: 'Session',
  sessionHint: 'Choose one of the following options',
  sessionHintMultiple: 'Choose one or more of the following options',

  detailsLegend: 'Attendee details',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone number',
  position: 'Job title',
  workplace: 'Work position',
  company: 'Organization',
  industry: 'Industry or field',
  role: 'Attending as',
  selectPlaceholder: 'Select an answer',
  termsFallback: 'I agree to the attendance terms.',
  termsDetailToggle: 'Read the terms',

  discountLabel: 'Discount code (optional)',
  discountApply: 'Apply',
  discountApplied: (code: string, amount: string, total: string) =>
    `Code ${code} applied: ${amount} off, new total ${total}.`,

  ticketCardLabel: 'Your ticket',
  stubAttendee: 'Attendee',
  stubTicket: 'Ticket',
  stubSession: 'Session',
  stubNotChosen: 'Not chosen',
  stubNotFilled: 'Not filled in',
  stubSubtotal: 'Subtotal',
  stubDiscount: 'Discount',
  stubTotal: 'Total',
  stubCode: 'Ticket code',
  stubReference: 'Order ref.',
  stubQrAlt: (code: string) => `QR code for ticket ${code}`,

  submit: 'Submit registration',
  processing: 'Processing…',
  previewNotice: 'This is a preview, so the registration was not sent.',
  pendingFixes: (count: number) =>
    `${count} ${count === 1 ? 'item needs' : 'items need'} fixing. See the message under each one.`,

  confirmationTitleFallback: 'Thank you for registering!',
  emailSent: (email: string) => `A confirmation email was sent to ${email}`,
  summaryHeading: 'Your registration',
  registerAgain: 'New registration',

  errors: {
    fullNameRequired: 'Please enter your full name.',
    emailRequired: 'Please enter an email to receive your ticket, for example name@company.com.',
    emailInvalid: 'Please enter a valid email, for example name@company.com.',
    phoneRequired: 'Please enter your phone number, for example 0901234567.',
    phoneInvalid:
      'Please enter a phone number of 9 to 11 digits, with an optional + at the start, for example 0901234567.',
    ticketRequired: 'Please choose a ticket type that is on sale.',
    sessionRequired: 'Please choose at least one session.',
    termsRequired: 'Please tick this box to accept the terms before submitting.',
    discountEmpty: 'Please enter a discount code, then press Apply.',
    discountNeedsTicket: 'Please choose a ticket type before applying a code.',
  },
}

export const messages: Record<Language, Messages> = { vi, en }

export type ErrorKey = keyof Messages['errors']

/** Keys holding plain text, as opposed to the functions and the errors group. */
export type TextKey = {
  [Key in keyof Messages]: Messages[Key] extends string ? Key : never
}[keyof Messages]

/** Applies the schema's Labels on top of the fixed copy. Unknown keys and non-text entries are ignored. */
export function withLabels(base: Messages, labels: Record<string, string>): Messages {
  const known = Object.entries(labels).filter(([key]) => typeof base[key as keyof Messages] === 'string')
  return { ...base, ...Object.fromEntries(known) }
}
