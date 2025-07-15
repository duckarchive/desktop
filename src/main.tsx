import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'

import '@/normalize.css'
import '@/index.css'
import { ToastProvider } from '@/providers/ToastProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
