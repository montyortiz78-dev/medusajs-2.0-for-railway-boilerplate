"use client"

import { Popover, Transition } from "@headlessui/react"
import { Button } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <Popover.Button className="h-full focus:outline-none">
          <LocalizedClientLink
            className="hover:text-pink-400 transition-colors duration-200 font-bold text-gray-300"
            href="/cart"
            data-testid="nav-cart-link"
          >{`Cart (${totalItems})`}</LocalizedClientLink>
        </Popover.Button>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 w-[420px] glass rounded-b-2xl border-x border-b border-white/10"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center border-b border-white/10">
              <h3 className="text-large-semi text-white">Your Cart</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px py-4">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => {
                      // --- CUSTOM KANDI LOGIC ---
                      const kandiName = item.metadata?.kandi_name as string | undefined;
                      const kandiVibe = item.metadata?.kandi_vibe as string | undefined;
                      const customImage = item.metadata?.image_url as string | undefined;
                      const patternData = item.metadata?.pattern_data;

                      // Build the Remix Link logic
                      let productLink = `/products/${item.variant?.product?.handle}`;
                      if (kandiName && patternData) {
                          const remixPayload = JSON.stringify({
                              name: kandiName,
                              vibe: kandiVibe,
                              pattern: patternData
                          });
                          const encoded = btoa(encodeURIComponent(remixPayload));
                          productLink = `/create?remix=${encoded}`;
                      }
                      // ---------------------------

                      return (
                        <div
                          className="grid grid-cols-[80px_1fr] gap-x-4"
                          key={item.id}
                          data-testid="cart-item"
                        >
                          <LocalizedClientLink
                            href={productLink}
                            className="w-20"
                          >
                            <Thumbnail
                              thumbnail={customImage || item.variant?.product?.thumbnail}
                              images={item.variant?.product?.images}
                              size="square"
                            />
                          </LocalizedClientLink>
                          <div className="flex flex-col justify-between flex-1">
                            <div className="flex flex-col flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                  <h3 className="text-base-regular overflow-hidden text-ellipsis font-bold text-white">
                                    <LocalizedClientLink
                                      href={productLink}
                                      data-testid="product-link"
                                    >
                                      {kandiName || item.title}
                                    </LocalizedClientLink>
                                  </h3>
                                  
                                  {/* Vibe Subtitle */}
                                  {kandiVibe && (
                                    <span className="text-xs text-gray-400 italic truncate mb-1 block">
                                      "{kandiVibe}"
                                    </span>
                                  )}

                                  {/* Variant Options (Hidden for custom items) */}
                                  {!kandiName && (
                                    <LineItemOptions
                                      variant={item.variant}
                                      data-testid="cart-item-variant"
                                      data-value={item.variant}
                                    />
                                  )}
                                  
                                  <span
                                    data-testid="cart-item-quantity"
                                    data-value={item.quantity}
                                    className="text-gray-500 text-small-regular"
                                  >
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                                <div className="flex justify-end text-white">
                                  <LineItemPrice item={item} style="tight" />
                                </div>
                              </div>
                            </div>
                            <DeleteButton
                              id={item.id}
                              className="mt-1 self-start text-xs text-red-500 hover:text-red-400 transition-colors"
                              data-testid="cart-item-remove-button"
                            >
                              Remove
                            </DeleteButton>
                          </div>
                        </div>
                      )
                    })}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular border-t border-white/10 bg-black/40">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">
                      Subtotal{" "}
                      <span className="font-normal text-gray-500">(excl. taxes)</span>
                    </span>
                    <span
                      className="text-large-semi text-white"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code || "usd",
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full h-10 bg-white text-black hover:bg-gray-200 font-bold"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Go to cart
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center text-gray-400">
                  <div className="bg-zinc-800 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                    <span>0</span>
                  </div>
                  <span>Your shopping bag is empty.</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">Go to all products page</span>
                        <Button onClick={close} variant="secondary" className="border-white/20 text-white hover:bg-white/10">
                            Explore products
                        </Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown