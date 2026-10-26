import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { NotificationProvider } from '@/components/shell/notification-provider'
import { PlanProvider } from '@/components/app/plan-provider'
import { MaterialProvider } from '@/components/materials/material-provider'
import { AgentProvider } from '@/components/agent/agent-provider'
import { AgentLauncher } from '@/components/agent/agent-launcher'
import { AgentDialog } from '@/components/agent/agent-dialog'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <PlanProvider>
        <MaterialProvider>
          <AgentProvider>
            <div className="flex min-h-screen gap-2 p-2">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col px-1">
                <TopBar />
                <main className="flex-1 pb-4">{children}</main>
              </div>
            </div>
            <AgentLauncher />
            <AgentDialog />
          </AgentProvider>
        </MaterialProvider>
      </PlanProvider>
    </NotificationProvider>
  )
}
