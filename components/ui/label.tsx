import * as React from "react"
import * as Label from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Root = React.forwardRef<
  React.ElementRef<typeof Label.Root>,
  React.ComponentPropsWithoutRef<typeof Label.Root>
>(({ className, ...props }, ref) => (
  <Label.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Root.displayName = "Label"

export { Root as Label }
