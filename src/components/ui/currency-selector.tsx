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

  // Group currencies by region
  const groupedCurrencies = currencies.reduce((acc, currency) => {
    const region = currency.region || 'أخرى';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(currency);
    return acc;
  }, {} as Record<string, Currency[]>);

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
              {selectedCurrency.flag_emoji && (
                <span className="text-lg">{selectedCurrency.flag_emoji}</span>
              )}
              <span className="font-bold text-lg">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.name}</span>
              <span className="text-muted-foreground text-sm">({selectedCurrency.code})</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50" align="start">
        <Command>
          <CommandInput placeholder="ابحث عن العملة..." className="border-0" />
          <CommandList className="max-h-80">
            <CommandEmpty>لم يتم العثور على عملة.</CommandEmpty>
            {Object.entries(groupedCurrencies).map(([region, regionCurrencies]) => (
              <CommandGroup key={region} heading={region}>
                {regionCurrencies.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.region || ''}`}
                    onSelect={() => {
                      onValueChange(currency.code)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === currency.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      {currency.flag_emoji && (
                        <span className="text-lg">{currency.flag_emoji}</span>
                      )}
                      <span className="font-bold text-lg">{currency.symbol}</span>
                      <span className="flex-1">{currency.name}</span>
                      <span className="text-muted-foreground text-sm">({currency.code})</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}