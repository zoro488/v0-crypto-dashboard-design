'use client'

import * as React from 'react'
import { Sidebar } from '@/app/_components/layout/Sidebar'
import { CommandMenu } from '@/app/_components/layout/CommandMenu'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/app/_components/providers/QueryProvider'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [commandOpen, setCommandOpen] = React.useState(false)

  return (
    <QueryProvider>
      <div className="flex h-screen bg-black text-white overflow-hidden">
        {/* Sidebar */}
        <Sidebar onCommandOpen={() => setCommandOpen(true)} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Command Menu (Global) */}
        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
        
        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            className: 'bg-zinc-900 border-zinc-800 text-white',
            duration: 4000,
          }}
        />
      </div>
    </QueryProvider>
  )
}

export default DashboardLayoutClient
