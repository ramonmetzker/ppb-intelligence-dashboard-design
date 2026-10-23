import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { PpbWorkspace } from '@/components/app/ppb-workspace'

export default function Page() {
  return (
    <div className="flex min-h-screen gap-2 p-2">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col px-1">
        <TopBar />
        <main className="flex-1">
          <PpbWorkspace />
        </main>
      </div>
    </div>
  )
}
