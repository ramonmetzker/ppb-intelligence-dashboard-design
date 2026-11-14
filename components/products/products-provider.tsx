'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import useSWR from 'swr'
import { apiFetcher } from '@/lib/api/client'
import type { ApiResponse, ProductsResponse } from '@/lib/api/contracts'
import { PRODUCT_SEED, type Gbm, type Product } from '@/lib/products/data'


type ProductsContextValue = {
  /** Master data. The top bar product selector and the Products page read the same list. */
  products: Product[]
  setProducts: Dispatch<SetStateAction<Product[]>>
  /** GBM chosen in the top bar on master data pages. */
  gbm: Gbm
  setGbm: (gbm: Gbm) => void
  isLoading: boolean
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => [...PRODUCT_SEED])
  const [gbm, setGbm] = useState<Gbm>('MX')
  const hydratedFromApi = useRef(false)
  const { data, isLoading } = useSWR<ApiResponse<ProductsResponse>>('/api/v1/products', apiFetcher)

  useEffect(() => {
    if (!data || hydratedFromApi.current) return
    setProducts(
      data.data.items.map((product) => ({
        ...product,
        plants: product.plants.join(', '),
      })),
    )
    hydratedFromApi.current = true
  }, [data])

  const value = useMemo(() => ({ products, setProducts, gbm, setGbm, isLoading }), [products, gbm, isLoading])

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('useProducts must be used within ProductsProvider')
  return context
}
