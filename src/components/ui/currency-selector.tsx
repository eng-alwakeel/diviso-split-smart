import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Currency } from "@/hooks/useCurrencies"

interface CurrencySelectorProps {
  currencies: Currency[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CurrencySelector({
  currencies,
  value,
  onValueChange,
  placeholder = "اختر العملة...",
  className
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCurrency = currencies.find(currency => currency.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.name}</span>
              <span className="text-muted-foreground">({selectedCurrency.code})</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="ابحث عن العملة..." />
          <CommandList>
            <CommandEmpty>لا توجد عملة مطابقة.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">{currency.symbol}</span>
                    <span>{currency.name}</span>
                    <span className="text-muted-foreground">({currency.code})</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}