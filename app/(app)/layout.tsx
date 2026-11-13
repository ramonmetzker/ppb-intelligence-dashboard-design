import { cookies } from 'next/headers'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { ShellProvider } from '@/components/shell/shell-provider'
import { NotificationProvider } from '@/components/shell/notification-provider'
import { PreferencesProvider } from '@/components/shell/preferences-provider'
import { AppDataTableLocale } from '@/components/shell/app-data-table-locale'
import { UserDialog } from '@/components/shell/user-dialog'
import { PlanProvider } from '@/components/app/plan-provider'
import { MaterialProvider } from '@/components/materials/material-provider'
import { ProductsProvider } from '@/components/products/products-provider'
import { RpaProvider } from '@/components/rpa/rpa-provider'
import { AgentProvider } from '@/components/agent/agent-provider'
import { AgentLauncher } from '@/components/agent/agent-launcher'
import { AgentDialog } from '@/components/agent/agent-dialog'
import { UiParametersProvider } from '@/components/ui-parameters/ui-parameters-provider'
import { SalesDemandProvider } from '@/components/sales-demand/sales-demand-provider'
import { readPreferences } from '@/lib/preferences'
import { ACK_COOKIE, parseAcknowledgements } from '@/lib/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const preferences = readPreferences(store)
  const acknowledgements = parseAcknowledgements(store.get(ACK_COOKIE)?.value)

  return (
    <PreferencesProvider initial={preferences}>
      <AppDataTableLocale>
      <NotificationProvider initialAcknowledgements={acknowledgements}>
        <PlanProvider>
          <MaterialProvider>
            <ProductsProvider>
              <UiParametersProvider>
              <SalesDemandProvider>
              <RpaProvider>
              <AgentProvider>
                <ShellProvider>
                  <div className="flex min-h-screen bg-sidebar">
                    <AppSidebar />
                    <div className="flex min-w-0 flex-1 flex-col bg-sidebar">
                      <TopBar />
                      <main className="min-w-0 flex-1 rounded-tl-2xl bg-shell p-3 shadow-[inset_1px_1px_0_var(--border)]">
                        {children}
                      </main>
                    </div>
                  </div>
                  <AgentLauncher />
                  <AgentDialog />
                  <UserDialog />
                </ShellProvider>
              </AgentProvider>
              </RpaProvider>
              </SalesDemandProvider>
              </UiParametersProvider>
            </ProductsProvider>
          </MaterialProvider>
        </PlanProvider>
      </NotificationProvider>
      </AppDataTableLocale>
    </PreferencesProvider>
  )
}
