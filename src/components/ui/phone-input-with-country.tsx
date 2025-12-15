import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { countries, Country, defaultCountry } from "@/lib/countries";

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = "501234567",
  className,
  disabled = false,
}: PhoneInputWithCountryProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(defaultCountry);
  const [localNumber, setLocalNumber] = React.useState("");

  // Parse initial value if it contains dial code
  React.useEffect(() => {
    if (value && value.startsWith("+")) {
      const matchedCountry = countries.find(c => value.startsWith(c.dialCode));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setLocalNumber(value.replace(matchedCountry.dialCode, ""));
      }
    }
  }, []);

  // Group countries by region
  const groupedCountries = countries.reduce((acc, country) => {
    const region = country.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(country);
    return acc;
  }, {} as Record<string, Country[]>);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    // Update full phone number
    if (localNumber) {
      onChange(country.dialCode + localNumber);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, "");
    setLocalNumber(cleaned);
    onChange(selectedCountry.dialCode + cleaned);
  };

  return (
    <div className={cn("flex gap-2", className)} dir="ltr">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[120px] justify-between px-2 shrink-0"
            disabled={disabled}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 bg-background border shadow-lg z-50" align="start">
          <Command>
            <CommandInput placeholder="ابحث عن الدولة..." className="border-0" dir="rtl" />
            <CommandList className="max-h-64">
              <CommandEmpty>لم يتم العثور على دولة.</CommandEmpty>
              {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                <CommandGroup key={region} heading={region}>
                  {regionCountries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.nameEn} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-base">{country.flag}</span>
                        <span className="flex-1 text-right">{country.name}</span>
                        <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 text-left"
        dir="ltr"
        disabled={disabled}
      />
    </div>
  );
}
