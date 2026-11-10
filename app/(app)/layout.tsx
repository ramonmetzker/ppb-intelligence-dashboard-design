import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { NotificationProvider } from '@/components/shell/notification-provider'
import { PreferencesProvider } from '@/components/shell/preferences-provider'
import { UserDialog } from '@/components/shell/user-dialog'
import { PlanProvider } from '@/components/app/plan-provider'
import { MaterialProvider } from '@/components/materials/material-provider'
import { AgentProvider } from '@/components/agent/agent-provider'
import { AgentLauncher } from '@/components/agent/agent-launcher'
import { AgentDialog } from '@/components/agent/agent-dialog'
import { readPreferences } from '@/lib/preferences'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const preferences = readPreferences(await cookies())

  return (
    <PreferencesProvider initial={preferences}>
      <NotificationProvider>
        <PlanProvider>
          <MaterialProvider>
            <AgentProvider>
              <div className="flex min-h-screen bg-background">
                <AppSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <TopBar />
                  <main className="min-w-0 flex-1">{children}</main>
                </div>
              </div>
              <AgentLauncher />
              <AgentDialog />
              <UserDialog />
            </AgentProvider>
          </MaterialProvider>
        </PlanProvider>
      </NotificationProvider>
    </PreferencesProvider>
  )
}
