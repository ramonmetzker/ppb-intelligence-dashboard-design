import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { ItemsScoreboard } from '@/components/app/items-scoreboard'
import { ItemTrends } from '@/components/app/item-trends'

export const metadata: Metadata = { title: 'PPB items | PPB' }

export default function ItemsPage() {
  return (
    <>
      <PageHeader
        title="PPB items"
        description="How each item contributes to the score, and how your plan moves it."
      />
      <div className="flex flex-col gap-4">
        <ItemsScoreboard />
        <ItemTrends />
      </div>
    </>
  )
}
