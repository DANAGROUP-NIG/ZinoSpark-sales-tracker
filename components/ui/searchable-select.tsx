import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchableSelectOption<TMeta = unknown> = {
  value: string
  label: string
  description?: string
  searchKeywords?: string
  meta?: TMeta
}

export interface SearchableSelectProps<TMeta = unknown> {
  value?: string
  onChange: (value: string) => void
  options: SearchableSelectOption<TMeta>[]
  placeholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
  searchPlaceholder?: string
  triggerClassName?: string
  renderOption?: (option: SearchableSelectOption<TMeta>) => React.ReactNode
}

export function SearchableSelect<TMeta>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  loading = false,
  disabled,
  searchPlaceholder = "Search...",
  triggerClassName,
  renderOption,
}: SearchableSelectProps<TMeta>) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [contentWidth, setContentWidth] = React.useState<number>()

  React.useEffect(() => {
    if (triggerRef.current) {
      setContentWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", triggerClassName)}
          disabled={disabled}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={contentWidth ? { width: contentWidth } : undefined}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.searchKeywords || `${option.label} ${option.description ?? ""}`}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <div className="flex-1">
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <>
                            <p className="font-medium">{option.label}</p>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                          </>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 opacity-0 transition-opacity",
                          value === option.value && "opacity-100",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

