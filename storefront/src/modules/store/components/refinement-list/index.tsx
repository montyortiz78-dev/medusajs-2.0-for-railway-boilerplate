"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import SortProducts, { SortOptions } from "./sort-products"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import NativeSelect from "@modules/common/components/native-select"

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
    router.push(pathname + "?" + createQueryString("category", value), { scroll: false })
  }

  const setSortBy = (value: string) => {
    router.push(pathname + "?" + createQueryString("sortBy", value), { scroll: false })
  }

  return (
    <div className="w-full small:w-auto">
      
      {/* MOBILE VIEW: Dropdowns (Visible on < small screens) */}
      <div className="flex flex-col gap-4 small:hidden mb-8">
        <div className="flex flex-col gap-y-2">
            <span className="text-base-semi text-ui-fg-base">Categories</span>
            <NativeSelect
                defaultValue={activeCategory || "all"}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="all">All Products</option>
                {categories?.map((c) => (
                    <option key={c.id} value={c.handle}>
                        {c.name}
                    </option>
                ))}
            </NativeSelect>
        </div>

        <div className="flex flex-col gap-y-2">
            <span className="text-base-semi text-ui-fg-base">Sort By</span>
            <NativeSelect
                defaultValue={sortBy || "created_at"}
                onChange={(e) => setSortBy(e.target.value)}
            >
                <option value="created_at">Latest Arrivals</option>
                <option value="price_asc">Price: Low - High</option>
                <option value="price_desc">Price: High - Low</option>
            </NativeSelect>
        </div>
      </div>

      {/* DESKTOP VIEW: Sidebar List (Visible on >= small screens) */}
      <div className="hidden small:flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
        
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
                  router.push(pathname + "?" + createQueryString(name, value), { scroll: false })
              }} 
          />
        </div>
      </div>
    </div>
  )
}

export default RefinementList