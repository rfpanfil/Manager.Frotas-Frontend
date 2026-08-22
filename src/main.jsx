import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

Sentry.init({ 
  dsn: import.meta.env.VITE_SENTRY_DSN, 
  integrations: [Sentry.browserTracingIntegration()], 
  tracesSampleRate: 1.0 
});

const queryClient = new QueryClient({ 
  defaultOptions: { 
    queries: { 
      staleTime: 1000 * 60 * 5 
    } 
  } 
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
