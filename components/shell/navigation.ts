import {
  Cube,
  ChartBar,
  Database,
  GitBranch,
  Robot,
  SquaresFour,
  SlidersHorizontal,
  Table,
  Tag,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { Dictionary } from '@/lib/i18n'

export type NavKey = keyof Dictionary['nav']

export type AppNavGroup = {
  label: NavKey
  items: { label: NavKey; href: string; icon: Icon }[]
}

export const NAV_GROUPS: AppNavGroup[] = [
  {
    label: 'analyze',
    items: [
      { label: 'overview', href: '/', icon: SquaresFour },
      { label: 'production', href: '/production', icon: ChartBar },
      { label: 'items', href: '/items', icon: Cube },
    ],
  },
  {
    label: 'plan',
    items: [{ label: 'simulation', href: '/simulation', icon: GitBranch }],
  },
  {
    label: 'rawData',
    items: [
      { label: 'materials', href: '/raw-data/material-prices', icon: Tag },
      { label: 'ppbItems', href: '/raw-data/ppb-items', icon: Cube },
      { label: 'referenceBom', href: '/raw-data/reference-bom', icon: Table },
      { label: 'products', href: '/products', icon: Database },
      { label: 'sopDemand', href: '/raw-data/sop-demand', icon: Table },
      { label: 'salesDemand', href: '/raw-data/sales-demand', icon: Table },
      { label: 'uiParameters', href: '/raw-data/ui-parameters', icon: SlidersHorizontal },
      { label: 'dataTableTest', href: '/raw-data/data-table-test', icon: Table },
    ],
  },
  {
    label: 'automations',
    items: [{ label: 'rpaMonitor', href: '/rpa-monitor', icon: Robot }],
  },
]
