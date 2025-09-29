"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@humane/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetOverlay,
  SheetPortal,
  SheetTrigger,
} from "@/components/ui/sheet"

const sidebarVariants = cva(
  "flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "border-r border-sidebar-border",
        ghost: "",
      },
      size: {
        default: "w-64",
        collapsed: "w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      open,
      onOpenChange,
      trigger,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetPortal>
          <SheetOverlay />
          <SheetContent
            side="left"
            className={cn(sidebarVariants({ variant, size, className }))}
            {...props}
            ref={ref}
          >
            {children}
          </SheetContent>
        </SheetPortal>
      </Sheet>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost" // Ensure variant is passed
    size="icon" // Ensure size is passed
    className={cn("h-8 w-8", className)}
    {...props}
  >
    <PanelLeft className="h-4 w-4" />
    <span className="sr-only">Toggle Sidebar</span>
  </Button>
))
SidebarTrigger.displayName = "SidebarTrigger"

export { Sidebar, SidebarTrigger, sidebarVariants }