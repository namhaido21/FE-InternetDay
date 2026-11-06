import { MotionConfig } from 'framer-motion'
import { useMemo, useState } from 'react'
import { AgendaRail } from './components/AgendaRail'
import { ConfirmationScreen } from './components/ConfirmationScreen'
import { resolveContent, themeAttributes } from './components/content'
import { Hero } from './components/Hero'
import { RegistrationForm, type RegistrationSnapshot } from './components/RegistrationForm'
import { DEFAULT_LANGUAGE } from './config'
import { messages, withLabels } from './i18n'
import type { RegistrationPageProps } from './types'

export default function App({
  content,
  language,
  serverData,
  isPreview = false,
  api,
}: RegistrationPageProps) {
  const resolved = useMemo(() => resolveContent(content?.defaultData, language), [content, language])
  const t = useMemo(
    () => withLabels(messages[language] ?? messages[DEFAULT_LANGUAGE], resolved.labels),
    [language, resolved.labels],
  )
  const theme = themeAttributes(resolved.theme)
  const eventTitle = resolved.hero.title || serverData?.event_name || t.eventFallback

  const [snapshot, setSnapshot] = useState<RegistrationSnapshot | null>(null)
  // Remounting the form through this key is what returns every field to blank.
  const [run, setRun] = useState(0)

  return (
    <MotionConfig reducedMotion="user">
      <div className="rp-root" lang={language} data-scheme={theme.scheme} style={theme.style}>
        {resolved.theme.fontUrl && <link rel="stylesheet" href={resolved.theme.fontUrl} />}
        {resolved.customCSS && <style>{resolved.customCSS}</style>}

        <Hero hero={resolved.hero} title={eventTitle} showJumpLink={!snapshot} t={t} />

        {resolved.agenda.length > 0 && !snapshot && (
          <AgendaRail heading={t.agendaHeading} items={resolved.agenda} />
        )}

        <main>
          {snapshot ? (
            <div className="rp-container pt-12 pb-16 sm:pt-16 sm:pb-20">
              <ConfirmationScreen
                snapshot={snapshot}
                content={resolved}
                eventTitle={eventTitle}
                serverData={serverData}
                t={t}
                onRestart={() => {
                  setSnapshot(null)
                  setRun((current) => current + 1)
                }}
              />
            </div>
          ) : (
            <RegistrationForm
              key={run}
              content={resolved}
              eventTitle={eventTitle}
              serverData={serverData}
              isPreview={isPreview}
              api={api}
              language={language}
              t={t}
              moveFocusOnMount={run > 0}
              onRegistered={setSnapshot}
            />
          )}
        </main>

        {resolved.footerNote && (
          <footer className="rp-container pb-8">
            <hr className="rp-streak mb-5" />
            <p className="w-fit text-sm text-(--rp-text-soft)">{resolved.footerNote}</p>
          </footer>
        )}
      </div>
    </MotionConfig>
  )
}
