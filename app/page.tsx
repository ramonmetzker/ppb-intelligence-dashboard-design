import { AppSidebar } from '@/components/shell/app-sidebar'
import { TopBar } from '@/components/shell/top-bar'
import { PageHeader } from '@/components/dashboard/page-header'
import { PpbStatus } from '@/components/dashboard/ppb-status'
import { TrajectorySection } from '@/components/dashboard/trajectory-section'
import { RecommendedActions } from '@/components/dashboard/recommended-actions'
import { OptimizationStrip } from '@/components/dashboard/optimization-strip'
import { RiskSection } from '@/components/dashboard/risk-section'
import { CategoryMatrix } from '@/components/dashboard/category-matrix'
import { CostIntelligence } from '@/components/dashboard/cost-intelligence'
import { OctoberClosing } from '@/components/dashboard/october-closing'
import { AttentionQueue } from '@/components/dashboard/attention-queue'

export default function Page() {
  return (
    <div className="flex min-h-screen gap-3 bg-shell p-3">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-clip rounded-2xl border border-border bg-background">
        <TopBar />
        <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-8 pt-8 pb-12">
          <PageHeader />
          <PpbStatus />
          <TrajectorySection />
          <RecommendedActions />
          <OptimizationStrip />
          <RiskSection />
          <CategoryMatrix />
          <CostIntelligence />
          <OctoberClosing />
          <AttentionQueue />
        </main>
      </div>
    </div>
  )
}
