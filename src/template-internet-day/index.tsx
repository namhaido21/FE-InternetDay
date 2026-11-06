'use client'

import App from './src/App'
import './src/index.css'
import type { RegistrationPageProps } from './src/types'

export default function RegistrationTemplate(props: RegistrationPageProps) {
  return <App {...props} />
}
