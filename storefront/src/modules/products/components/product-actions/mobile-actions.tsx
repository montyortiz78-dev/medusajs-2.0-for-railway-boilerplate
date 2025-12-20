import { Dialog, Transition } from "@headlessui/react"
// FIX: Changed to default import
import useToggleState from "@lib/hooks/use-toggle-state"
import { Button, clx } from "@medusajs/ui"
import React, { Fragment, useMemo } from "react"

import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled?: boolean 
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled
}) => {
  const { state, open, close } = useToggleState()

  const selectedPrice = useMemo(() => {
    if (!variant || !variant.calculated_price) {
      return null
    }
    const currencyCode = variant.calculated_price.currency_code 
    if (!currencyCode) return "-"

    return variant.calculated_price.calculated_amount
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currencyCode,
        }).format(variant.calculated_price.calculated_amount)
      : "-"
  }, [variant])

  return (
    <>
      <div
        className={clx(
          "fixed bottom-0 inset-x-0 z-[50] bg-ui-bg-base border-t border-ui-border-base p-4 small:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-in-out"
        )}
      >
        <div className="flex flex-col gap-y-4">
          {(variant || product.variants?.length === 1) && (
             <div className="flex items-center justify-between">
                <span className="text-base-semi">
                    {variant?.title === "Default Variant" ? product.title : variant?.title}
                </span>
                <span className="text-base-semi text-ui-fg-interactive">
                    {selectedPrice}
                </span>
             </div>
          )}

          <div className="grid grid-cols-2 gap-x-4">
            {product.options && product.options.length > 0 && product.variants && product.variants.length > 1 && (
                <Button
                    onClick={open}
                    variant="secondary"
                    className="w-full"
                >
                    Select Options
                </Button>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={!inStock || !variant}
              isLoading={isAdding}
              className={clx("w-full", {
                  "col-span-2": !product.options || product.options.length <= 0 || product.variants?.length === 1
              })}
            >
              {!variant
                ? "Select Variant"
                : !inStock
                ? "Out of stock"
                : "Add to cart"}
            </Button>
          </div>
        </div>
      </div>

      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-ui-bg-base p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-ui-fg-base mb-4"
                  >
                    Select Options
                  </Dialog.Title>
                  
                  <div className="flex flex-col gap-y-4">
                    {product.options?.map((option) => {
                      return (
                        <div key={option.id}>
                          <OptionSelect
                            option={option}
                            current={options[option.title ?? ""]}
                            updateOption={updateOptions}
                            title={option.title ?? ""}
                            disabled={!!optionsDisabled}
                            data-testid="mobile-option-select"
                          />
                        </div>
                      )
                    })}
                  </div>
                   
                  <div className="mt-6">
                    <Button onClick={close} className="w-full">
                        Done
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions