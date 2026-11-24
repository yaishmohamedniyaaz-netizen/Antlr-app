import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/app/router'
import { Toaster } from 'sonner'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" toastOptions={{ className: 'font-sans text-sm' }} />
    </TooltipProvider>
  </StrictMode>,
)
