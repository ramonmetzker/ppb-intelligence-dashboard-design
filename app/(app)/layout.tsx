import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { PlanProvider } from '@/components/app/plan-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <div className="flex min-h-screen gap-2 p-2">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col px-1">
          <TopBar />
          <main className="flex-1 pb-4">{children}</main>
        </div>
      </div>
    </PlanProvider>
  )
}
