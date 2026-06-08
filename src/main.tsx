import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { invariant } from '~/lib/invariant'

const rootElement = document.getElementById('root')
invariant(rootElement, 'Root element "#root" not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
