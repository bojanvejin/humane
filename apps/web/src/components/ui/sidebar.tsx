"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@humane/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const sidebarVariants = cva(
  "flex flex-col border-r bg-sidebar text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "bg-sidebar text-sidebar-foreground",
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
  trigger?: React.ReactNode // Optional trigger for mobile sheet
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, size, asChild = false, trigger, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <>
        {/* Mobile Sidebar (Sheet) */}
        <div className="block lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              {trigger || (
                <Button
                  data-sidebar="trigger"
                  variant="ghost"
                  size="icon"
                  className="fixed left-4 top-4 z-50 lg:hidden"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              )}
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Comp
                ref={ref}
                className={cn(sidebarVariants({ variant, size, className }))}
                {...props}
              >
                {children}
              </Comp>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <Comp
          ref={ref}
          className={cn(
            sidebarVariants({ variant, size, className }),
            "hidden lg:flex" // Hide on mobile, show on large screens
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