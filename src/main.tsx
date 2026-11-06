import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createRealApi, type EventAddress, fetchServerData } from './api/realApi'
import './mock/demo.css'
import { createMockApi } from './mock/mockApi'
import serverDataEn from './mock/serverData.en.json'
import serverDataVi from './mock/serverData.json'
import Template from './template-internet-day'
import schema from './template-internet-day/schema.json'
import { resolveContent, themeAttributes } from './template-internet-day/src/components/content'
import { THEME_DEFAULTS } from './template-internet-day/src/config'
import type { Language, RegistrationContent, ServerData } from './template-internet-day/src/types'

type Scenario = 'full' | 'single' | 'paid' | 'previewData' | 'preview' | 'sparse'

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'full', label: 'Đầy đủ dữ liệu' },
  { value: 'single', label: 'Chỉ có 1 phiên' },
  { value: 'paid', label: 'Vé 150.000 đ (thử SALE10)' },
  { value: 'previewData', label: 'Xem trước, có serverData' },
  { value: 'preview', label: 'Xem trước, không có serverData' },
  { value: 'sparse', label: 'Content rỗng, không có serverData' },
]

// With ?parts=all the demo switches on the form parts the event has turned off, so they can be tested.
const SHOW_ALL_PARTS = new URLSearchParams(window.location.search).has('parts')

// Test scenarios stay out of the way unless the page is opened with ?demo.
const SHOW_SCENARIOS = new URLSearchParams(window.location.search).has('demo')

// The real API runs once .env.local names an event; ?demo always stays on the mock and its scenarios.
const { VITE_EVENT_CODE: eventCode, VITE_EVENT_SLUG: slug } = import.meta.env
const REAL_EVENT: EventAddress | null = eventCode && slug && !SHOW_SCENARIOS ? { eventCode, slug } : null

function buildServerData(scenario: Scenario, language: Language): ServerData | undefined {
  const base: ServerData = language === 'en' ? serverDataEn : serverDataVi
  switch (scenario) {
    case 'single':
      return { ...base, sessions: base.sessions.slice(0, 1) }
    case 'paid':
      return {
        ...base,
        ticket_types: base.ticket_types.map((ticket) => ({ ...ticket, price: '150000.00' })),
      }
    case 'preview':
    case 'sparse':
      return undefined
    default:
      return base
  }
}

function Demo() {
  const [language, setLanguage] = useState<Language>('vi')
  const [scenario, setScenario] = useState<Scenario>('full')

  const [realData, setRealData] = useState<ServerData>()

  useEffect(() => {
    if (!REAL_EVENT) return
    let current = true
    void fetchServerData(REAL_EVENT).then((data) => {
      if (current) setRealData(data)
    })
    return () => {
      current = false
    }
  }, [])

  const serverData = useMemo(
    () => (REAL_EVENT ? realData : buildServerData(scenario, language)),
    [realData, scenario, language],
  )
  const api = useMemo(
    () =>
      REAL_EVENT
        ? createRealApi(REAL_EVENT, language)
        : createMockApi(language, serverData?.ticket_types ?? []),
    [language, serverData],
  )
  const content: RegistrationContent =
    scenario === 'sparse'
      ? {}
      : SHOW_ALL_PARTS
        ? {
            ...schema.defaultData,
            Form: { ...schema.defaultData.Form, showDiscount: true, showTerms: true, showSummary: true },
          }
        : schema.defaultData

  // The demo controls borrow the event's colors, so they read as part of the page.
  const theme = themeAttributes(resolveContent(content, language).theme)
  const barInk = theme.scheme === 'dark' ? THEME_DEFAULTS.inkOnDark : THEME_DEFAULTS.inkOnLight

  useEffect(() => {
    document.documentElement.lang = language
    // The host system does this from metadata; the demo mirrors it so edits to schema.json show up.
    const { title, description, icon } = schema.defaultData.metadata
    document.title = title[language]
    document.querySelector('link[rel="icon"]')?.setAttribute('href', icon)
    document.querySelector('meta[name="description"]')?.setAttribute('content', description[language])
  }, [language])

  return (
    <>
      <div
        data-demo-bar
        style={{ ...theme.style, color: barInk }}
        className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2 rounded-full border border-current/30 bg-(--rp-bg) p-1 font-(family-name:--rp-font-body) text-sm shadow-lg"
      >
        {SHOW_SCENARIOS && (
          <label className="flex min-w-0 items-center gap-2">
            <span className="sr-only">Kịch bản demo</span>
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value as Scenario)}
              className="min-h-9 max-w-52 min-w-0 rounded-full border border-current/30 bg-(--rp-bg) px-3"
            >
              {SCENARIOS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div
          role="group"
          aria-label="Ngôn ngữ / Language"
          className="flex overflow-hidden rounded-full"
        >
          {(['vi', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={language === code}
              onClick={() => setLanguage(code)}
              className={`min-h-9 cursor-pointer rounded-full px-3 font-semibold uppercase ${
                language === code ? 'bg-(--rp-primary) text-(--rp-on-primary)' : 'hover:bg-current/10'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
      <Template
        key={scenario}
        content={{ defaultData: content }}
        language={language}
        serverData={serverData}
        isPreview={scenario === 'preview' || scenario === 'previewData'}
        api={api}
      />
    </>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  )
}
