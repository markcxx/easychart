"use client"

import * as React from "react"
import * as SliderPrimitives from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitives.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center cursor-pointer",
      className
    )}
    {...props}
  >
    <SliderPrimitives.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-variant">
      <SliderPrimitives.Range className="absolute h-full bg-primary" />
    </SliderPrimitives.Track>
    <SliderPrimitives.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-surface-container-lowest ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-surface-container-low" />
  </SliderPrimitives.Root>
))
Slider.displayName = SliderPrimitives.Root.displayName

export { Slider }
