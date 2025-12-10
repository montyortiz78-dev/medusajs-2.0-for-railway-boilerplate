"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import SortProducts, { SortOptions } from "./sort-products"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type RefinementListProps = {
  sortBy: SortOptions
  categories: HttpTypes.StoreProductCategory[]
  activeCategory?: string
}

const RefinementList = ({ sortBy, categories, activeCategory }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "all") {
          params.delete(name)
      } else {
          params.set(name, value)
      }
      params.delete("page") // Reset page on filter change
      return params.toString()
    },
    [searchParams]
  )

  const setCategory = (value: string) => {
    router.push(pathname + "?" + createQueryString("category", value))
  }

  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      
      {/* Categories Section */}
      <div className="flex gap-x-3 small:flex-col small:gap-y-3">
        <span className="text-base-semi">Categories</span>
        <ul className="text-base-regular flex flex-col gap-y-2">
            <li>
                <button 
                    onClick={() => setCategory("all")}
                    className={clx(
                        "text-ui-fg-subtle hover:text-ui-fg-base transition-colors text-left",
                        { "text-ui-fg-base font-semibold": !activeCategory }
                    )}
                >
                    All Products
                </button>
            </li>
            {categories?.map((c) => (
                <li key={c.id}>
                    <button 
                        onClick={() => setCategory(c.handle)}
                        className={clx(
                            "text-ui-fg-subtle hover:text-ui-fg-base transition-colors text-left",
                            { "text-ui-fg-base font-semibold": activeCategory === c.handle }
                        )}
                    >
                        {c.name}
                    </button>
                </li>
            ))}
        </ul>
      </div>

      {/* Sort Section */}
      <div className="flex gap-x-3 small:flex-col small:gap-y-3">
        <span className="text-base-semi">Sort by</span>
        <SortProducts 
            sortBy={sortBy} 
            setQueryParams={(name, value) => {
                router.push(pathname + "?" + createQueryString(name, value))
            }} 
        />
      </div>
    </div>
  )
}

export default RefinementList