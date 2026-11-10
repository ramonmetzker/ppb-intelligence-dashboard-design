'use client'

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { PRODUCT_SEED, type Gbm, type Product } from '@/lib/products/data'

type ProductsContextValue = {
  /** Master data. The top bar product selector and the Products page read the same list. */
  products: Product[]
  setProducts: Dispatch<SetStateAction<Product[]>>
  /** GBM chosen in the top bar on master data pages. */
  gbm: Gbm
  setGbm: (gbm: Gbm) => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => [...PRODUCT_SEED])
  const [gbm, setGbm] = useState<Gbm>('MX')

  const value = useMemo(() => ({ products, setProducts, gbm, setGbm }), [products, gbm])

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('useProducts must be used within ProductsProvider')
  return context
}
