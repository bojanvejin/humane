"use client"

import * => React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@humane/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetOverlay, SheetPortal, SheetTrigger } from "@/components/ui/sheet" // Import Sheet components

const sidebarVariants = cva(
  "flex h-full flex-col overflow-hidden border-r bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "bg-sidebar",
        primary: "bg-sidebar-primary text-sidebar-primary-foreground",
      },
      size: {
        default: "w-64",
        sm: "w-48",
        lg: "w-80",
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
  trigger?: React.ReactNode // Optional trigger element for mobile
  children?: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, size, asChild = false, trigger, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <>
        {/* Mobile Sidebar Trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              {trigger || (
                <Button
                  data-sidebar="trigger"
                  variant="ghost" // Ensure variant is passed
                  size="icon" // Ensure size is passed
                  className="fixed left-4 top-4 z-50 md:hidden"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              )}
            </SheetTrigger>
            <SheetContent
              side="left"
              className={cn(
                "p-0", // Remove default padding from SheetContent
                sidebarVariants({ variant, size, className })
              )}
            >
              {children}
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <Comp
          ref={ref}
          className={cn(
            "hidden md:flex", // Hide on mobile, show on desktop
            sidebarVariants({ variant, size, className })
          )}
          {...props}
        >
          {children}
        </Comp>
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar, sidebarVariants }